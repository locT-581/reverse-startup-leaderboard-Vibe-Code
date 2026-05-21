import { Injectable, Logger } from '@nestjs/common';
import Stripe = require('stripe');

@Injectable()
export class StripeService {
  private readonly stripe: any = null;
  private readonly isMockMode: boolean = false;
  private readonly logger = new Logger(StripeService.name);

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey || apiKey.startsWith('sk_test_mock')) {
      this.isMockMode = true;
      this.logger.log('Stripe running in Mock Mode (using mock checkout session urls).');
    } else {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-01-27.acacia' as any,
      });
      this.logger.log('Stripe initialized in production/real sandbox mode.');
    }
  }

  getIsMockMode(): boolean {
    return this.isMockMode;
  }

  async createCheckoutSession(params: {
    priceInCents: number;
    packName: string;
    description: string;
    userId: string;
    packId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    if (this.isMockMode) {
      const mockSessionId = `cs_test_mock_${Math.random().toString(36).substring(2, 15)}`;
      const mockUrl = `${params.successUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId)}`;
      return {
        id: mockSessionId,
        url: mockUrl,
      };
    }

    if (!this.stripe) {
      throw new Error('Stripe is not initialized.');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: params.packName,
              description: params.description,
            },
            unit_amount: params.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        packId: params.packId,
      },
    });

    return {
      id: session.id,
      url: session.url,
    };
  }
}
