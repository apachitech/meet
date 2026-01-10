'use client';

import { useChat, useDataChannel } from '@livekit/components-react';
import { useState, useEffect, useRef } from 'react';

const getUsernameColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 75%, 60%)`; 
};

export const OverlayChat = () => {
  const { chatMessages, send } = useChat();
  const { message } = useDataChannel('gift');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);
  const [draft, setDraft] = useState('');
  const touchStartX = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, notifications, visible]);

  useEffect(() => {
      if (message && message.payload) {
          try {
            const payload = JSON.parse(new TextDecoder().decode(message.payload));
            setNotifications(prev => [...prev, { ...payload, timestamp: Date.now(), type: 'gift' }]);
          } catch (e) {
              console.error('Failed to parse gift message', e);
          }
      }
  }, [message]);

  const allMessages = [...chatMessages, ...notifications].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  useEffect(() => {
    const handleToggle = () => setVisible(prev => !prev);
    window.addEventListener('TOGGLE_CHAT_VISIBILITY', handleToggle);
    return () => window.removeEventListener('TOGGLE_CHAT_VISIBILITY', handleToggle);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !send) return;
    try {
        await send(draft);
        setDraft('');
    } catch (error) {
        console.error('Failed to send message', error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchStartX.current = clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - touchStartX.current;
    
    if (diff > 50) { // Swipe Right
      setVisible(false);
    } else if (diff < -50) { // Swipe Left
      setVisible(true);
    }
  };

  return (
    <div 
        className="overlay-chat-container"
        style={{
            position: 'absolute',
            bottom: '100px',
            left: '20px',
            zIndex: 30,
            width: '350px',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
    >
        {!visible && (
            <div style={{
                background: 'rgba(0,0,0,0.5)',
                padding: '6px 12px',
                borderRadius: '20px',
                color: 'white',
                fontSize: '0.8rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.2)'
            }} onClick={() => setVisible(true)}>
                Show Chat ›
            </div>
        )}
        
        {visible && (
            <div style={{
                maxHeight: '300px',
                width: '100%',
                overflowY: 'auto',
                maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
                paddingBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div 
                    onClick={(e) => { e.stopPropagation(); setVisible(false); }}
                    style={{
                        alignSelf: 'flex-start',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.2)',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                   <span>‹</span> Hide
                </div>
                {allMessages.map((msg, idx) => {
                    const isGift = (msg as any).type === 'gift';
                    
                    if (isGift) {
                        return (
                            <div key={`gift-${idx}`} style={{
                                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 165, 0, 0.95))',
                                padding: '10px 16px',
                                borderRadius: '16px',
                                color: '#7c2d12',
                                width: 'fit-content',
                                fontSize: '0.95rem',
                                boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
                                border: '2px solid rgba(255,255,255,0.5)',
                                animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                textAlign: 'center',
                                minWidth: '200px',
                                transformOrigin: 'bottom left'
                            }}>
                                <div style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}>🎁 ✨</div>
                                <div>
                                    <b>{msg.sender}</b> sent <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{msg.giftName}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.8, background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '10px' }}>
                                    💎 {msg.price} tokens
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.timestamp} style={{ 
                            background: 'rgba(0,0,0,0.4)',
                            padding: '6px 10px',
                            borderRadius: '12px',
                            backdropFilter: 'blur(4px)',
                            width: 'fit-content',
                            maxWidth: '100%',
                            wordWrap: 'break-word'
                        }}>
                            <span style={{ fontWeight: '700', color: getUsernameColor(msg.from?.name || 'Guest'), marginRight: '6px' }}>
                                {msg.from?.name || 'Guest'}:
                            </span>
                            <span style={{ color: 'white', fontSize: '0.95rem' }}>{msg.message}</span>
                        </div>
                    );
                })}
                {allMessages.length === 0 && (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', paddingLeft: '4px' }}>
                        Swipe or click arrow to hide...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
        )}

        {visible && (
             <form onSubmit={handleSend} style={{ 
                 width: '100%', 
                 marginTop: '8px', 
                 display: 'flex', 
                 gap: '8px',
                 pointerEvents: 'auto'
             }}>
                <input 
                    type="text" 
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        padding: '8px 12px',
                        color: 'white',
                        outline: 'none',
                        fontSize: '14px' // Prevents zoom on iOS
                    }}
                />
                <button 
                    type="submit"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                        background: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                    }}
                >
                    ➤
                </button>
             </form>
        )}
        <style jsx>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes popIn {
                0% { opacity: 0; transform: scale(0.5) translateY(20px); }
                70% { transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
        `}</style>
    </div>
  );
};
