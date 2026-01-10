'use client';

import { useRemoteParticipants, useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RemoteParticipant } from 'livekit-client';
import { useState, useEffect } from 'react';

const getUsernameColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 75%, 60%)`; 
};

export const SpectatorRow = ({ payerName }: { payerName?: string }) => {
  const participants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fullyExpandedId, setFullyExpandedId] = useState<string | null>(null);

  const isOwner = room.name === localParticipant.identity || room.name === localParticipant.name;

  const handleKick = async (participantIdentity: string) => {
    if (!confirm('Are you sure you want to kick this user?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/kick', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                roomName: room.name,
                participantIdentity: participantIdentity
            })
        });
        
        const data = await res.json();
        if (res.ok) {
            alert('User kicked successfully');
            setFullyExpandedId(null);
        } else {
            alert(data.error || 'Failed to kick user');
        }
    } catch (e) {
        console.error(e);
        alert('Error kicking user');
    }
  };

  const handleRingClick = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setFullyExpandedId(null);
    } else {
      setExpandedId(id);
      setFullyExpandedId(null);
    }
  };

  const handleExpandMore = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFullyExpandedId(id);
  };

  const allParticipants = [localParticipant, ...participants];
  const activeParticipant = allParticipants.find(p => p.identity === fullyExpandedId);

  const handleChallenge = async (participantName: string) => {
    if (!confirm(`Challenge ${participantName} to a Battle?`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/battle/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ roomName: room.name, opponentUsername: participantName })
        });
        if (res.ok) {
            alert('Battle Challenge Sent!');
            setFullyExpandedId(null);
        } else {
            alert('Failed to start battle');
        }
    } catch(e) { console.error(e); }
  };

  return (
    <>
      <div className="spectator-row" style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.5rem',
        zIndex: 45,
        maxWidth: '80%',
        overflowX: 'auto',
        padding: '10px',
        scrollbarWidth: 'none', // Firefox
      }}>
        {allParticipants.map((p) => {
          const isPayer = p.name === payerName;
          const isExpanded = expandedId === p.identity;
          const isFull = fullyExpandedId === p.identity;
          const color = getUsernameColor(p.name || 'Guest');
          let avatarUrl = '';
          try {
             if (p.metadata) {
                 const metadata = JSON.parse(p.metadata);
                 avatarUrl = metadata.avatar;
             }
          } catch(e) {}

          return (
            <div 
              key={p.identity}
              onClick={() => handleRingClick(p.identity)}
              style={{
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0
              }}
            >
              {/* Ring / Avatar */}
              <div style={{
                width: isPayer ? '50px' : '40px',
                height: isPayer ? '50px' : '40px',
                borderRadius: '50%',
                border: `2px solid ${isPayer ? 'var(--accent-primary)' : color}`,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isPayer ? '1.2rem' : '1rem',
                fontWeight: 700,
                color: 'white',
                boxShadow: isPayer ? '0 0 15px var(--accent-primary)' : '0 2px 5px rgba(0,0,0,0.3)',
                zIndex: 2,
                flexShrink: 0,
                overflow: 'hidden',
                backgroundSize: 'cover',
                backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none'
              }}>
                {!avatarUrl && (p.name?.substring(0, 2).toUpperCase() || 'GU')}
              </div>

              {/* Expanded Card (Name) */}
              {(isExpanded || isPayer) && (
                 <div style={{
                   marginLeft: '-20px',
                   paddingLeft: '25px',
                   paddingRight: '15px',
                   height: '36px',
                   background: isPayer ? 'linear-gradient(90deg, var(--accent-primary), #9a3412)' : 'rgba(0,0,0,0.8)',
                   borderRadius: '0 20px 20px 0',
                   display: 'flex',
                   alignItems: 'center',
                   color: 'white',
                   fontSize: '0.85rem',
                   fontWeight: 600,
                   whiteSpace: 'nowrap',
                   animation: 'slideOut 0.3s forwards',
                   border: '1px solid rgba(255,255,255,0.1)',
                   gap: '8px'
                 }}>
                   {p.name}
                   {isPayer && <span style={{ fontSize: '0.7rem', background: 'white', color: 'var(--accent-primary)', padding: '1px 4px', borderRadius: '4px' }}>VIP</span>}
                   
                   {isExpanded && !isFull && (
                     <button 
                       onClick={(e) => handleExpandMore(e, p.identity)}
                       style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                       }}
                     >
                       +
                     </button>
                   )}
                 </div>
              )}
            </div>
          );
        })}
        <style jsx>{`
          @keyframes slideOut {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-5px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .spectator-row::-webkit-scrollbar {
              display: none;
          }
        `}</style>
      </div>

      {/* Fully Expanded Modal (Fixed Position) */}
      {fullyExpandedId && activeParticipant && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setFullyExpandedId(null)}>
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-md)',
                width: '300px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                animation: 'fadeIn 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => setFullyExpandedId(null)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}
                >✕</button>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: `3px solid ${getUsernameColor(activeParticipant.name || 'Guest')}`,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'white',
                    margin: '0 auto 1rem auto',
                    overflow: 'hidden',
                    backgroundSize: 'cover',
                    backgroundImage: activeParticipant.metadata && JSON.parse(activeParticipant.metadata).avatar ? `url(${JSON.parse(activeParticipant.metadata).avatar})` : 'none'
                  }}>
                    {!(activeParticipant.metadata && JSON.parse(activeParticipant.metadata).avatar) && (activeParticipant.name?.substring(0, 2).toUpperCase() || 'GU')}
                  </div>
                  <h3 style={{ margin: 0, color: 'white' }}>{activeParticipant.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                    {activeParticipant.permissions?.canPublish ? 'Broadcaster' : 'Viewer'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button style={{ padding: '10px', background: 'var(--accent-primary)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      View Profile
                    </button>
                    <button style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      Message
                    </button>
                </div>

                {isOwner && activeParticipant.identity !== localParticipant.identity && (
                    <button 
                        onClick={() => handleKick(activeParticipant.identity)}
                        style={{ 
                          width: '100%', 
                          padding: '12px', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: '#ef4444', 
                          border: '1px solid #ef4444', 
                          borderRadius: '8px', 
                          fontWeight: 700, 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                    >
                        🚫 Kick User
                    </button>
                )}
            </div>
        </div>
      )}
    </>
  );
};
