import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, passwordHashRaw: string) {
    if (!username || !passwordHashRaw) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Username and password are required. Obviously.' }
      });
    }

    if (passwordHashRaw.length < 6) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Password must be at least 6 characters. Let us make it slightly harder to hack.' }
      });
    }

    // Check if user already exists
    const existing = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    if (existing.length > 0) {
      throw new BadRequestException({
        success: false,
        error: { message: `Username '${username}' is already taken. Try something more unique, perhaps?` }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(passwordHashRaw, 10);

    try {
      // Insert user
      const [newUser] = await this.db.insert(schema.users).values({
        username,
        passwordHash,
      }).returning();

      // Generate JWT token
      const token = this.jwtService.sign({ sub: newUser.id, username: newUser.username });

      const { passwordHash: _, ...profile } = newUser;
      return {
        success: true,
        data: {
          token,
          user: profile,
        }
      };
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('unique constraint')) {
        throw new BadRequestException({
          success: false,
          error: { message: `Username '${username}' is already taken. Try something more unique, perhaps?` }
        });
      }
      throw err;
    }
  }

  async login(username: string, passwordHashRaw: string) {
    if (!username || !passwordHashRaw) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Username and password are required. Did you forget them already?' }
      });
    }

    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: { message: 'Invalid credentials. Or maybe you do not exist yet.' }
      });
    }

    const isMatch = await bcrypt.compare(passwordHashRaw, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        success: false,
        error: { message: 'Invalid credentials. Password memory failure?' }
      });
    }

    const token = this.jwtService.sign({ sub: user.id, username: user.username });

    const { passwordHash: _, ...profile } = user;
    return {
      success: true,
      data: {
        token,
        user: profile,
      }
    };
  }

  async validateUser(id: string) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        error: { message: 'User session invalid. Please log in again.' }
      });
    }

    const { passwordHash: _, ...profile } = user;
    return {
      success: true,
      data: profile
    };
  }

  async updateProfile(userId: string, username: string, avatar: string) {
    if (!username) {
      throw new BadRequestException({
        success: false,
        error: { message: 'Username cannot be empty. It defines your leaderboard existence.' }
      });
    }

    // Check if new username is already taken by another user
    const [existing] = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    if (existing && existing.id !== userId) {
      throw new BadRequestException({
        success: false,
        error: { message: `Username '${username}' is already taken. Be original for once.` }
      });
    }

    try {
      const [updatedUser] = await this.db.update(schema.users)
        .set({ username, avatar, updatedAt: new Date() })
        .where(eq(schema.users.id, userId))
        .returning();

      const { passwordHash: _, ...profile } = updatedUser;
      return {
        success: true,
        data: profile
      };
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('unique constraint')) {
        throw new BadRequestException({
          success: false,
          error: { message: `Username '${username}' is already taken. Be original for once.` }
        });
      }
      throw err;
    }
  }
}
