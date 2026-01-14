'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '../../lib/api';

interface RelatedBroadcastsProps {
  currentRoom: string;
}

export function RelatedBroadcasts({ currentRoom }: RelatedBroadcastsProps) {
  const router = useRouter();
  const [models, setModels] = useState<{ id: string; username: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson('/api/models')
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter out current room and limit to 4-8 items
          const related = data
            .filter((m: any) => m.username !== currentRoom)
            .slice(0, 8);
          setModels(related as { id: string; username: string }[]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentRoom]);

  if (models.length === 0 && !loading) return null;

  return (
    <div style={{ padding: '2rem', background: '#0a0a0a' }}>
      <h3 style={{ 
        color: 'white', 
        marginBottom: '1rem', 
        fontSize: '1.2rem',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Related Broadcasts
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '1rem' 
      }}>
        {loading ? (
           // Skeleton loading
           Array.from({ length: 4 }).map((_, i) => (
             <div key={i} style={{ 
               aspectRatio: '16/9', 
               background: '#1a1a1a', 
               borderRadius: '8px',
               animation: 'pulse 1.5s infinite' 
             }} />
           ))
        ) : (
          models.map((model) => (
            <div
              key={model.id}
              onClick={() => router.push(`/rooms/${model.username}`)}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                background: '#1a1a1a',
                transition: 'transform 0.2s',
                aspectRatio: '16/9'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${model.username}`} 
                alt={model.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '0.5rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                color: 'white'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{model.username}</div>
                <div style={{ fontSize: '0.75rem', color: '#ccc' }}>LIVE</div>
              </div>
            </div>
          ))
        )}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.8; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
