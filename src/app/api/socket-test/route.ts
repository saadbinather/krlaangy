import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'Socket.IO server is running',
    timestamp: new Date().toISOString()
  });
}
