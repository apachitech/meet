'use client';

import { 
  useTracks, 
  VideoTrack, 
  AudioTrack,
  useLocalParticipant
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import React, { useMemo } from 'react';

interface StreamingStageProps {
  roomName: string;
  privateState: { isPrivate: boolean; payer?: string };
  battleState?: { isActive: boolean; challenger: string; opponent: string };
}

export function StreamingStage({ roomName, privateState, battleState }: StreamingStageProps) {
  const { localParticipant } = useLocalParticipant();
  
  // Get all video tracks
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const audioTracks = useTracks([Track.Source.Microphone]);

  // 1. Identify Broadcaster Tracks
  const broadcasterTracks = useMemo(() => {
    return tracks.filter(tr => tr.participant.identity === roomName || tr.participant.name === roomName);
  }, [tracks, roomName]);

  const broadcasterScreen = broadcasterTracks.find(tr => tr.source === Track.Source.ScreenShare);
  const broadcasterCam = broadcasterTracks.find(tr => tr.source === Track.Source.Camera);

  // 2. Identify Payer (Private Show Guest) Track
  const payerTrack = useMemo(() => {
    if (!privateState.payer) return undefined;
    return tracks.find(tr => tr.participant.identity === privateState.payer || tr.participant.name === privateState.payer);
  }, [tracks, privateState.payer]);

  // 3. Identify Battle Opponent Track
  const opponentTrack = useMemo(() => {
    if (!battleState?.isActive || !battleState.opponent) return undefined;
    return tracks.find(tr => tr.participant.identity === battleState.opponent || tr.participant.name === battleState.opponent);
  }, [tracks, battleState]);

  // Battle Mode Layout
  if (battleState?.isActive) {
      return (
        <div className="streaming-stage" style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative', 
          background: '#000',
          overflow: 'hidden',
          display: 'flex'
        }}>
           {/* Left: Broadcaster (Challenger) */}
           <div style={{ flex: 1, position: 'relative', borderRight: '2px solid white' }}>
             {broadcasterCam || broadcasterScreen ? (
                 <VideoTrack trackRef={(broadcasterCam || broadcasterScreen)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
                 <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    Challenger Camera Off
                 </div>
             )}
             <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,0,0,0.7)', padding: '5px 10px', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>
                {battleState.challenger}
             </div>
           </div>

           {/* Right: Opponent */}
           <div style={{ flex: 1, position: 'relative' }}>
             {opponentTrack ? (
                 <VideoTrack trackRef={opponentTrack} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
                 <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    Opponent Camera Off
                 </div>
             )}
             <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,255,0.7)', padding: '5px 10px', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>
                {battleState.opponent}
             </div>
           </div>
           
           {/* Audio Tracks */}
           {audioTracks.map(track => (
              <AudioTrack key={track.publication.trackSid} trackRef={track} />
           ))}
        </div>
      );
  }

  // Standard Mode
  // Logic: Screen Share takes full screen, Camera goes to PiP
  const mainTrack = broadcasterScreen || broadcasterCam;
  const pipTrack = broadcasterScreen ? broadcasterCam : undefined;

  return (
    <div className="streaming-stage" style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative', 
      background: '#000',
      overflow: 'hidden'
    }}>
       {/* Main Stage */}
       {mainTrack ? (
         <VideoTrack 
           trackRef={mainTrack} 
           style={{ width: '100%', height: '100%', objectFit: broadcasterScreen ? 'contain' : 'cover', background: '#000' }} 
         />
       ) : (
         <div style={{ 
           width: '100%', 
           height: '100%', 
           display: 'flex', 
           alignItems: 'center', 
           justifyContent: 'center',
           color: '#555',
           flexDirection: 'column',
           background: '#111'
         }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎥</div>
            <h2 style={{ color: '#fff' }}>Waiting for Broadcast...</h2>
            {localParticipant.identity === roomName && (
               <p style={{ color: '#aaa', marginTop: '0.5rem' }}>
                 You are the broadcaster. Please enable your camera using the controls below.
               </p>
            )}
         </div>
       )}

       {/* Broadcaster Camera PiP (if Screen Sharing) */}
       {pipTrack && (
         <div style={{
           position: 'absolute',
           bottom: '20px',
           left: '20px',
           width: '160px',
           aspectRatio: '16/9',
           borderRadius: '8px',
           overflow: 'hidden',
           boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
           border: '2px solid white',
           zIndex: 40,
           background: '#000'
         }}>
           <VideoTrack 
             trackRef={pipTrack}
             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
           />
         </div>
       )}

       {/* Private Show Guest (PiP) */}
       {payerTrack && (
         <div style={{
           position: 'absolute',
           bottom: '100px',
           right: '20px',
           width: '180px',
           aspectRatio: '16/9',
           borderRadius: '12px',
           overflow: 'hidden',
           boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
           border: '2px solid var(--accent-primary)',
           zIndex: 30,
           background: '#000'
         }}>
           <VideoTrack 
             trackRef={payerTrack}
             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
           />
           <div style={{
             position: 'absolute',
             bottom: 0,
             left: 0,
             right: 0,
             padding: '4px 8px',
             background: 'rgba(0,0,0,0.7)',
             color: 'white',
             fontSize: '0.75rem',
             fontWeight: 'bold'
           }}>
             {payerTrack.participant.name} (VIP)
           </div>
         </div>
       )}

       {/* Audio Tracks (Invisible) */}
       {audioTracks.map(track => (
          <AudioTrack key={track.publication.trackSid} trackRef={track} />
           ))}
    </div>
  );
}
