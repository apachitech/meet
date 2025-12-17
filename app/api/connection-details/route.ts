import { getLiveKitURL } from '@/lib/getLiveKitURL';
import { ConnectionDetails } from '@/lib/types';
import { AccessToken, AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error('JWT verification failed:', err);
      return new NextResponse(JSON.stringify({ error: 'Invalid token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate that required fields exist in token
    if (!decoded.id || !decoded.username) {
      return new NextResponse(JSON.stringify({ error: 'Token missing required fields' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get('roomName');
    const region = request.nextUrl.searchParams.get('region');
    if (!LIVEKIT_URL) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    const livekitServerUrl = region ? getLiveKitURL(LIVEKIT_URL, region) : LIVEKIT_URL;

    if (livekitServerUrl === undefined) {
      throw new Error('Invalid region');
    }

    if (typeof roomName !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing required query parameter: roomName' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const participantName = decoded.username;
    const participantIdentity = decoded.id;

    // Fetch authoritative role from backend
    let role = 'user';
    try {
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profile = await profileRes.json();
      if (profile.role) {
        role = profile.role;
      }
    } catch (e) {
      console.error('Failed to fetch profile for role verification', e);
      // Fallback to token role if available
      role = decoded.role || 'user';
    }

    // Generate participant token
    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
      },
      roomName,
      role,
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: livekitServerUrl,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantName,
    };
    return NextResponse.json(data);
  } catch (error) {
    console.error('Connection details error:', error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string, role: string) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = '5m';
  const canPublish = role === 'model';
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: canPublish,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}

