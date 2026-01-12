'use client';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useState, useCallback } from 'react';

export const CustomControls = () => {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isVisible, setIsVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isVideoMaximized, setIsVideoMaximized] = useState(false);

  // Activity monitor for auto-hide
  useEffect(() => {
    const handleActivity = () => {
      setIsVisible(true);
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 3000) { // Hide after 3s
        setIsVisible(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity]);

  const toggleMic = useCallback(() => {
    const enabled = localParticipant.isMicrophoneEnabled;
    localParticipant.setMicrophoneEnabled(!enabled);
  }, [localParticipant]);

  const toggleCam = useCallback(() => {
    const enabled = localParticipant.isCameraEnabled;
    localParticipant.setCameraEnabled(!enabled);
  }, [localParticipant]);

  const toggleScreenShare = useCallback(async () => {
    try {
        const enabled = localParticipant.isScreenShareEnabled;
        await localParticipant.setScreenShareEnabled(!enabled);
    } catch (error) {
        console.error('Error toggling screen share:', error);
        alert('Failed to toggle screen share. Check permissions.');
    }
  }, [localParticipant]);

  const toggleVideoMaximize = useCallback(() => {
    setIsVideoMaximized(!isVideoMaximized);
    window.dispatchEvent(new CustomEvent('TOGGLE_VIDEO_MAXIMIZE', { 
      detail: { isMaximized: !isVideoMaximized } 
    }));
  }, [isVideoMaximized]);

  const leaveRoom = useCallback(() => {
    if (confirm('Are you sure you want to leave?')) {
        room.disconnect();
        window.location.href = '/';
    }
  }, [room]);

  const toggleChat = () => {
      window.dispatchEvent(new CustomEvent('TOGGLE_CHAT_VISIBILITY'));
  };

  // Responsive design
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const isMobile = screenSize.width < 640;
  const isTablet = screenSize.width < 1024;
  const buttonSize = isMobile ? '40px' : '44px';
  const buttonGap = isMobile ? '0.25rem' : '0.5rem';
  const padding = isMobile ? '0.6rem 0.8rem' : '0.75rem 1rem';

  return (
    <div
      style={{
        position: 'fixed',
        top: isMobile ? '60px' : 'auto',
        bottom: isMobile ? 'auto' : '2rem',
        left: isMobile ? '0.5rem' : '50%',
        right: isMobile ? '0.5rem' : 'auto',
        transform: isMobile ? `translateY(${isVisible ? '0' : '-150%'})` : `translateX(-50%) translateY(${isVisible ? '0' : '150%'})`,
        display: 'flex',
        gap: buttonGap,
        padding: padding,
        background: 'rgba(15, 15, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '16px' : '60px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 50,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        justifyContent: 'center',
        maxWidth: isMobile ? 'calc(100% - 1rem)' : '90vw',
        alignItems: 'center',
      }}
    >
      {/* Primary Controls */}
      <div style={{ display: 'flex', gap: `${buttonGap}rem`, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <ControlButton 
          active={localParticipant.isMicrophoneEnabled} 
          onClick={toggleMic}
          icon={localParticipant.isMicrophoneEnabled ? <MicIcon /> : <MicOffIcon />}
          label="Mic"
          size={buttonSize}
          isMobile={isMobile}
        />
        
        <ControlButton 
          active={localParticipant.isCameraEnabled} 
          onClick={toggleCam}
          icon={localParticipant.isCameraEnabled ? <CamIcon /> : <CamOffIcon />}
          label="Camera"
          size={buttonSize}
          isMobile={isMobile}
        />

        {!isMobile && (
          <ControlButton 
            active={localParticipant.isScreenShareEnabled} 
            onClick={toggleScreenShare}
            icon={<ScreenShareIcon />}
            label="Share"
            size={buttonSize}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Separator */}
      {!isMobile && <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 0.25rem' }} />}

      {/* Secondary Controls */}
      <div style={{ display: 'flex', gap: `${buttonGap}rem`, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {isMobile && (
          <ControlButton 
            active={localParticipant.isScreenShareEnabled} 
            onClick={toggleScreenShare}
            icon={<ScreenShareIcon />}
            label="Share"
            size={buttonSize}
            isMobile={isMobile}
          />
        )}

        <ControlButton 
          active={isVideoMaximized}
          onClick={toggleVideoMaximize}
          icon={isVideoMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
          label={isVideoMaximized ? 'Min' : 'Max'}
          size={buttonSize}
          isMobile={isMobile}
        />

        {!isMobile && (
          <ControlButton 
            active={false}
            onClick={toggleChat}
            icon={<ChatIcon />}
            label="Chat"
            size={buttonSize}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Separator */}
      {!isMobile && <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 0.25rem' }} />}

      {/* Leave Button */}
      <button
        onClick={leaveRoom}
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          border: 'none',
          borderRadius: '50%',
          width: buttonSize,
          height: buttonSize,
          minWidth: buttonSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        }}
        title="Leave Room"
      >
        <LeaveIcon size={isMobile ? 18 : 20} />
      </button>

      {isMobile && (
        <ControlButton 
          active={false}
          onClick={toggleChat}
          icon={<ChatIcon />}
          label="Chat"
          size={buttonSize}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

const ControlButton = ({ active, onClick, icon, label, size = '44px', isMobile = false }: any) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: active 
          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
          : 'rgba(255,255,255,0.1)',
        color: active ? 'white' : 'rgba(255,255,255,0.8)',
        border: active ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '50%',
        width: size,
        height: size,
        minWidth: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        fontWeight: '600',
        backdropFilter: 'blur(10px)',
        padding: '0',
      }}
      onMouseOver={(e) => {
          const btn = e.currentTarget;
          if (!active) {
            btn.style.background = 'rgba(255,255,255,0.15)';
            btn.style.border = '1px solid rgba(255,255,255,0.2)';
          }
          btn.style.transform = 'scale(1.05)';
      }}
      onMouseOut={(e) => {
          const btn = e.currentTarget;
          if (!active) {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.border = '1px solid rgba(255,255,255,0.1)';
          }
          btn.style.transform = 'scale(1)';
      }}
      title={label}
    >
      {icon}
    </button>
  );
};

// Icons
const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
);

const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
);

const CamIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
);

const CamOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 7.16"></path><line x1="1" y1="1" x2="23" y2="23"></line><path d="M23 7l-7 5 7 5V7z"></path></svg>
);

const ScreenShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path><polyline points="8 21 12 17 16 21"></polyline><line x1="12" y1="17" x2="12" y2="22"></line><polyline points="17 9 22 4 17 4 17 9"></polyline><line x1="12" y1="14" x2="22" y2="4"></line></svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const MaximizeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
);

const MinimizeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v6h6M16 21v-6h-6M21 8h-6V2M3 16h6v6"></path></svg>
);

const LeaveIcon = ({ size = 20 }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
