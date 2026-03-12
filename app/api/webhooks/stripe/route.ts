import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Map Stripe price IDs → plan names (keep in sync with checkout route)
const PRICE_TO_PLAN: Record<string, string> = {
  price_1TA9g1K4xeqJrm9xl5glOCWp: "pro",
  price_1TA9g2K4xeqJrm9xyohAwGlB: "unlimited",
};

async function updateClerkPlan(clerkId: string, plan: string) {
  const res = await fetch(
    `https://api.clerk.com/v1/users/${clerkId}/metadata`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_metadata: { plan } }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Clerk metadata update failed: ${res.status} ${body}`);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── New subscription / successful checkout ───────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const plan = session.metadata?.plan;
        if (clerkId && plan) {
          await updateClerkPlan(clerkId, plan);
          console.log(`[webhook] upgraded ${clerkId} → ${plan}`);
        }
        break;
      }

      // ── Subscription cancelled / ended ──────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        if (clerkId) {
          await updateClerkPlan(clerkId, "free");
          console.log(`[webhook] downgraded ${clerkId} → free (subscription deleted)`);
        }
        break;
      }

      // ── Plan changed (upgrade / downgrade) ──────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        if (clerkId && sub.items.data.length > 0) {
          const priceId = sub.items.data[0].price.id;
          const plan = PRICE_TO_PLAN[priceId];
          if (plan) {
            await updateClerkPlan(clerkId, plan);
            console.log(`[webhook] plan change ${clerkId} → ${plan}`);
          }
        }
        break;
      }

      default:
        // Unhandled event — return 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    console.error(`[webhook] error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
