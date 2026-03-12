import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Map Stripe price IDs → Bookaver plan names
const PRICE_TO_PLAN: Record<string, string> = {
  price_1TA9g1K4xeqJrm9xl5glOCWp: "pro",       // $9.99/mo
  price_1TA9g2K4xeqJrm9xyohAwGlB: "unlimited",  // $19.99/mo
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();

  if (!PRICE_TO_PLAN[priceId]) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: {
      clerkId: userId,
      plan: PRICE_TO_PLAN[priceId],
    },
    subscription_data: {
      metadata: {
        clerkId: userId,
        plan: PRICE_TO_PLAN[priceId],
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
