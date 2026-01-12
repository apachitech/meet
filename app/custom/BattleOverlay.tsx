'use client';

import React, { useEffect, useState } from 'react';

interface BattleState {
  isActive: boolean;
  challenger: string;
  opponent: string;
  startTime: number;
  duration: number;
  scoreChallenger: number;
  scoreOpponent: number;
}

export function BattleOverlay({ battle }: { battle: BattleState }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth < 1024;

  useEffect(() => {
    if (battle.isActive) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - battle.startTime) / 1000;
        const remaining = Math.max(0, battle.duration - elapsed);
        setTimeLeft(remaining);
        if (remaining <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [battle]);

  if (!battle.isActive) return null;

  const totalScore = battle.scoreChallenger + battle.scoreOpponent;
  const percentageChallenger = totalScore === 0 ? 50 : (battle.scoreChallenger / totalScore) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? '50px' : '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: isMobile ? '95%' : isTablet ? '85%' : '80%',
      maxWidth: '600px',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      animation: 'slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
       <style jsx>{`
         @keyframes slideDown {
           from { transform: translate(-50%, -100px); opacity: 0; }
           to { transform: translate(-50%, 0); opacity: 1; }
         }
       `}</style>
       
       {/* VS Badge */}
       <div style={{
         position: 'absolute',
         top: '50%',
         left: '50%',
         transform: 'translate(-50%, -50%)',
         background: 'linear-gradient(45deg, #ff0000, #0000ff)',
         borderRadius: '50%',
         width: isMobile ? '40px' : '50px',
         height: isMobile ? '40px' : '50px',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         fontWeight: 900,
         fontSize: isMobile ? '1.2rem' : '1.5rem',
         color: 'white',
         boxShadow: '0 0 20px rgba(0,0,0,0.5)',
         border: `${isMobile ? '3px' : '4px'} solid white`,
         zIndex: 10
       }}>
         VS
       </div>

       {/* Progress Bar Container */}
       <div style={{
         width: '100%',
         height: isMobile ? '32px' : '40px',
         background: 'rgba(0,0,0,0.8)',
         borderRadius: '20px',
         overflow: 'hidden',
         display: 'flex',
         border: '2px solid rgba(255,255,255,0.2)',
         position: 'relative'
       }}>
         {/* Challenger Bar (Red) */}
         <div style={{
           width: `${percentageChallenger}%`,
           background: 'linear-gradient(90deg, #ef4444, #b91c1c)',
           height: '100%',
           transition: 'width 0.5s ease-out',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'flex-start',
           paddingLeft: isMobile ? '0.5rem' : '1rem'
         }}>
            <span style={{ fontWeight: 'bold', color: 'white', textShadow: '0 1px 2px black', fontSize: isMobile ? '0.75rem' : '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {battle.challenger} ({battle.scoreChallenger})
            </span>
         </div>

         {/* Opponent Bar (Blue) */}
         <div style={{
           flex: 1,
           background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
           height: '100%',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'flex-end',
           paddingRight: isMobile ? '0.5rem' : '1rem'
         }}>
            <span style={{ fontWeight: 'bold', color: 'white', textShadow: '0 1px 2px black', fontSize: isMobile ? '0.75rem' : '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {battle.scoreOpponent} ({battle.opponent})
            </span>
         </div>
       </div>

       {/* Timer */}
       <div style={{
         marginTop: isMobile ? '0.4rem' : '0.5rem',
         background: 'rgba(0,0,0,0.7)',
         padding: isMobile ? '0.2rem 0.8rem' : '0.25rem 1rem',
         borderRadius: '12px',
         color: timeLeft < 30 ? '#ef4444' : 'white',
         fontWeight: 800,
         fontSize: isMobile ? '1rem' : '1.2rem',
         border: '1px solid rgba(255,255,255,0.1)'
       }}>
         {formatTime(timeLeft)}
       </div>
    </div>
  );
}
