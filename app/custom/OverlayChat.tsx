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

export const OverlayChat = ({ mode = 'overlay' }: { mode?: 'overlay' | 'embedded' }) => {
  const { chatMessages, send } = useChat();
  const { message } = useDataChannel('gift');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);
  const [draft, setDraft] = useState('');
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [likes, setLikes] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const touchStartX = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth < 1024;

  // Listen for screen resize
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, notifications, visible]);

  useEffect(() => {
      if (message && message.payload) {
          try {
            const payload = JSON.parse(new TextDecoder().decode(message.payload));
            setNotifications(prev => [
              ...prev, 
              { ...payload, timestamp: Date.now(), type: 'gift' },
              { type: 'gift_text', text: `${payload.sender} sent ${payload.recipient} ${payload.giftName} (${payload.price} tokens)`, timestamp: Date.now() }
            ]);
            // Add tokens from gift
            if (payload.price) {
              setTotalTokens(prev => prev + payload.price);
            }
          } catch (e) {
              console.error('Failed to parse gift message', e);
          }
      }
  }, [message]);

  const handleLike = () => {
    setLikes(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('USER_LIKE', { detail: { likes } }));
  };

  const allMessages = [...chatMessages, ...notifications].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  useEffect(() => {
    const handleToggle = () => setVisible(prev => !prev);
    window.addEventListener('TOGGLE_CHAT_VISIBILITY', handleToggle);
    return () => window.removeEventListener('TOGGLE_CHAT_VISIBILITY', handleToggle);
  }, []);

  useEffect(() => {
    const handlePrefill = (e: any) => {
      const text = e.detail?.text || '';
      setVisible(true);
      setDraft(text);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    };
    window.addEventListener('CHAT_PREFILL', handlePrefill);
    return () => window.removeEventListener('CHAT_PREFILL', handlePrefill);
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
        style={mode === 'embedded' ? {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border-color)',
        } : {
            position: 'absolute',
            bottom: isMobile ? '20px' : '100px',
            left: isMobile ? '8px' : '20px',
            zIndex: 30,
            width: isMobile ? 'calc(100% - 16px)' : isTablet ? '280px' : '350px',
            maxWidth: '100%',
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
                maxHeight: isMobile ? '200px' : '300px',
                width: '100%',
                overflowY: 'auto',
                maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
                paddingBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '6px' : '8px'
            }}>
                <div 
                    onClick={(e) => { e.stopPropagation(); setVisible(false); }}
                    style={{
                        alignSelf: 'flex-start',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: isMobile ? '0.7rem' : '0.8rem',
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
                    const isGiftText = (msg as any).type === 'gift_text';
                    
                    if (isGift) {
                        return (
                            <div key={`gift-${idx}`} style={{
                                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 165, 0, 0.95))',
                                padding: isMobile ? '8px 12px' : '10px 16px',
                                borderRadius: '16px',
                                color: '#7c2d12',
                                width: 'fit-content',
                                fontSize: isMobile ? '0.85rem' : '0.95rem',
                                boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
                                border: '2px solid rgba(255,255,255,0.5)',
                                animation: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                textAlign: 'center',
                                minWidth: isMobile ? '160px' : '200px',
                                maxWidth: '100%',
                                transformOrigin: 'bottom left'
                            }}>
                                <div style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}>🎁 ✨</div>
                                <div style={{ fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                                    <b>{msg.sender}</b> sent <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{msg.giftName}</span>
                                </div>
                                <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700, background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>🪙</span> <span>{msg.price} Tokens</span>
                                </div>
                            </div>
                        );
                    }
                    if (isGiftText) {
                        return (
                            <div key={`gifttext-${idx}`} style={{ 
                                background: 'rgba(0,0,0,0.4)',
                                padding: isMobile ? '5px 8px' : '6px 10px',
                                borderRadius: '12px',
                                backdropFilter: 'blur(4px)',
                                width: 'fit-content',
                                maxWidth: '100%',
                                wordWrap: 'break-word',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>🎁</span>
                                <span style={{ color: 'white', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>{(msg as any).text}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.timestamp} style={{ 
                            background: 'rgba(0,0,0,0.4)',
                            padding: isMobile ? '5px 8px' : '6px 10px',
                            borderRadius: '12px',
                            backdropFilter: 'blur(4px)',
                            width: 'fit-content',
                            maxWidth: '100%',
                            wordWrap: 'break-word'
                        }}>
                            <span style={{ fontWeight: '700', color: getUsernameColor(msg.from?.name || 'Guest'), marginRight: '6px', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                                {msg.from?.name || 'Guest'}:
                            </span>
                            <span style={{ color: 'white', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>{msg.message}</span>
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
                 marginTop: isMobile ? '6px' : '8px', 
                 display: 'flex', 
                 gap: isMobile ? '4px' : '6px',
                 pointerEvents: 'auto'
             }}>
                <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('SHOW_CONTROLS'));
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: '50%',
                        width: isMobile ? '32px' : '36px',
                        height: isMobile ? '32px' : '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                        fontSize: isMobile ? '14px' : '16px',
                        flexShrink: 0
                    }}
                    title="Broadcast controls"
                >
                    ⚙️
                </button>
                <input 
                    type="text" 
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={isMobile ? "Message or ❤️..." : "Message or click ❤️ to like..."}
                    ref={inputRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        padding: isMobile ? '6px 10px' : '8px 12px',
                        color: 'white',
                        outline: 'none',
                        fontSize: '14px' // Prevents zoom on iOS
                    }}
                />
                <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleLike();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.3)';
                    }}
                    style={{
                        background: 'rgba(236, 72, 153, 0.3)',
                        border: '1px solid rgba(236, 72, 153, 0.5)',
                        borderRadius: '50%',
                        width: isMobile ? '32px' : '36px',
                        height: isMobile ? '32px' : '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ec4899',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                        fontSize: isMobile ? '14px' : '16px',
                        transition: 'all 0.2s'
                    }}
                    title="Like broadcast"
                >
                    ❤️
                </button>
                <button 
                    type="submit"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                        background: 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: '50%',
                        width: isMobile ? '32px' : '36px',
                        height: isMobile ? '32px' : '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                        fontSize: isMobile ? '14px' : '16px'
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
