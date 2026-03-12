import { Suspense } from "react";
import { getUserPlan } from "@/lib/clerk/billing";
import PricingCards from "@/components/PricingCards";

export const metadata = {
  title: "Pricing — Bookauver",
  description: "Simple plans to unlock more books and voice sessions.",
};

export default async function PricingPage() {
  const currentPlan = await getUserPlan();

  return (
    <Suspense fallback={<div className="py-32 text-center text-stone-400">Loading…</div>}>
      <PricingCards currentPlan={currentPlan} />
    </Suspense>
  );
}
