'use client';

import Image from 'next/image';
import { useDataChannel } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';
import { api } from '../../lib/api';

export function LiveStatsBar({ roomName }: { roomName: string }) {
  const { message: reactionMessage } = useDataChannel('reaction');
  const { message: giftMessage } = useDataChannel('gift');
  const [likes, setLikes] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [views, setViews] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    const refresh = () => {
      fetch(`${API_BASE}/api/users/${roomName}`)
        .then(res => res.json())
        .then(data => {
          setLikes(data?.totalLikes || 0);
          setFollowers(data?.followersCount || 0);
          setViews(data?.viewsCount || 0);
          setTokens(data?.tokenBalance || 0);
        })
        .catch(() => {});
    };
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [roomName]);

  useEffect(() => {
    if (reactionMessage) {
      setLikes(v => v + 1);
    }
  }, [reactionMessage]);

  useEffect(() => {
    if (giftMessage && giftMessage.payload) {
      try {
        const payload = JSON.parse(new TextDecoder().decode(giftMessage.payload));
        if (payload.recipient === roomName && typeof payload.price === 'number') {
          setTokens(t => t + payload.price);
        }
      } catch {}
    }
  }, [giftMessage, roomName]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    api.get(`/api/users/${roomName}/is-following`, true)
      .then(res => res.json())
      .then(data => setIsFollowing(!!data?.isFollowing))
      .catch(() => {});
  }, [roomName]);

  const toggleFollow = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    if (isFollowing) {
      const res = await api.post(`/api/users/${roomName}/unfollow`, {}, true);
      const data = await res.json();
      setIsFollowing(false);
      setFollowers(data?.followersCount ?? followers);
    } else {
      const res = await api.post(`/api/users/${roomName}/follow`, {}, true);
      const data = await res.json();
      setIsFollowing(true);
      setFollowers(data?.followersCount ?? followers);
    }
  };

  return (
    <>
      <button
        onClick={() => setVisible(v => !v)}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 51,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(0,0,0,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Show stats"
      >
        <Image
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(roomName)}`}
          alt="Profile"
          fill
        />
      </button>
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '4.5rem',
          zIndex: 50,
          display: 'flex',
          gap: '0.75rem',
          background: 'rgba(0,0,0,0.6)',
          padding: '0.5rem 0.75rem',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.85rem',
          transform: `translateY(${visible ? '0' : '-150%'})`,
          transition: 'transform 0.25s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>👁️</span> {views}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#ef4444' }}>❤️</span> {likes}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#eab308' }}>🪙</span> {tokens}
        </div>
        <button
          onClick={toggleFollow}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isFollowing ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.4)',
            color: '#22c55e',
            padding: '4px 8px',
            borderRadius: '12px',
            cursor: 'pointer'
          }}
          title={isFollowing ? 'Unfollow' : 'Follow'}
        >
          <span>👥</span> {followers} {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </>
  );
}
