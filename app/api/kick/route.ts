import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const JWT_SECRET = process.env.JWT_SECRET || '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const { roomName, participantIdentity } = await request.json();

    if (!roomName || !participantIdentity) {
      return NextResponse.json({ error: 'Missing roomName or participantIdentity' }, { status: 400 });
    }

    // Verify ownership: The caller must be the room owner (username == roomName) or have 'model' role
    // For simplicity, we assume roomName IS the model's username
    if (decoded.username !== roomName) {
       return NextResponse.json({ error: 'Only the broadcaster can kick users' }, { status: 403 });
    }

    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);
    
    await roomService.removeParticipant(roomName, participantIdentity);

    return NextResponse.json({ success: true, message: 'User kicked' });
  } catch (error) {
    console.error('Kick error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
