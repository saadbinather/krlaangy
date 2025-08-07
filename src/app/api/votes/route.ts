import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, optionId, planId } = await request.json();
    console.log("Votes API received:", { userId, optionId, planId });

    if (!userId || !optionId || !planId) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "userId, optionId, and planId are required" },
        { status: 400 }
      );
    }

    // Check if user already voted on this plan
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        planId,
      },
    });

    console.log("Existing vote found:", existingVote);

    if (existingVote) {
      // Update existing vote to new option
      console.log("Updating existing vote to new option");
      const vote = await prisma.vote.update({
        where: {
          id: existingVote.id,
        },
        data: {
          optionId,
        },
        include: {
          user: true,
        },
      });
      console.log("Vote updated successfully:", vote);
      return NextResponse.json(vote, { status: 200 });
    } else {
      // Create new vote
      console.log("Creating new vote for:", { userId, optionId, planId });
      const vote = await prisma.vote.create({
        data: {
          userId,
          optionId,
          planId,
        },
        include: {
          user: true,
        },
      });
      console.log("Vote created successfully:", vote);
      return NextResponse.json(vote, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating vote:", error);
    return NextResponse.json(
      { error: "Failed to create vote" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const voteId = searchParams.get("voteId");
    const userId = searchParams.get("userId");

    if (!voteId || !userId) {
      return NextResponse.json(
        { error: "voteId and userId are required" },
        { status: 400 }
      );
    }

    // Check if the vote exists and belongs to the user
    const vote = await prisma.vote.findFirst({
      where: {
        id: voteId,
        userId: userId,
      },
    });

    if (!vote) {
      return NextResponse.json(
        { error: "Vote not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete the vote
    await prisma.vote.delete({
      where: {
        id: voteId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vote:", error);
    return NextResponse.json(
      { error: "Failed to delete vote" },
      { status: 500 }
    );
  }
}
