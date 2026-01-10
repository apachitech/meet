'use client';

import { useEffect, useState } from 'react';

interface Gift {
  id: string;
  name: string;
  price: number;
  icon?: string;
  type?: 'standard' | 'premium' | 'luxury';
}

export const Gift = ({ onSendGift }: { onSendGift: (giftId: string, price: number, name: string) => void }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/gifts`)
      .then((res) => res.json())
      .then((data) => setGifts(data));
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
      {gifts.map((gift) => (
        <button
          key={gift.id}
          onClick={() => onSendGift(gift.id, gift.price, gift.name)}
          style={{
            background: gift.type === 'luxury' ? 'linear-gradient(135deg, #2a2a2a, #3a3a3a)' : 'var(--bg-card-hover)',
            border: gift.type === 'premium' ? '1px solid var(--accent-primary)' : gift.type === 'luxury' ? '1px solid gold' : '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: 'var(--text-primary)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            if (gift.type === 'standard') e.currentTarget.style.borderColor = 'var(--accent-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none';
            if (gift.type === 'standard') e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
          title={gift.name}
        >
          <span style={{ fontSize: '2rem', marginBottom: '4px', filter: gift.type === 'luxury' ? 'drop-shadow(0 0 5px gold)' : 'none' }}>{gift.icon || '🎁'}</span>
          <div style={{ 
            background: 'rgba(0,0,0,0.5)', 
            padding: '2px 6px', 
            borderRadius: '10px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: gift.type === 'luxury' ? '#ffd700' : gift.type === 'premium' ? 'var(--accent-primary)' : 'white'
          }}>
            {gift.price}
          </div>
        </button>
      ))}
    </div>
  );
};
