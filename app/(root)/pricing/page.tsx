import { PricingTable } from "@clerk/nextjs";

export const metadata = {
  title: "Pricing — Bookauver",
  description: "Simple plans to unlock more books and voice sessions.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">
          Simple Pricing
        </h1>
        <p className="mt-4 text-lg text-stone-500 dark:text-stone-400">
          Start free, upgrade when you need more.
        </p>
      </div>
      {/* PricingTable renders plans configured in Clerk Dashboard → Billing */}
      <PricingTable />
    </div>
  );
}
