'use client';

import { 
  useTracks, 
  VideoTrack, 
  AudioTrack,
  useLocalParticipant
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import React, { useMemo, useState, useEffect } from 'react';

interface StreamingStageProps {
  roomName: string;
  privateState: { isPrivate: boolean; payer?: string };
  battleState?: { isActive: boolean; challenger: string; opponent: string };
}

export function StreamingStage({ roomName, privateState, battleState }: StreamingStageProps) {
  const { localParticipant } = useLocalParticipant();
  const [isVideoMaximized, setIsVideoMaximized] = useState(true);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Listen for screen resize
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth < 1024;
  
  // Responsive PiP sizing
  const pipWidth = isMobile ? '120px' : isTablet ? '160px' : '200px';
  const pipBottom = isMobile ? '60px' : '100px';
  const pipLeft = isMobile ? '8px' : '15px';
  const pipRight = isMobile ? '8px' : '15px';
  const pipBorderRadius = isMobile ? '8px' : '12px';
  
  // Get all video tracks
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const audioTracks = useTracks([Track.Source.Microphone]);

  // Listen for maximize/minimize event
  useEffect(() => {
    const handleToggleMaximize = (event: any) => {
      setIsVideoMaximized(event.detail?.isMaximized ?? true);
    };
    window.addEventListener('TOGGLE_VIDEO_MAXIMIZE', handleToggleMaximize);
    return () => window.removeEventListener('TOGGLE_VIDEO_MAXIMIZE', handleToggleMaximize);
  }, []);

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
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
           {/* Left: Broadcaster (Challenger) */}
           <div style={{ flex: 1, position: 'relative', borderRight: isMobile ? 'none' : '3px solid rgba(255,255,255,0.2)', borderBottom: isMobile ? '3px solid rgba(255,255,255,0.2)' : 'none' }}>
             {broadcasterCam || broadcasterScreen ? (
                 <VideoTrack trackRef={(broadcasterCam || broadcasterScreen)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
                 <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    🎥 Challenger Camera Off
                 </div>
             )}
             <div style={{ 
               position: 'absolute', 
               top: isMobile ? '10px' : '15px', 
               left: isMobile ? '10px' : '15px', 
               background: 'linear-gradient(135deg, rgba(220,38,38,0.9) 0%, rgba(127,29,29,0.9) 100%)', 
               padding: isMobile ? '6px 12px' : '8px 16px', 
               borderRadius: '20px', 
               color: 'white', 
               fontWeight: 'bold',
               fontSize: isMobile ? '0.8rem' : '0.9rem',
               backdropFilter: 'blur(10px)',
               border: '1px solid rgba(255,255,255,0.2)'
             }}>
                {battleState.challenger}
             </div>
           </div>

           {/* Right: Opponent */}
           <div style={{ flex: 1, position: 'relative' }}>
             {opponentTrack ? (
                 <VideoTrack trackRef={opponentTrack} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
                 <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    🎥 Opponent Camera Off
                 </div>
             )}
             <div style={{ 
               position: 'absolute', 
               top: isMobile ? '10px' : '15px', 
               right: isMobile ? '10px' : '15px', 
               background: 'linear-gradient(135deg, rgba(30,58,138,0.9) 0%, rgba(15,23,42,0.9) 100%)', 
               padding: isMobile ? '6px 12px' : '8px 16px', 
               borderRadius: '20px', 
               color: 'white', 
               fontWeight: 'bold',
               fontSize: isMobile ? '0.8rem' : '0.9rem',
               backdropFilter: 'blur(10px)',
               border: '1px solid rgba(255,255,255,0.2)'
             }}>
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

       {/* Broadcaster Camera PiP (if Screen Sharing) - Hidden when maximized */}
       {pipTrack && isVideoMaximized && (
         <div style={{
           position: 'absolute',
           bottom: pipBottom,
           left: pipLeft,
           width: pipWidth,
           aspectRatio: '16/9',
           borderRadius: pipBorderRadius,
           overflow: 'hidden',
           boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
           border: '2px solid rgba(59, 130, 246, 0.5)',
           zIndex: 35,
           background: '#000',
           transition: 'all 0.3s ease-in-out'
         }}>
           <VideoTrack 
             trackRef={pipTrack}
             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
           />
           <div style={{
             position: 'absolute',
             bottom: 0,
             left: 0,
             right: 0,
             padding: isMobile ? '4px 6px' : '6px 10px',
             background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
             color: 'white',
             fontSize: isMobile ? '0.7rem' : '0.8rem',
             fontWeight: '600'
           }}>
             Your Camera
           </div>
         </div>
       )}

       {/* Private Show Guest (PiP) - Hidden when maximized */}
       {payerTrack && isVideoMaximized && (
         <div style={{
           position: 'absolute',
           bottom: pipBottom,
           right: pipRight,
           width: pipWidth,
           aspectRatio: '16/9',
           borderRadius: pipBorderRadius,
           overflow: 'hidden',
           boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
           border: '2px solid rgba(236, 72, 153, 0.6)',
           zIndex: 35,
           background: '#000',
           transition: 'all 0.3s ease-in-out'
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
             padding: isMobile ? '4px 6px' : '6px 10px',
             background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
             color: '#ec4899',
             fontSize: isMobile ? '0.7rem' : '0.8rem',
             fontWeight: '600'
           }}>
             💎 {payerTrack.participant.name}
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
