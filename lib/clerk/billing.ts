import { auth, currentUser } from "@clerk/nextjs/server";

export type PlanType = "free" | "pro" | "unlimited";

export const PLAN_LIMITS: Record<PlanType, { books: number; minutesPerMonth: number }> = {
  free: { books: 2, minutesPerMonth: 30 },
  pro: { books: 20, minutesPerMonth: 300 },
  unlimited: { books: Infinity, minutesPerMonth: Infinity },
};

export async function getUserPlan(): Promise<PlanType> {
  const user = await currentUser();
  if (!user) return "free";

  // Check public metadata for plan set by Clerk webhook / billing
  const plan = user.publicMetadata?.plan as PlanType | undefined;
  return plan ?? "free";
}

export function getPlanLimits(plan: PlanType): { books: number; minutesPerMonth: number } {
  return PLAN_LIMITS[plan];
}

export async function getClerkId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
