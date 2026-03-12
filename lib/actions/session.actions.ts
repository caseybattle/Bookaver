"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import VoiceSession from "@/lib/db/models/VoiceSession";
import { getClerkId, getUserPlan, getPlanLimits } from "@/lib/clerk/billing";

function getBillingMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function startVoiceSession(bookId: string, personaId: string) {
  const clerkId = await getClerkId();
  await connectToDatabase();

  // Enforce monthly session limit before creating the session
  const plan = await getUserPlan();
  const limits = getPlanLimits(plan);
  if (limits.sessionsPerMonth !== Infinity) {
    const billingMonth = getBillingMonth();
    const sessionCount = await VoiceSession.countDocuments({ clerkId, billingMonth });
    if (sessionCount >= limits.sessionsPerMonth) {
      throw new Error(
        `Monthly session limit reached. Your ${plan} plan allows ${limits.sessionsPerMonth} session${limits.sessionsPerMonth === 1 ? "" : "s"}/month. Upgrade for more.`
      );
    }
  }

  const session = await VoiceSession.create({
    bookId,
    clerkId,
    personaId,
    startedAt: new Date(),
    billingMonth: getBillingMonth(),
  });

  return { sessionId: session._id.toString() };
}

export async function endVoiceSession(
  sessionId: string,
  vapiCallId?: string
) {
  const clerkId = await getClerkId();
  await connectToDatabase();

  const session = await VoiceSession.findOne({ _id: sessionId, clerkId });
  if (!session) throw new Error("Session not found");

  const endedAt = new Date();
  const durationSeconds = Math.round(
    (endedAt.getTime() - session.startedAt.getTime()) / 1000
  );

  await VoiceSession.findByIdAndUpdate(sessionId, {
    endedAt,
    durationSeconds,
    ...(vapiCallId ? { vapiCallId } : {}),
  });

  return { success: true, durationSeconds };
}

export async function getMonthlyMinutesUsed(billingMonth?: string): Promise<number> {
  const clerkId = await getClerkId();
  await connectToDatabase();

  const month = billingMonth ?? getBillingMonth();

  const sessions = await VoiceSession.find({
    clerkId,
    billingMonth: month,
    endedAt: { $exists: true },
  })
    .select("durationSeconds")
    .lean();

  const totalSeconds = sessions.reduce(
    (sum, s) => sum + (s.durationSeconds ?? 0),
    0
  );

  return Math.round(totalSeconds / 60);
}
