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
  VideoConference,
  useDataChannel,
  useRemoteParticipants,
} from '@livekit/components-react';
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      if (decoded && decoded.username) {
        setUserChoices((prev) => ({
          ...prev,
          username: decoded.username,
        }));
      }

      // Fetch profile to set permissions correctly (ignoring stale token role)
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
            throw new Error('Failed to fetch profile');
          }
          return res.json();
        })
        .then((data) => {
          const isModel = data.role === 'model';
          setUserChoices((prev) => ({
            ...prev,
            username: data.username,
            videoEnabled: isModel,
            audioEnabled: isModel
          }));
        })
        .catch(console.error);

      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomName', props.roomName);
      if (props.region) {
        url.searchParams.append('region', props.region);
      }

      fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => setConnectionDetails(data))
        .catch((err) => {
          console.error('Failed to fetch connection details:', err);
          if (err.message.includes('403') || err.message.includes('401')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        });
    } else {
      window.location.href = '/login';
    }
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
        />
      )}
    </main>
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
}) {
  const keyProvider = new ExternalE2EEKeyProvider();
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
      dtx: false,
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
  }, [props.userChoices, props.options.hq, props.options.codec, e2eeEnabled]);

  const room = React.useMemo(() => new Room(roomOptions), [roomOptions]);
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
  }, [e2eeSetupComplete, room, props.connectionDetails, props.userChoices, connectOptions]);

  const lowPowerMode = useLowCPUOptimizer(room);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
  }, []);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
        />
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
  const { room } = React.useContext(RoomContext) as unknown as unknown as { room: Room } || {};

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
            throw new Error('Failed to fetch profile');
          }
          return res.json();
        })
        .then((data) => setTokenBalance(data.tokenBalance))
        .catch(console.error);
    }
  }, []);

  const handleSendGift = async (giftId: string, recipient: RemoteParticipant) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/gift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: recipient.identity, giftId }),
      });
      const data = await res.json();
      if (res.ok) {
        setTokenBalance(data.senderBalance);
        const giftMessage = {
          sender: username,
          recipient: recipient.name,
          giftName: 'a gift',
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

  return (
    <>
      {giftNotification && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent-secondary)',
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
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid var(--border-color)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        zIndex: 50
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          padding: '1rem',
          borderRadius: 'var(--border-radius-md)',
          textAlign: 'center'
        }}>
          <small style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, opacity: 0.9 }}>Your Balance</small>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{tokenBalance} <span style={{ fontSize: '1rem' }}>TKNS</span></div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {remoteParticipants
            .filter((p) => p.name === roomName)
            .map((participant) => (
              <div key={participant.identity}>
                <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Tip {participant.name}
                </h4>
                <Gift onSendGift={(giftId) => handleSendGift(giftId, participant)} />
              </div>
            ))}
          {remoteParticipants.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>
              Waiting for model...
            </p>
          )}
        </div>
      </div>
    </>
  );
}


