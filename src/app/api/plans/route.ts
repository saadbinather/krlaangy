import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch all plans with their related data
    const plans = await prisma.plan.findMany({
      include: {
        options: {
          include: {
            votes: {
              include: {
                user: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: true,
          },
        },
        createdBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the expected format
    const transformedPlans = plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      createdAt: plan.createdAt,
      createdBy: plan.createdBy,
      options: plan.options.map((option) => ({
        id: option.id,
        optionText: option.optionText,
        votes: option.votes.map((vote) => ({
          id: vote.id,
          userId: vote.userId,
          user: vote.user,
        })),
      })),
      comments: plan.comments.map((comment) => ({
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        user: comment.user,
      })),
    }));

    return NextResponse.json(transformedPlans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, createdById, options } = await request.json();

    if (!title || !createdById) {
      return NextResponse.json(
        { error: "Title and createdById are required" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        title,
        createdById,
        options: {
          create:
            options?.map((option: string) => ({
              optionText: option,
            })) || [],
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Failed to create plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");
    const userId = searchParams.get("userId");

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "planId and userId are required" },
        { status: 400 }
      );
    }

    // Check if the plan exists and belongs to the user
    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        createdById: userId,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete the plan (this will cascade delete options, votes, and comments)
    await prisma.plan.delete({
      where: {
        id: planId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
