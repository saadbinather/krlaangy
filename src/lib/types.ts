import { Server as NetServer, Socket } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export interface SocketMessage {
  message: string;
  sender: string;
  timestamp: string;
  roomId?: string;
}

export interface TypingEvent {
  userId: string;
  isTyping: boolean;
  roomId: string;
}
