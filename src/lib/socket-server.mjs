import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let io = null;

const initSocketServer = (server) => {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*", // Allow all origins in development
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["polling", "websocket"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
    connectTimeout: 45000,
    allowUpgrades: true,
    perMessageDeflate: false,
  });

  io.on("connection", (socket) => {
    console.log("✅ Client connected:", socket.id);
    console.log("🔗 Socket transport:", socket.conn.transport.name);
    console.log("🌐 Socket headers:", socket.handshake.headers);
    console.log("🌐 Socket URL:", socket.handshake.url);
    console.log("🌐 Socket query:", socket.handshake.query);

    socket.on("error", (error) => {
      console.error("🚨 Socket error:", error);
    });

    // Handle joining plan rooms for real-time voting updates
    socket.on("join-plan", (planId) => {
      socket.join(`plan-${planId}`);
      // console.log(`Socket ${socket.id} joined plan room: ${planId}`);
    });

    // Handle leaving plan rooms
    socket.on("leave-plan", (planId) => {
      socket.leave(`plan-${planId}`);
      // console.log(`Socket ${socket.id} left plan room: ${planId}`);
    });

    // Handle new votes
    socket.on("new-vote", async (data) => {
      try {
        const { userId, optionId, planId } = data;
        console.log("🗳️ New vote received:", data);
        console.log(
          `🗳️ Processing vote for plan: ${planId}, user: ${userId}, option: ${optionId}`
        );

        // Check if user already voted on this plan
        const existingVote = await prisma.vote.findFirst({
          where: {
            userId,
            planId,
          },
        });

        let vote;
        if (existingVote) {
          // Update existing vote
          vote = await prisma.vote.update({
            where: {
              id: existingVote.id,
            },
            data: {
              optionId,
            },
            include: {
              user: true,
              option: true,
            },
          });
        } else {
          // Create new vote
          vote = await prisma.vote.create({
            data: {
              userId,
              optionId,
              planId,
            },
            include: {
              user: true,
              option: true,
            },
          });
        }

        // Fetch updated plan data
        const updatedPlan = await prisma.plan.findUnique({
          where: { id: planId },
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
            createdBy: true,
          },
        });

        if (updatedPlan && io) {
          // Broadcast updated plan to all clients in the plan room
          const room = io.sockets.adapter.rooms.get(`plan-${planId}`);
          const clientCount = room ? room.size : 0;
          console.log(
            `📡 Broadcasting plan update to room plan-${planId} (${clientCount} clients)`
          );
          console.log(
            `📡 Broadcasting to ${clientCount} clients in room plan-${planId}`
          );
          io.to(`plan-${planId}`).emit("plan-updated", {
            planId,
            plan: updatedPlan,
            vote,
          });
          console.log(`📡 Plan update broadcasted successfully`);
        }
      } catch (error) {
        console.error("Error processing vote:", error);
        socket.emit("vote-error", { error: "Failed to process vote" });
      }
    });

    // Handle vote deletion
    socket.on("delete-vote", async (data) => {
      try {
        const { voteId, userId, planId } = data;
        console.log("Delete vote received:", data);

        // Check if the vote exists and belongs to the user
        const vote = await prisma.vote.findFirst({
          where: {
            id: voteId,
            userId: userId,
          },
        });

        if (!vote) {
          socket.emit("vote-error", {
            error: "Vote not found or unauthorized",
          });
          return;
        }

        // Delete the vote
        await prisma.vote.delete({
          where: {
            id: voteId,
          },
        });

        // Fetch updated plan data
        const updatedPlan = await prisma.plan.findUnique({
          where: { id: planId },
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
            createdBy: true,
          },
        });

        if (updatedPlan && io) {
          // Broadcast updated plan to all clients in the plan room
          io.to(`plan-${planId}`).emit("plan-updated", {
            planId,
            plan: updatedPlan,
            action: "vote-deleted",
          });
        }
      } catch (error) {
        console.error("Error deleting vote:", error);
        socket.emit("vote-error", { error: "Failed to delete vote" });
      }
    });

    // Handle new comments
    socket.on("new-comment", async (data) => {
      try {
        const { text, userId, planId } = data;
        console.log("New comment received:", data);

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

        // Fetch updated plan data
        const updatedPlan = await prisma.plan.findUnique({
          where: { id: planId },
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
        });

        if (updatedPlan && io) {
          // Broadcast updated plan to all clients in the plan room
          console.log(`Broadcasting comment update to room plan-${planId}`);
          io.to(`plan-${planId}`).emit("plan-updated", {
            planId,
            plan: updatedPlan,
            comment,
          });
        }
      } catch (error) {
        console.error("Error processing comment:", error);
        socket.emit("comment-error", { error: "Failed to process comment" });
      }
    });

    // Handle plan deletion
    socket.on("delete-plan", async (data) => {
      try {
        const { planId, userId } = data;
        console.log("🗑️ Plan deletion request received:", data);

        // Check if the plan exists and belongs to the user
        const plan = await prisma.plan.findFirst({
          where: {
            id: planId,
            createdById: userId,
          },
          include: {
            options: {
              include: {
                votes: true,
              },
            },
            comments: true,
          },
        });

        if (!plan) {
          socket.emit("plan-delete-error", {
            error: "Plan not found or you don't have permission to delete it",
          });
          return;
        }

        console.log(`🗑️ Deleting plan: ${planId}`);
        console.log(
          `🗑️ Plan has ${plan.options.length} options, ${plan.options.reduce(
            (total, opt) => total + opt.votes.length,
            0
          )} votes, and ${plan.comments.length} comments`
        );

        // Delete the plan (this will cascade delete all related data)
        await prisma.plan.delete({
          where: {
            id: planId,
          },
        });

        console.log(
          `✅ Successfully deleted plan: ${planId} and all related data`
        );

        // Broadcast plan deletion to all clients in the plan room
        if (io) {
          console.log(`📡 Broadcasting plan deletion to room plan-${planId}`);
          io.to(`plan-${planId}`).emit("plan-deleted", {
            planId,
            message: "Plan and all related data deleted successfully",
            deletedData: {
              planId,
              optionsCount: plan.options.length,
              votesCount: plan.options.reduce(
                (total, opt) => total + opt.votes.length,
                0
              ),
              commentsCount: plan.comments.length,
            },
          });
        }

        socket.emit("plan-delete-success", {
          planId,
          message: "Plan deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting plan:", error);
        socket.emit("plan-delete-error", {
          error: "Failed to delete plan",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getSocketIO = () => io;

export { initSocketServer, getSocketIO };
