import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-white">Simple Pricing</h1>
        <p className="mt-4 text-lg text-gray-400">
          Start free, upgrade when you need more.
        </p>
      </div>
      <PricingTable />
    </div>
  );
}
