import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from './Skeleton';
import styles from '../../styles/Home.module.css';

interface VideoCardProps {
  model: {
    id: string;
    username: string;
    avatar?: string;
    previewUrl?: string;
    // Add other props as they become available from API
    viewers?: number;
    tags?: string[];
    isLive?: boolean;
    thumbnailUrl?: string;
  };
  loading?: boolean;
}

export const VideoCard = ({ model, loading }: VideoCardProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
        // Attempt to play
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Auto-play was prevented", error);
            });
        }
    } else if (!isHovered && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  if (loading) {
    return (
      <div className={styles.card}>
        <Skeleton width="100%" height="100%" borderRadius="4px" />
      </div>
    );
  }

  // Generate random stats for demo purposes since API might not return them yet
  const viewers = Math.floor(Math.random() * 5000) + 100;
  const isHD = Math.random() > 0.3;

  // Use a sample video URL if previewUrl is not set (for demo purposes)
  // This is a sample MP4 link often used for testing
  const sampleVideo = "https://media.w3.org/2010/05/sintel/trailer.mp4"; 
  const previewSource = model.previewUrl || sampleVideo;

  return (
    <div 
        className={styles.card} 
        onClick={() => router.push(`/rooms/${model.username}`)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.thumbnailWrapper}>
        {/* Video Preview Layer */}
        {isHovered && (
            <video
                ref={videoRef}
                src={previewSource}
                muted
                loop
                playsInline
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 2,
                    borderRadius: '8px' // Match card border radius if any, but thumbnailWrapper usually handles overflow
                }}
            />
        )}

        {/* Real avatar or fallback */}
        <img 
            src={model.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${model.username}`} 
            alt={model.username}
            className={styles.thumbnail}
            style={{ 
                objectFit: 'cover',
                opacity: isHovered ? 0 : 1,
                transition: 'opacity 0.2s ease'
            }}
        />
        
        {/* Overlays - Hide some overlays on hover if they block view, or keep them */}
        <div className={styles.cardOverlayTop} style={{ zIndex: 3 }}>
            {isHD && <span className={styles.badgeHD}>HD</span>}
        </div>
        
        <div className={styles.cardOverlayBottom} style={{ zIndex: 3 }}>
            <span className={styles.modelName}>{model.username}</span>
            <div className={styles.cardStats}>
                <span className={styles.liveIndicator}>● LIVE</span>
                <span className={styles.viewers}>{viewers}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
