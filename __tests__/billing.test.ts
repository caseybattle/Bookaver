import { describe, it, expect } from "vitest";
import { getPlanLimits, PLAN_LIMITS } from "@/lib/clerk/billing";

// billing.ts also exports getUserPlan and getClerkId, both of which call Clerk
// SDK internals that require a real HTTP context. Those functions are NOT
// tested here. getPlanLimits() and PLAN_LIMITS are pure synchronous exports
// with no external dependencies, so they can be tested directly.

describe("PLAN_LIMITS constant shape", () => {
  it("defines the three expected plan keys", () => {
    expect(Object.keys(PLAN_LIMITS)).toEqual(
      expect.arrayContaining(["free", "pro", "unlimited"])
    );
  });

  it("every plan has the books field", () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan).toHaveProperty("books");
    }
  });

  it("every plan has the minutesPerMonth field", () => {
    for (const plan of Object.values(PLAN_LIMITS)) {
      expect(plan).toHaveProperty("minutesPerMonth");
    }
  });
});

describe("getPlanLimits()", () => {
  // ---- free ----
  describe("free plan", () => {
    const limits = getPlanLimits("free");

    it("allows 2 books", () => {
      expect(limits.books).toBe(2);
    });

    it("allows 30 minutes per month", () => {
      expect(limits.minutesPerMonth).toBe(30);
    });

    it("books is more restrictive than pro", () => {
      const pro = getPlanLimits("pro");
      expect(limits.books).toBeLessThan(pro.books);
    });

    it("minutesPerMonth is more restrictive than pro", () => {
      const pro = getPlanLimits("pro");
      expect(limits.minutesPerMonth).toBeLessThan(pro.minutesPerMonth);
    });
  });

  // ---- pro ----
  describe("pro plan", () => {
    const limits = getPlanLimits("pro");

    it("allows 20 books", () => {
      expect(limits.books).toBe(20);
    });

    it("allows 300 minutes per month", () => {
      expect(limits.minutesPerMonth).toBe(300);
    });
  });

  // ---- unlimited ----
  describe("unlimited plan", () => {
    const limits = getPlanLimits("unlimited");

    it("allows Infinity books", () => {
      expect(limits.books).toBe(Infinity);
    });

    it("allows Infinity minutes per month", () => {
      expect(limits.minutesPerMonth).toBe(Infinity);
    });
  });

  // ---- ordering invariants ----
  describe("plan ordering invariants", () => {
    it("free < pro < unlimited for books", () => {
      expect(getPlanLimits("free").books).toBeLessThan(
        getPlanLimits("pro").books
      );
      expect(getPlanLimits("pro").books).toBeLessThan(
        getPlanLimits("unlimited").books
      );
    });

    it("free < pro < unlimited for minutesPerMonth", () => {
      expect(getPlanLimits("free").minutesPerMonth).toBeLessThan(
        getPlanLimits("pro").minutesPerMonth
      );
      expect(getPlanLimits("pro").minutesPerMonth).toBeLessThan(
        getPlanLimits("unlimited").minutesPerMonth
      );
    });

    it("free books limit is a positive finite integer", () => {
      const free = getPlanLimits("free");
      expect(Number.isFinite(free.books)).toBe(true);
      expect(free.books).toBeGreaterThan(0);
    });

    it("unlimited books limit is Infinity (not a finite number)", () => {
      expect(Number.isFinite(getPlanLimits("unlimited").books)).toBe(false);
    });

    it("unlimited minutesPerMonth limit is Infinity", () => {
      expect(Number.isFinite(getPlanLimits("unlimited").minutesPerMonth)).toBe(
        false
      );
    });
  });
});
