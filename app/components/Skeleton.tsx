'use client';

import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '',
  style = {}
}: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: '#1a1a1a',
        ...style
      }}
    >
      <style jsx>{`
        .skeleton {
          animation: skeleton-loading 1.5s infinite linear;
          background-image: linear-gradient(90deg, #1a1a1a 0px, #2a2a2a 40px, #1a1a1a 80px);
          background-size: 200% 100%;
        }
        @keyframes skeleton-loading {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}
