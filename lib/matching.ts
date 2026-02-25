import { prisma } from "@/lib/prisma";

/**
 * Multi-factor match scoring system for UOSphere
 *
 * Weights:
 *   40% - Shared interests (Jaccard similarity)
 *   20% - Same department bonus
 *   15% - Batch proximity (same year, ±1, ±2)
 *   15% - Matching goals ("looking for" overlap)
 *   10% - Course help overlap (one user's canHelp ↔ other's needHelp)
 *
 * Score tiers:
 *   80-100%  "Excellent Match" (green)
 *   60-79%   "Great Match"     (blue)
 *   40-59%   "Good Match"      (yellow/amber)
 *   20-39%   "Fair Match"      (gray)
 *   <20%     Hidden
 */

export interface MatchInput {
  interests: string[];
  department: string;
  batchYear: number;
  lookingFor: string[];
  canHelpCourses: string[];
  needHelpCourses: string[];
}

export interface MatchResult {
  /** Overall score 0-100 */
  score: number;
  /** Label string or null if below threshold */
  label: string | null;
  /** Shared interest tags */
  sharedInterests: string[];
  /** Breakdown of individual factor scores (each 0-100 before weighting) */
  breakdown: {
    interests: number;
    department: number;
    batch: number;
    goals: number;
    courseHelp: number;
  };
}

const WEIGHTS = {
  interests: 0.4,
  department: 0.2,
  batch: 0.15,
  goals: 0.15,
  courseHelp: 0.1,
};

/**
 * Calculate match score between two users.
 */
export function calculateMatch(
  userA: MatchInput,
  userB: MatchInput,
): MatchResult {
  // --- 1. Shared interests (Jaccard: shared / union) → 0-100 ---
  const setA = new Set(userA.interests);
  const setB = new Set(userB.interests);
  const sharedInterests = userB.interests.filter((t) => setA.has(t));
  const union = new Set([...setA, ...setB]);

  const interestScore =
    union.size > 0 ? (sharedInterests.length / union.size) * 100 : 0;

  // --- 2. Department bonus → 0 or 100 ---
  const departmentScore =
    userA.department.toLowerCase() === userB.department.toLowerCase() ? 100 : 0;

  // --- 3. Batch proximity → 0/33/66/100 ---
  const yearDiff = Math.abs(userA.batchYear - userB.batchYear);
  let batchScore: number;
  if (yearDiff === 0) batchScore = 100;
  else if (yearDiff === 1) batchScore = 66;
  else if (yearDiff === 2) batchScore = 33;
  else batchScore = 0;

  // --- 4. Matching goals (Jaccard on lookingFor) → 0-100 ---
  const goalsA = new Set(userA.lookingFor);
  const goalsB = new Set(userB.lookingFor);
  const sharedGoals = userB.lookingFor.filter((g) => goalsA.has(g));
  const goalsUnion = new Set([...goalsA, ...goalsB]);

  const goalsScore =
    goalsUnion.size > 0 ? (sharedGoals.length / goalsUnion.size) * 100 : 0;

  // --- 5. Course help overlap ---
  // A can help with what B needs, and vice-versa
  const aCanHelp = new Set(userA.canHelpCourses);
  const bCanHelp = new Set(userB.canHelpCourses);
  const aNeed = new Set(userA.needHelpCourses);
  const bNeed = new Set(userB.needHelpCourses);

  // Count mutual matches: A helps B + B helps A
  const aHelpsB = userB.needHelpCourses.filter((c) => aCanHelp.has(c)).length;
  const bHelpsA = userA.needHelpCourses.filter((c) => bCanHelp.has(c)).length;
  const totalHelpPossible =
    aNeed.size + bNeed.size > 0 ? aNeed.size + bNeed.size : 1;

  const courseHelpScore = Math.min(
    100,
    ((aHelpsB + bHelpsA) / totalHelpPossible) * 100,
  );

  // --- Weighted total ---
  const rawScore =
    interestScore * WEIGHTS.interests +
    departmentScore * WEIGHTS.department +
    batchScore * WEIGHTS.batch +
    goalsScore * WEIGHTS.goals +
    courseHelpScore * WEIGHTS.courseHelp;

  const score = Math.round(Math.min(100, rawScore));

  // --- Label ---
  let label: string | null;
  if (score >= 80) label = "Excellent Match";
  else if (score >= 60) label = "Great Match";
  else if (score >= 40) label = "Good Match";
  else if (score >= 20) label = "Fair Match";
  else label = null; // Don't show

  return {
    score,
    label,
    sharedInterests,
    breakdown: {
      interests: Math.round(interestScore),
      department: departmentScore,
      batch: batchScore,
      goals: Math.round(goalsScore),
      courseHelp: Math.round(courseHelpScore),
    },
  };
}

/**
 * Fetch all match-relevant data for a user from the database.
 */
export async function fetchMatchData(userId: string): Promise<MatchInput> {
  const [interests, lookingFor, canHelp, needHelp] = await Promise.all([
    prisma.interest.findMany({
      where: { userId },
      select: { tag: true },
    }),
    prisma.lookingFor.findMany({
      where: { userId },
      select: { type: true },
    }),
    prisma.courseHelp.findMany({
      where: { canHelpUsers: { some: { id: userId } } },
      select: { courseName: true },
    }),
    prisma.courseHelp.findMany({
      where: { needHelpUsers: { some: { id: userId } } },
      select: { courseName: true },
    }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { department: true, batchYear: true },
  });

  return {
    interests: interests.map((i) => i.tag),
    department: user?.department || "",
    batchYear: user?.batchYear || 0,
    lookingFor: lookingFor.map((l) => l.type),
    canHelpCourses: canHelp.map((c) => c.courseName),
    needHelpCourses: needHelp.map((c) => c.courseName),
  };
}
