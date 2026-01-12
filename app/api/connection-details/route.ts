import { getLiveKitURL } from '@/lib/getLiveKitURL';
import { ConnectionDetails } from '@/lib/types';
import { AccessToken, AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

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

    let participantName = '';
    let participantIdentity = '';
    let role = 'user';
    let avatar = '';

    if (!token) {
      // Guest Access
      const randomId = Math.floor(Math.random() * 10000);
      participantName = `Guest-${randomId}`;
      participantIdentity = `guest-${randomId}`;
    } else {
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
      if (!decoded.userId || !decoded.username) {
        return new NextResponse(JSON.stringify({ error: 'Token missing required fields' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      participantName = decoded.username;
      participantIdentity = decoded.userId;

      // Fetch authoritative role from backend
      try {
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profile = await profileRes.json();
        if (profile.role) {
          role = profile.role;
        }
        if (profile.avatar) {
          avatar = profile.avatar;
        }
      } catch (e) {
        console.error('Failed to fetch profile for role verification', e);
        // Fallback to token role if available
        role = decoded.role || 'user';
      }
    }

    // Generate participant token
    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
        metadata: JSON.stringify({ avatar }),
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
  at.ttl = '24h'; // Extend token TTL for persistent connections
  
  // Allow publish for models and admins
  const canPublish = role === 'model' || role === 'admin';
  
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: canPublish,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true, // Allow updating own metadata (avatar, name, etc)
  };
  
  at.addGrant(grant);
  return at.toJwt();
}
