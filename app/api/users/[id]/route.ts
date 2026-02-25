import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  calculateMatch,
  fetchMatchData,
  type MatchInput,
} from "@/lib/matching";

// GET /api/users/[id] - Get a user's public profile
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        rollNo: true,
        department: true,
        batch: true,
        batchYear: true,
        degreeProgram: true,
        campus: true,
        bio: true,
        profilePicUrl: true,
        createdAt: true,
        interests: { select: { category: true, tag: true, isCustom: true } },
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const connectionsCount =
      user._count.sentConnections + user._count.receivedConnections;

    // Check connection status between current user and this user
    let connectionStatus: string | null = null;
    let connectionId: string | null = null;

    if (id !== session.user.id) {
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: id },
            { senderId: id, receiverId: session.user.id },
          ],
        },
        select: {
          id: true,
          status: true,
          senderId: true,
        },
      });

      if (connection) {
        connectionId = connection.id;
        if (connection.status === "accepted") {
          connectionStatus = "connected";
        } else if (connection.status === "pending") {
          connectionStatus =
            connection.senderId === session.user.id
              ? "pending_sent"
              : "pending_received";
        }
      }
    }

    // Calculate multi-factor match score
    let matchPercentage = 0;
    let matchLabel: string | null = null;
    let sharedInterests: string[] = [];
    if (id !== session.user.id) {
      const currentUserData = await fetchMatchData(session.user.id);
      const profileUserData: MatchInput = {
        interests: user.interests.map((i) => i.tag),
        department: user.department,
        batchYear: user.batchYear,
        lookingFor: user.lookingFor.map((l) => l.type),
        canHelpCourses: user.coursesCanHelp.map((c) => c.courseName),
        needHelpCourses: user.coursesNeedHelp.map((c) => c.courseName),
      };
      const match = calculateMatch(currentUserData, profileUserData);
      matchPercentage = match.score;
      matchLabel = match.label;
      sharedInterests = match.sharedInterests;
    }

    return NextResponse.json({
      ...user,
      _count: undefined,
      coursesCanHelp: user.coursesCanHelp.map((c) => c.courseName),
      coursesNeedHelp: user.coursesNeedHelp.map((c) => c.courseName),
      connectionsCount,
      connectionStatus,
      connectionId,
      matchPercentage,
      matchLabel,
      sharedInterests,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
