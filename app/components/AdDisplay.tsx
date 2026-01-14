'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Ad {
  _id: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  location: string;
}

interface AdDisplayProps {
  location: 'home-top' | 'video-overlay' | 'sidebar' | 'footer';
  className?: string;
  style?: React.CSSProperties;
}

export function AdDisplay({ location, className, style }: AdDisplayProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    api.get(`/api/ads?location=${location}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAds(data);
      })
      .catch(console.error);
  }, [location]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  if (ads.length === 0) return null;

  const ad = ads[currentAdIndex];

  return (
    <div className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={ad.imageUrl} 
          alt={ad.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} 
        />
        <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 5px', fontSize: '10px', borderRadius: '3px', pointerEvents: 'none' }}>
           Ad
        </div>
      </a>
    </div>
  );
}
