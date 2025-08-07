import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { text, userId, planId } = await request.json();

    if (!text || !userId || !planId) {
      return NextResponse.json(
        { error: "text, userId, and planId are required" },
        { status: 400 }
      );
    }

    // Check if user already commented on this plan
    const existingComment = await prisma.comment.findFirst({
      where: {
        userId,
        planId,
      },
    });

    if (existingComment) {
      return NextResponse.json(
        { error: "You can only comment once per plan" },
        { status: 400 }
      );
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        text,
        userId,
        planId,
      },
      include: {
        user: true,
      },
    });

    console.log("Created comment:", comment); // Debug log
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    const userId = searchParams.get("userId");

    if (!commentId || !userId) {
      return NextResponse.json(
        { error: "commentId and userId are required" },
        { status: 400 }
      );
    }

    // Check if the comment exists and belongs to the user
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        userId: userId,
      },
    });

    if (!comment) {
      return NextResponse.json(
        {
          error: "Comment not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
