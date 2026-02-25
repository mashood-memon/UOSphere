import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  calculateMatch,
  fetchMatchData,
  type MatchInput,
} from "@/lib/matching";

// GET /api/users/suggestions - Get personalized user suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "6");

    // Fetch current user's match data once
    const currentUserData = await fetchMatchData(session.user.id);

    // Get IDs of users already connected to (accepted or pending)
    const existingConnections = await prisma.connection.findMany({
      where: {
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      select: { senderId: true, receiverId: true },
    });

    const excludeIds = new Set<string>([session.user.id]);
    existingConnections.forEach((conn) => {
      excludeIds.add(conn.senderId);
      excludeIds.add(conn.receiverId);
    });

    // Get users who share at least one interest, not already connected
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
      },
      select: {
        id: true,
        name: true,
        rollNo: true,
        department: true,
        batch: true,
        batchYear: true,
        campus: true,
        bio: true,
        profilePicUrl: true,
        createdAt: true,
        interests: { select: { category: true, tag: true } },
        lookingFor: { select: { type: true } },
        coursesCanHelp: { select: { courseName: true } },
        coursesNeedHelp: { select: { courseName: true } },
        _count: {
          select: {
            sentConnections: { where: { status: "accepted" } },
            receivedConnections: { where: { status: "accepted" } },
          },
        },
      },
      take: 50, // Get a pool of candidates
    });

    // Score and rank candidates using multi-factor matching
    const scored = candidates.map((user) => {
      const profileData: MatchInput = {
        interests: user.interests.map((i) => i.tag),
        department: user.department,
        batchYear: user.batchYear,
        lookingFor: user.lookingFor.map((l) => l.type),
        canHelpCourses: user.coursesCanHelp.map((c) => c.courseName),
        needHelpCourses: user.coursesNeedHelp.map((c) => c.courseName),
      };
      const match = calculateMatch(currentUserData, profileData);

      const connectionsCount =
        user._count.sentConnections + user._count.receivedConnections;

      return {
        ...user,
        _count: undefined,
        coursesCanHelp: undefined,
        coursesNeedHelp: undefined,
        connectionsCount,
        matchPercentage: match.score,
        matchLabel: match.label,
        sharedInterests: match.sharedInterests,
      };
    });

    // Sort by match percentage descending
    scored.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({
      suggestions: scored.slice(0, limit),
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
