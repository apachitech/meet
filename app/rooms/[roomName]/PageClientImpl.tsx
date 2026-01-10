'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  RoomContext,
  useDataChannel,
  useRemoteParticipants,
} from '@livekit/components-react';
import { StreamingStage } from '@/app/custom/StreamingStage';
import { BattleOverlay } from '@/app/custom/BattleOverlay';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
  RemoteParticipant,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';
import { jwtDecode } from 'jwt-decode';
import { Gift } from '@/app/custom/Gift';
import { OverlayChat } from '@/app/custom/OverlayChat';
import { CustomControls } from '@/app/custom/CustomControls';
import { SpectatorRow } from '@/app/custom/SpectatorRow';
import { TokenStore } from '@/app/custom/TokenStore';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | undefined>(
    undefined,
  );
  const [userChoices, setUserChoices] = useState<LocalUserChoices>({
    username: '',
    videoEnabled: true,
    audioEnabled: true,
    videoDeviceId: '',
    audioDeviceId: '',
  });
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded && decoded.username) {
          setUserChoices((prev) => ({
            ...prev,
            username: decoded.username,
          }));
        }
      } catch (e) {
        console.error(e);
      }

      // Fetch profile to set permissions correctly
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403 || res.status === 404) {
              localStorage.removeItem('token');
              // Downgrade to guest effectively on next reload, but for now just don't enable broadcasting
            }
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            const isModel = data.role === 'model';
            setUserRole(data.role);
            setUserChoices((prev) => ({
              ...prev,
              username: data.username,
              videoEnabled: isModel,
              audioEnabled: isModel
            }));
          }
        })
        .catch(console.error);
    } else {
       // Guest Mode
       setUserRole('user');
       setUserChoices((prev) => ({ ...prev, videoEnabled: false, audioEnabled: false }));
    }

    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', props.roomName);
    if (props.region) {
      url.searchParams.append('region', props.region);
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(url.toString(), { headers })
      .then(async (res) => {
        if (res.status === 200) {
          return res.json();
        }
        throw new Error(await res.text());
      })
      .then((data) => setConnectionDetails(data))
      .catch((err) => {
          console.error('Connection details error', err);
          if (err.message === 'Unauthorized' || err.message === 'Invalid token') {
              localStorage.removeItem('token');
              window.location.reload(); // Retry as guest
          }
      });
  }, [props.roomName, props.region]);

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      {connectionDetails === undefined ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <div>Loading...</div>
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={userChoices}
          options={{ codec: props.codec, hq: props.hq }}
          roomName={props.roomName}
          userRole={userRole}
        />
      )}
    </main>
  );
}

function StreamStats({ roomName }: { roomName: string }) {
  const remoteParticipants = useRemoteParticipants();
  const [likes, setLikes] = useState(0);
  const [tips, setTips] = useState(0);
  const { message: reactionMessage } = useDataChannel('reaction');
  const { message: giftMessage } = useDataChannel('gift');

  useEffect(() => {
    // Fetch initial stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${roomName}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setLikes(data.totalLikes || 0);
          setTips(data.totalTips || 0);
        }
      })
      .catch(console.error);
  }, [roomName]);

  useEffect(() => {
    if (reactionMessage) {
       setLikes((prev) => prev + 1);
    }
  }, [reactionMessage]);

  useEffect(() => {
    if (giftMessage && giftMessage.payload) {
      try {
        const data = JSON.parse(new TextDecoder().decode(giftMessage.payload));
        if (data.price) setTips((prev) => prev + data.price);
      } catch(e) { console.error(e); }
    }
  }, [giftMessage]);

  return (
    <div style={{
      position: 'absolute',
      top: '1rem',
      left: '1rem',
      zIndex: 50,
      display: 'flex',
      gap: '1rem',
      background: 'rgba(0,0,0,0.6)',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: 'white',
      fontWeight: 700,
      fontSize: '0.9rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span>👁️</span> {remoteParticipants.length + 1}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{color: '#ef4444'}}>❤️</span> {likes}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{color: '#eab308'}}>💎</span> {tips}
      </div>
    </div>
  );
}

function LikeButton({ roomName }: { roomName: string }) {
  const { room } = React.useContext(RoomContext) as any;
  const [hearts, setHearts] = useState<{id: number, x: number, rotation: number, scale: number, emoji: string}[]>([]);

  const handleLike = async () => {
    // Burst of hearts
    const count = 5;
    const heartEmojis = ['❤️', '💖', '💗', '💓', '💞', '💘', '💝'];
    
    const newHearts = Array.from({length: count}).map((_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 80, // Wider spread
        rotation: (Math.random() - 0.5) * 60,
        scale: 0.8 + Math.random() * 0.8,
        emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)]
    }));
    
    setHearts(prev => [...prev, ...newHearts]);
    
    setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id < newHearts[0].id));
    }, 2000);
    
    // Broadcast via Data Channel
    if (room && room.localParticipant) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify({ type: 'like' }));
        await room.localParticipant.publishData(payload, { topic: 'reaction' });
      } catch (e) { console.error(e); }
    }

    // Persist via API
    try {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientUsername: roomName })
      });
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{ position: 'absolute', bottom: '100px', right: '20px', zIndex: 50 }}>
        {hearts.map(h => (
            <div key={h.id} style={{
                position: 'absolute',
                bottom: '30px',
                left: '10px',
                fontSize: '2rem',
                transform: `translateX(${h.x}px) rotate(${h.rotation}deg) scale(${h.scale})`,
                animation: 'floatHeart 1.5s ease-out forwards',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
                zIndex: 40
            }}>
                {h.emoji}
            </div>
        ))}
        <button
          onClick={handleLike}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)', // Vibrant Pink/Red
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 25px rgba(221, 36, 118, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
            cursor: 'pointer',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9) translateY(2px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>❤️</span>
        </button>
        <style jsx global>{`
            @keyframes floatHeart {
                0% { opacity: 0; transform: translateY(0) scale(0); }
                10% { opacity: 1; transform: translateY(-30px) scale(1); }
                100% { opacity: 0; transform: translateY(-200px) scale(1.2); }
            }
        `}</style>
    </div>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
  roomName: string;
  userRole: string;
}) {
  const keyProvider = React.useMemo(() => new ExternalE2EEKeyProvider(), []);
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: true,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee: keyProvider && worker && e2eeEnabled ? { keyProvider, worker } : undefined,
      singlePeerConnection: true,
    };
  }, [props.userChoices, props.options.hq, props.options.codec, e2eeEnabled, keyProvider, worker]);

  const room = React.useMemo(() => new Room(roomOptions), [roomOptions]);

  // Private Show Logic
  const [privateState, setPrivateState] = React.useState<{ isPrivate: boolean; payer?: string }>({ isPrivate: false });

  React.useEffect(() => {
    const checkStatus = () => {
       fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/private/status?modelUsername=${props.roomName}`)
         .then(res => res.json())
         .then(data => setPrivateState(data))
         .catch(console.error);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.roomName]);

  const isOwner = props.userChoices.username === props.roomName;
  const isModel = props.userRole === 'model';
  const isPayer = privateState.payer === props.userChoices.username;
  const showBlur = privateState.isPrivate && !isOwner && !isModel && !isPayer;
  // remoteParticipants hook moved to GiftOverlay

  React.useEffect(() => {
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              alert(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, room, e2eePassphrase, keyProvider]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);



  const lowPowerMode = useLowCPUOptimizer(room);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    const isPermissionError = error.name === 'NotAllowedError' || 
                             error.name === 'PermissionDeniedError' || 
                             error.message.includes('Permission denied');
    if (isPermissionError) {
       console.warn('Media permissions denied by user.');
       return;
    }
    console.error(error);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    room.on(RoomEvent.MediaDevicesError, handleError);

    if (e2eeSetupComplete) {
      room
        .connect(
          props.connectionDetails.serverUrl,
          props.connectionDetails.participantToken,
          connectOptions,
        )
        .catch((error) => {
          handleError(error);
        });

      if (props.userChoices.videoEnabled) {
        room.localParticipant.setCameraEnabled(true).catch((error) => {
          console.warn('Could not enable camera (likely permissions)', error);
        });
      }
      if (props.userChoices.audioEnabled) {
        room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          console.warn('Could not enable mic (likely permissions)', error);
        });
      }
    }
    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [e2eeSetupComplete, room, props.connectionDetails, props.userChoices, connectOptions, handleEncryptionError, handleError, handleOnLeave]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        {showBlur && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 320, bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
             <h1 style={{ fontSize: '3rem', color: 'var(--accent-primary)', textTransform: 'uppercase', margin: 0 }}>Private Show</h1>
             <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>This room is currently in a private session.</p>
          </div>
        )}
        <KeyboardShortcuts />
        <StreamingStage roomName={props.roomName} privateState={privateState} />
        <OverlayChat />
        <StreamStats roomName={props.roomName} />
        <SpectatorRow payerName={privateState.payer} />
        <LikeButton roomName={props.roomName} />
        <CustomControls />
        <DebugMode />
        <RecordingIndicator />
        <GiftOverlay roomName={props.roomName} username={props.userChoices.username} />
      </RoomContext.Provider>
    </div>
  );
}

function GiftOverlay({ roomName, username }: { roomName: string; username: string }) {
  const remoteParticipants = useRemoteParticipants();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [giftNotification, setGiftNotification] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const { room } = React.useContext(RoomContext) as unknown as unknown as { room: Room } || {};
  const [privateState, setPrivateState] = useState<{ isPrivate: boolean; payer?: string }>({ isPrivate: false });

  const fetchBalance = () => {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => res.json())
        .then(data => {
            if (data && typeof data.tokenBalance === 'number') setTokenBalance(data.tokenBalance);
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchBalance();
    const checkStatus = () => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/private/status?modelUsername=${roomName}`)
          .then(res => res.json())
          .then(data => setPrivateState(data))
          .catch(console.error);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [roomName]);

  const handleSendGift = async (giftId: string, price: number, name: string, recipient: RemoteParticipant) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/gift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: recipient.identity, giftId, roomName }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokenBalance(data.senderBalance);
        const giftMessage = {
          sender: username,
          recipient: recipient.name,
          giftName: name,
          price: price
        };
        if (room && room.localParticipant) {
          await room.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify(giftMessage)),
            { topic: 'gift' },
          );
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Failed to send gift', error);
      alert('Failed to send gift. See console for details.');
    }
  };

  const { message } = useDataChannel('gift');
  useEffect(() => {
    if (message && message.payload) {
      const giftMessage = JSON.parse(new TextDecoder().decode(message.payload));
      setGiftNotification(
        `${giftMessage.sender} sent ${giftMessage.recipient} ${giftMessage.giftName}!`,
      );
      setTimeout(() => setGiftNotification(null), 5000);
    }
  }, [message]);

  const startPrivateShow = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm('Start Private Show? This costs 50 tokens/min.')) return;

    // Optimistic Update
    const oldBalance = tokenBalance;
    setTokenBalance(prev => Math.max(0, prev - 50));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/private/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modelUsername: roomName }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokenBalance(data.balance);
        alert('Private show started!');
        // Refresh private status immediately
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/private/status?modelUsername=${roomName}`)
         .then(res => res.json())
         .then(data => setPrivateState(data));
      } else {
        setTokenBalance(oldBalance); // Revert on failure
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      setTokenBalance(oldBalance); // Revert on failure
      alert('Failed to start private show');
    }
  };

  const stopBroadcast = async () => {
    if (confirm('Are you sure you want to stop the broadcast? This will disconnect you from the room.')) {
        if (room) await room.disconnect();
        window.location.href = '/';
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Watch ${roomName} live!`,
      text: 'Join this live stream now!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <>
      {showStore && <TokenStore onClose={() => setShowStore(false)} onPurchaseComplete={fetchBalance} />}
      <button 
         onClick={() => setIsOpen(!isOpen)}
         style={{
           position: 'absolute',
           top: '1rem',
           right: isOpen ? '340px' : '1rem',
           zIndex: 60,
           background: 'var(--bg-card)',
           border: '1px solid var(--border-color)',
           borderRadius: '50%',
           width: '40px',
           height: '40px',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           cursor: 'pointer',
           transition: 'all 0.3s ease-in-out',
           color: 'var(--text-primary)',
           boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
         }}
         title={isOpen ? "Close Sidebar" : "Open Token Menu"}
      >
         {isOpen ? '✕' : '💰'}
      </button>

      {giftNotification && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent-primary)',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: 'var(--shadow-glow)',
          zIndex: 100,
          fontWeight: 'bold',
          animation: 'fadeInOut 5s forwards'
        }}>
          {giftNotification}
        </div>
      )}
      <div className="gift-section" style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '320px',
        background: 'var(--bg-sidebar)',
        borderLeft: '1px solid var(--border-color)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        boxShadow: isOpen ? '-5px 0 15px rgba(0,0,0,0.5)' : 'none'
      }}>
        {username === roomName && (
            <button
                onClick={stopBroadcast}
                style={{
                    background: '#ef4444',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: 'var(--border-radius-md)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                    border: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}
            >
                <span style={{fontSize: '1.2rem'}}>🛑</span> STOP BROADCAST
            </button>
        )}
        <button
          onClick={handleShare}
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            padding: '0.75rem',
            borderRadius: 'var(--border-radius-md)',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '1rem',
            border: '1px solid var(--border-color)',
            width: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🔗</span> SHARE ROOM
        </button>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          padding: '1.5rem',
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <small style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, color: 'white' }}>Your Balance</small>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{tokenBalance}</div>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>TOKENS</div>
          <button 
            onClick={() => setShowStore(true)}
            style={{
            marginTop: '1rem',
            background: 'rgba(0,0,0,0.3)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            width: '100%',
            cursor: 'pointer'
          }}>
            + BUY TOKENS
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {remoteParticipants
            .filter((p) => p.name === roomName)
            .map((participant) => (
              <div key={participant.identity}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)', 
                  paddingBottom: '0.5rem' 
                }}>
                  <h4 style={{ margin: 0 }}>Tip {participant.name}</h4>
                  <div style={{ 
                    background: 'var(--status-online)', 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%' 
                  }} />
                </div>
                
                <Gift onSendGift={(giftId, price, name) => handleSendGift(giftId, price, name, participant)} />
                
                <button 
                  onClick={startPrivateShow}
                  disabled={privateState.isPrivate}
                  style={{
                    width: '100%',
                    marginTop: '1.5rem',
                    background: privateState.isPrivate ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: privateState.isPrivate ? 'none' : '2px solid var(--accent-primary)',
                    color: privateState.isPrivate ? 'var(--text-muted)' : 'var(--accent-primary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--border-radius-sm)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                    cursor: privateState.isPrivate ? 'not-allowed' : 'pointer'
                  }}
                  onMouseOver={(e) => {
                    if (!privateState.isPrivate) {
                        e.currentTarget.style.background = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!privateState.isPrivate) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                    }
                  }}
                >
                  {privateState.isPrivate ? (privateState.payer === username ? 'Show Active' : 'Private Show Busy') : 'Request Private Show'}
                </button>
              </div>
            ))}
          {remoteParticipants.length === 0 && (
             <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>
               <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📹</div>
               <p>Waiting for model to join...</p>
             </div>
          )}
        </div>
      </div>
    </>
  );
}


