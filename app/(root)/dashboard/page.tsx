import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import Book from "@/lib/db/models/Book";
import VoiceSession from "@/lib/db/models/VoiceSession";
import { getPlanLimits, getUserPlan } from "@/lib/clerk/billing";
import { BookOpen, Clock, Zap } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await connectToDatabase();

  const billingMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [bookCount, sessions, plan] = await Promise.all([
    Book.countDocuments({ clerkId: userId }),
    VoiceSession.find({ clerkId: userId, billingMonth }).lean(),
    getUserPlan(),
  ]);

  const limits = getPlanLimits(plan);
  const minutesUsed = sessions.reduce((acc, s) => acc + ((s.durationSeconds as number) ?? 0) / 60, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your usage this month on the <span className="text-indigo-400 capitalize">{plan}</span> plan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Books */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <BookOpen className="w-4 h-4" />
            Books
          </div>
          <p className="text-3xl font-bold">{bookCount}</p>
          <p className="text-xs text-gray-500">of {limits.books === Infinity ? "unlimited" : limits.books} allowed</p>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: limits.books === Infinity ? "0%" : `${Math.min((bookCount / limits.books) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Minutes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            Minutes Used
          </div>
          <p className="text-3xl font-bold">{Math.round(minutesUsed)}</p>
          <p className="text-xs text-gray-500">of {limits.minutesPerMonth === Infinity ? "unlimited" : limits.minutesPerMonth} this month</p>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: limits.minutesPerMonth === Infinity ? "0%" : `${Math.min((minutesUsed / limits.minutesPerMonth) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Plan */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Zap className="w-4 h-4" />
            Current Plan
          </div>
          <p className="text-3xl font-bold capitalize">{plan}</p>
          <p className="text-xs text-gray-500">{sessions.length} voice sessions this month</p>
        </div>
      </div>
    </div>
  );
}
