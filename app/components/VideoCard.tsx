import { useRouter } from 'next/navigation';
import { Skeleton } from './Skeleton';
import styles from '../../styles/Home.module.css';

interface VideoCardProps {
  model: {
    id: string;
    username: string;
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

  return (
    <div className={styles.card} onClick={() => router.push(`/rooms/${model.username}`)}>
      <div className={styles.thumbnailWrapper}>
        {/* Placeholder image if no real thumbnail */}
        <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${model.username}`} 
            alt={model.username}
            className={styles.thumbnail}
        />
        
        {/* Overlays */}
        <div className={styles.cardOverlayTop}>
            {isHD && <span className={styles.badgeHD}>HD</span>}
        </div>
        
        <div className={styles.cardOverlayBottom}>
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
