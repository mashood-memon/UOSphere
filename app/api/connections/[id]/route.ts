import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT /api/connections/[id] - Accept or reject a connection request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the connection - only the receiver can accept/reject
    const connection = await prisma.connection.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    if (connection.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the receiver can accept or reject" },
        { status: 403 }
      );
    }

    if (connection.status !== "pending") {
      return NextResponse.json(
        { error: "Connection is no longer pending" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      const updated = await prisma.connection.update({
        where: { id },
        data: { status: "accepted" },
      });

      // Notify the sender
      await prisma.notification.create({
        data: {
          userId: connection.senderId,
          type: "connection_accepted",
          title: "Connection Accepted",
          message: `${session.user.name} accepted your connection request`,
          linkUrl: `/profile/${session.user.id}`,
        },
      });

      return NextResponse.json(updated);
    } else {
      // Reject: delete the connection
      await prisma.connection.delete({ where: { id } });
      return NextResponse.json({ message: "Connection rejected" });
    }
  } catch (error) {
    console.error("Error updating connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/connections/[id] - Remove a connection
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Either party can remove the connection
    if (
      connection.senderId !== session.user.id &&
      connection.receiverId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.connection.delete({ where: { id } });

    return NextResponse.json({ message: "Connection removed" });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
