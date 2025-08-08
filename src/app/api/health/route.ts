import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'Server is running',
    socketio: 'Available at /api/socket',
    timestamp: new Date().toISOString()
  });
}
