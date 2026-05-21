import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_placeholder', {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    // In local testing / mock mode, we bypass signature verification
    try {
      event = JSON.parse(rawBody);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  // Process checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, packId } = session.metadata || {};
    const sessionId = session.id;

    if (!userId || !packId || !sessionId) {
      return NextResponse.json({ success: false, error: 'Missing metadata or session id' }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const jwtSecret = process.env.JWT_SECRET;

    try {
      const fulfillRes = await fetch(`${backendUrl}/sabotage/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': jwtSecret || '',
        },
        body: JSON.stringify({ sessionId, userId, packId }),
      });

      if (!fulfillRes.ok) {
        const errorData = await fulfillRes.json();
        return NextResponse.json({ success: false, error: errorData.error?.message || 'Failed to fulfill in backend.' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: 'Network error calling backend fulfillment.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
