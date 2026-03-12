"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Zap, Infinity, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanType } from "@/lib/clerk/billing";

const PRO_PRICE_ID = "price_1TA9g1K4xeqJrm9xl5glOCWp";
const UNLIMITED_PRICE_ID = "price_1TA9g2K4xeqJrm9xyohAwGlB";

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  priceId: string | null;
  highlighted: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Bookauver with a couple of books.",
    features: [
      "2 books",
      "5 voice sessions / month",
      "30 minutes / month",
      "All 3 AI personas",
      "PDF processing",
    ],
    priceId: null,
    highlighted: false,
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/ month",
    description: "For serious readers who want more.",
    features: [
      "20 books",
      "100 voice sessions / month",
      "300 minutes / month",
      "All 3 AI personas",
      "Priority processing",
    ],
    priceId: PRO_PRICE_ID,
    highlighted: true,
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$19.99",
    period: "/ month",
    description: "No limits. Read everything.",
    features: [
      "Unlimited books",
      "Unlimited sessions",
      "Unlimited minutes",
      "All 3 AI personas",
      "Priority processing",
    ],
    priceId: UNLIMITED_PRICE_ID,
    highlighted: false,
    icon: <Infinity className="w-5 h-5" />,
  },
];

interface PricingCardsProps {
  currentPlan: PlanType;
}

export default function PricingCards({ currentPlan }: PricingCardsProps) {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Success banner */}
      {upgraded && (
        <div className="mb-8 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-6 py-4 text-center">
          <p className="text-green-800 dark:text-green-300 font-semibold text-lg">
            🎉 You&apos;re all set! Your plan has been upgraded.
          </p>
          <p className="text-green-600 dark:text-green-400 text-sm mt-1">
            New limits apply immediately — enjoy the extra power.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">
          Simple Pricing
        </h1>
        <p className="mt-4 text-lg text-stone-500 dark:text-stone-400">
          Start free, upgrade when you need more.
        </p>
        {currentPlan !== "free" && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
            You&apos;re currently on the{" "}
            <span className="capitalize font-bold">{currentPlan}</span> plan.
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isLoadingThis = loading === plan.priceId;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border p-7 flex flex-col transition-shadow",
                plan.highlighted
                  ? "border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-100 dark:shadow-amber-900/20 bg-amber-50 dark:bg-amber-950/20"
                  : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/40",
                isCurrent && "ring-2 ring-amber-500 dark:ring-amber-400"
              )}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold tracking-wide">
                  Most Popular
                </div>
              )}

              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute -top-3.5 right-4 px-3 py-1 rounded-full bg-stone-700 dark:bg-stone-600 text-white text-xs font-semibold">
                  Current plan
                </div>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={cn(
                    "p-2 rounded-lg",
                    plan.highlighted
                      ? "bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                  )}
                >
                  {plan.icon}
                </span>
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">
                  {plan.name}
                </h2>
              </div>

              {/* Price */}
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-stone-900 dark:text-stone-50">
                  {plan.price}
                </span>
                <span className="text-stone-500 dark:text-stone-400 text-sm">
                  {plan.period}
                </span>
              </div>

              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="flex-1 space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        "w-4 h-4 mt-0.5 shrink-0",
                        plan.highlighted
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-stone-500 dark:text-stone-400"
                      )}
                    />
                    <span className="text-stone-700 dark:text-stone-300">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {plan.priceId === null ? (
                // Free plan
                isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-default"
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                  >
                    Free forever
                  </button>
                )
              ) : isCurrent ? (
                <button
                  disabled
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 cursor-default"
                >
                  ✓ Active
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.priceId!)}
                  disabled={isLoadingThis}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    plan.highlighted
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/30"
                      : "bg-stone-900 hover:bg-stone-700 dark:bg-stone-50 dark:hover:bg-stone-200 text-white dark:text-stone-900",
                    isLoadingThis && "opacity-60 cursor-wait"
                  )}
                >
                  {isLoadingThis ? "Redirecting…" : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="mt-10 text-center text-xs text-stone-400 dark:text-stone-500">
        Payments secured by Stripe. Cancel any time — no long-term commitment.
      </p>
    </div>
  );
}
