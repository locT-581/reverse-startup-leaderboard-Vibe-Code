import { Injectable, Inject, NotFoundException, Logger, BadRequestException, forwardRef } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { StripeService } from './stripe.service';
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';

@Injectable()
export class SabotageService {
  private readonly logger = new Logger(SabotageService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => LeaderboardGateway))
    private readonly leaderboardGateway: LeaderboardGateway,
  ) {}

  async getAvailablePacks() {
    const packs = await this.db
      .select()
      .from(schema.sabotagePacks)
      .orderBy(schema.sabotagePacks.price);

    return {
      success: true,
      data: packs,
    };
  }

  async createCheckoutSession(userId: string, packId: string) {
    // 1. Verify user exists
    const userRes = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (userRes.length === 0) {
      throw new NotFoundException({
        success: false,
        error: { message: 'User not found.' },
      });
    }

    // 2. Verify pack exists
    const packRes = await this.db
      .select()
      .from(schema.sabotagePacks)
      .where(eq(schema.sabotagePacks.id, packId))
      .limit(1);

    if (packRes.length === 0) {
      throw new NotFoundException({
        success: false,
        error: { message: 'Sabotage Pack not found.' },
      });
    }

    const pack = packRes[0];

    // 3. Define checkout success and cancel URLs
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/sabotage-store?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/sabotage-store?canceled=true`;

    // 4. Create Stripe Checkout Session
    const session = await this.stripeService.createCheckoutSession({
      priceInCents: pack.price,
      packName: pack.name,
      description: pack.description,
      userId,
      packId,
      successUrl,
      cancelUrl,
    });

    // 5. Save pending purchase record
    await this.db.insert(schema.purchases).values({
      userId,
      packId,
      stripeSessionId: session.id,
      amountPaid: pack.price,
      status: 'pending',
    });

    // 6. In Mock Mode, automatically fulfill immediately
    if (this.stripeService.getIsMockMode()) {
      this.logger.log(`Mock Mode: Auto-fulfilling checkout session ${session.id} for user ${userId}`);
      await this.fulfillPurchase(session.id, userId, packId);
    }

    return {
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
    };
  }

  async fulfillPurchase(stripeSessionId: string, userId: string, packId: string) {
    // 1. Transactionally update purchase status to completed
    const purchaseRes = await this.db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.stripeSessionId, stripeSessionId))
      .limit(1);

    if (purchaseRes.length === 0) {
      this.logger.warn(`Purchase with Stripe Session ID ${stripeSessionId} not found in database. Creating a manual entry.`);
      await this.db.insert(schema.purchases).values({
        userId,
        packId,
        stripeSessionId,
        amountPaid: 0,
        status: 'completed',
      });
    } else {
      const purchase = purchaseRes[0];
      if (purchase.status === 'completed') {
        this.logger.log(`Purchase ${stripeSessionId} is already completed. Skipping fulfillment.`);
        return { success: true, message: 'Already fulfilled.' };
      }

      await this.db
        .update(schema.purchases)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(schema.purchases.id, purchase.id));
    }

    // 2. Fetch pack effectType
    const packRes = await this.db
      .select()
      .from(schema.sabotagePacks)
      .where(eq(schema.sabotagePacks.id, packId))
      .limit(1);

    if (packRes.length === 0) {
      throw new NotFoundException(`Sabotage Pack with ID ${packId} not found.`);
    }

    const pack = packRes[0];

    // 3. Upsert user inventory count
    const existingInventory = await this.db
      .select()
      .from(schema.userSabotages)
      .where(
        and(
          eq(schema.userSabotages.userId, userId),
          eq(schema.userSabotages.effectType, pack.effectType),
        ),
      )
      .limit(1);

    if (existingInventory.length > 0) {
      const inv = existingInventory[0];
      await this.db
        .update(schema.userSabotages)
        .set({ count: inv.count + 1, updatedAt: new Date() })
        .where(eq(schema.userSabotages.id, inv.id));
    } else {
      await this.db.insert(schema.userSabotages).values({
        userId,
        effectType: pack.effectType,
        count: 1,
      });
    }

    this.logger.log(`Fulfillment complete. User ${userId} received token of effect ${pack.effectType}`);
    return { success: true };
  }

  async getUserInventory(userId: string) {
    const inventory = await this.db
      .select()
      .from(schema.userSabotages)
      .where(eq(schema.userSabotages.userId, userId));

    return {
      success: true,
      data: inventory.map(item => ({
        effectType: item.effectType,
        count: item.count,
      })),
    };
  }

  async deploySabotage(userId: string, postId: string, effectType: string) {
    // 1. Retrieve the user's inventory count for effectType
    const userInventory = await this.db
      .select()
      .from(schema.userSabotages)
      .where(
        and(
          eq(schema.userSabotages.userId, userId),
          eq(schema.userSabotages.effectType, effectType),
        ),
      )
      .limit(1);

    if (userInventory.length === 0 || userInventory[0].count <= 0) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Nice try, but your arsenal is empty. Visit the store to buy some power first!' },
      });
    }

    const inventoryRecord = userInventory[0];

    // 2. Retrieve the target post
    const postRes = await this.db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, postId))
      .limit(1);

    if (postRes.length === 0) {
      throw new NotFoundException({
        success: false,
        error: { message: 'Post not found.' },
      });
    }

    const post = postRes[0];

    // 3. Calculate score deduction
    let deduction = 0;
    if (effectType === 'blur') {
      deduction = 100;
    } else if (effectType === 'comic_sans') {
      deduction = 150;
    } else if (effectType === 'papyrus') {
      deduction = 150;
    } else if (effectType === 'deduct_calories') {
      deduction = 500;
    }

    const newWastedCalories = Math.max(0, post.wastedCalories - deduction);

    // 4. Update the database in a transaction
    await this.db.transaction(async (tx) => {
      // Decrement count
      await tx
        .update(schema.userSabotages)
        .set({
          count: inventoryRecord.count - 1,
          updatedAt: new Date(),
        })
        .where(eq(schema.userSabotages.id, inventoryRecord.id));

      // Update post's wasted calories
      await tx
        .update(schema.posts)
        .set({
          wastedCalories: newWastedCalories,
          updatedAt: new Date(),
        })
        .where(eq(schema.posts.id, post.id));
    });

    // 5. Broadcast updated leaderboard
    await this.leaderboardGateway.broadcastLeaderboard();

    // 6. Broadcast custom event sabotage.deployed
    this.leaderboardGateway.emitSabotage(post.id, effectType, post.authorId);

    return {
      success: true,
      data: {
        newWastedCalories,
      },
    };
  }
}
