'use client';

import { useEffect, useState } from 'react';


interface Gift {
  id: string;
  name: string;
  price: number;
}

export const Gift = ({ onSendGift }: { onSendGift: (giftId: string) => void }) => {
  const [gifts, setGifts] = useState<Gift[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/gifts`)
      .then((res) => res.json())
      .then((data) => setGifts(data));
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
      {gifts.map((gift) => (
        <button
          key={gift.id}
          onClick={() => onSendGift(gift.id)}
          className="lk-button"
          style={{
            background: 'var(--bg-card) !important',
            border: '1px solid var(--border-color)',
            padding: '1rem 0.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            minHeight: '80px',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🎁</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{gift.name}</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>{gift.price} tkns</span>
        </button>
      ))}
    </div>
  );
};
