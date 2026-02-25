import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/connections - Send connection request
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId } = await request.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 },
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 },
      );
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if connection already exists
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId },
          { senderId: receiverId, receiverId: session.user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists", status: existing.status },
        { status: 409 },
      );
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        senderId: session.user.id,
        receiverId,
        status: "pending",
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "connection_request",
        title: "New Connection Request",
        message: `${session.user.name} wants to connect with you`,
        linkUrl: `/profile/${session.user.id}`,
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/connections - Get all connections for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "accepted";
    const type = searchParams.get("type") || "all"; // all, sent, received

    const where: Record<string, unknown> = { status };

    if (type === "sent") {
      where.senderId = session.user.id;
    } else if (type === "received") {
      where.receiverId = session.user.id;
    } else {
      where.OR = [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ];
    }

    const connections = await prisma.connection.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            department: true,
            batch: true,
            profilePicUrl: true,
            interests: { select: { category: true, tag: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            rollNo: true,
            department: true,
            batch: true,
            profilePicUrl: true,
            interests: { select: { category: true, tag: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to return the "other" user in each connection
    const mapped = connections.map((conn) => {
      const otherUser =
        conn.senderId === session.user.id ? conn.receiver : conn.sender;
      return {
        connectionId: conn.id,
        status: conn.status,
        createdAt: conn.createdAt,
        senderId: conn.senderId,
        user: otherUser,
      };
    });

    return NextResponse.json({ connections: mapped });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
