// src/app/api/socket/route.ts
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({ 
      message: 'Socket.IO endpoint - use WebSocket connection',
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  return new Response(
    JSON.stringify({ 
      error: 'Use WebSocket connection for real-time communication' 
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}