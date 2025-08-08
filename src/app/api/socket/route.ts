import { Server as NetServer } from "http";
import { Server as ServerIO } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // This is a placeholder for the Socket.IO endpoint
  // The actual Socket.IO server is handled in server.js
  return new Response(
    JSON.stringify({
      message: "Socket.IO server is running",
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
