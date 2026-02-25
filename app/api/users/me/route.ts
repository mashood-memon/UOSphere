import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/users/me - Get current user's full profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        rollNo: true,
        email: true,
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

    return NextResponse.json({
      ...user,
      _count: undefined,
      connectionsCount,
      coursesCanHelp: user.coursesCanHelp.map((c) => c.courseName),
      coursesNeedHelp: user.coursesNeedHelp.map((c) => c.courseName),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/users/me - Update current user's profile
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bio,
      profilePicUrl,
      interests,
      lookingFor,
      coursesCanHelp,
      coursesNeedHelp,
    } = body;

    // Validate bio length
    if (bio !== undefined && bio.length > 150) {
      return NextResponse.json(
        { error: "Bio must be 150 characters or less" },
        { status: 400 },
      );
    }

    // Validate interests
    if (interests !== undefined) {
      if (!Array.isArray(interests) || interests.length < 3) {
        return NextResponse.json(
          { error: "Select at least 3 interests" },
          { status: 400 },
        );
      }
      if (interests.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 interests allowed" },
          { status: 400 },
        );
      }
      // Validate custom interest tags
      for (const i of interests) {
        if (i.isCustom) {
          if (!i.tag || i.tag.trim().length === 0 || i.tag.length > 50) {
            return NextResponse.json(
              { error: "Custom interest tags must be 1-50 characters" },
              { status: 400 },
            );
          }
          if (!/^[a-zA-Z0-9\s/.\-()]+$/.test(i.tag)) {
            return NextResponse.json(
              {
                error:
                  "Custom interest tags can only contain letters, numbers, spaces, and basic punctuation",
              },
              { status: 400 },
            );
          }
        }
      }
    }

    // Validate course help
    if (coursesCanHelp !== undefined) {
      if (!Array.isArray(coursesCanHelp) || coursesCanHelp.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 'Can Help' courses allowed" },
          { status: 400 },
        );
      }
    }
    if (coursesNeedHelp !== undefined) {
      if (!Array.isArray(coursesNeedHelp) || coursesNeedHelp.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 'Need Help' courses allowed" },
          { status: 400 },
        );
      }
    }

    const userId = session.user.id;

    // --- Step 1: Update basic fields (no transaction needed) ---
    const updateData: Record<string, unknown> = {};
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicUrl !== undefined) updateData.profilePicUrl = profilePicUrl;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // --- Step 2: Update interests (delete + create is fast, use transaction) ---
    if (interests !== undefined) {
      await prisma.$transaction([
        prisma.interest.deleteMany({ where: { userId } }),
        prisma.interest.createMany({
          data: interests.map(
            (i: { category: string; tag: string; isCustom?: boolean }) => ({
              userId,
              category: i.category,
              tag: i.tag.trim(),
              isCustom: i.isCustom || false,
            }),
          ),
        }),
      ]);
    }

    // --- Step 3: Update lookingFor ---
    if (lookingFor !== undefined) {
      await prisma.$transaction([
        prisma.lookingFor.deleteMany({ where: { userId } }),
        ...(lookingFor.length > 0
          ? [
              prisma.lookingFor.createMany({
                data: lookingFor.map((type: string) => ({ userId, type })),
              }),
            ]
          : []),
      ]);
    }

    // --- Step 4: Update courses can help ---
    if (coursesCanHelp !== undefined) {
      // Disconnect all existing
      await prisma.user.update({
        where: { id: userId },
        data: { coursesCanHelp: { set: [] } },
      });
      // Connect or create each course
      for (const courseName of coursesCanHelp as string[]) {
        const trimmed = courseName.trim();
        if (!trimmed) continue;
        const existing = await prisma.courseHelp.findFirst({
          where: { courseName: { equals: trimmed, mode: "insensitive" } },
        });
        if (existing) {
          await prisma.user.update({
            where: { id: userId },
            data: { coursesCanHelp: { connect: { id: existing.id } } },
          });
        } else {
          const created = await prisma.courseHelp.create({
            data: { courseName: trimmed },
          });
          await prisma.user.update({
            where: { id: userId },
            data: { coursesCanHelp: { connect: { id: created.id } } },
          });
        }
      }
    }

    // --- Step 5: Update courses need help ---
    if (coursesNeedHelp !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { coursesNeedHelp: { set: [] } },
      });
      for (const courseName of coursesNeedHelp as string[]) {
        const trimmed = courseName.trim();
        if (!trimmed) continue;
        const existing = await prisma.courseHelp.findFirst({
          where: { courseName: { equals: trimmed, mode: "insensitive" } },
        });
        if (existing) {
          await prisma.user.update({
            where: { id: userId },
            data: { coursesNeedHelp: { connect: { id: existing.id } } },
          });
        } else {
          const created = await prisma.courseHelp.create({
            data: { courseName: trimmed },
          });
          await prisma.user.update({
            where: { id: userId },
            data: { coursesNeedHelp: { connect: { id: created.id } } },
          });
        }
      }
    }

    // --- Return updated user ---
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        rollNo: true,
        email: true,
        department: true,
        batch: true,
        batchYear: true,
        degreeProgram: true,
        campus: true,
        bio: true,
        profilePicUrl: true,
        interests: { select: { category: true, tag: true, isCustom: true } },
        lookingFor: { select: { type: true } },
        coursesCanHelp: { select: { courseName: true } },
        coursesNeedHelp: { select: { courseName: true } },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
