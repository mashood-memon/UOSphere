import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  calculateMatch,
  fetchMatchData,
  type MatchInput,
} from "@/lib/matching";

// GET /api/users/search - Search and filter users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const department = searchParams.get("department") || "";
    const batch = searchParams.get("batch") || "";
    const campus = searchParams.get("campus") || "";
    const interests =
      searchParams.get("interests")?.split(",").filter(Boolean) || [];
    const lookingFor =
      searchParams.get("lookingFor")?.split(",").filter(Boolean) || [];
    const sort = searchParams.get("sort") || "compatible";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Record<string, unknown> = {
      id: { not: session.user.id }, // Exclude current user
    };

    // Text search on name or roll number
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { rollNo: { contains: query, mode: "insensitive" } },
      ];
    }

    if (department) {
      where.department = { contains: department, mode: "insensitive" };
    }

    if (batch) {
      where.batch = batch;
    }

    if (campus) {
      where.campus = { contains: campus, mode: "insensitive" };
    }

    // Filter by interests
    if (interests.length > 0) {
      where.interests = {
        some: { tag: { in: interests } },
      };
    }

    // Filter by looking for
    if (lookingFor.length > 0) {
      where.lookingFor = {
        some: { type: { in: lookingFor } },
      };
    }

    // Get total count
    const totalCount = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
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
      orderBy:
        sort === "recent"
          ? { createdAt: "desc" }
          : sort === "name"
            ? { name: "asc" }
            : { createdAt: "desc" }, // Default; we'll sort by match client-side for "compatible"
      skip,
      take: limit,
    });

    // Fetch current user's match data once
    const currentUserData = await fetchMatchData(session.user.id);

    // Calculate multi-factor match score for each user
    const usersWithMatch = users.map((user) => {
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

    // Sort by match percentage if "compatible" sort
    if (sort === "compatible") {
      usersWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    return NextResponse.json({
      users: usersWithMatch,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
