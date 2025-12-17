'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateRoomId } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

export default function Page() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; role: 'user' | 'model' } | null>(null);
  const [models, setModels] = useState<{ id: string; username: string }[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);

    // Fetch Profile
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            router.push('/login');
          }
          throw new Error('Failed to fetch profile');
        }
        return res.json();
      })
      .then((data) => {
        if (data.username) setUser(data);
      })
      .catch((err) => {
        console.error(err);
      });

    // Fetch Models
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/models`)
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch(console.error);
  }, [router]);

  const goLive = () => {
    if (user) {
      router.push(`/rooms/${user.username}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/login');
  };

  if (!token) {
    return null;
  }

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>LiveKit Meet</div>
        <div className={styles.navActions}>
          <span className={styles.username}>Hi, {user?.username}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className={styles.main} data-lk-theme="default">
        <div className={styles.hero}>
          <h1>Welcome to the Stage</h1>
          <p>Discover live models or broadcast your own show.</p>
          {user?.role === 'model' && (
            <button className="lk-button" onClick={goLive} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
              Go Live Now
            </button>
          )}
        </div>

        <section className={styles.contentSection}>
          <h3>Live Now</h3>
          <div className={styles.modelGrid}>
            {models.map((model) => (
              <div
                key={model.id}
                className={styles.modelCard}
                onClick={() => router.push(`/rooms/${model.username}`)}
              >
                <div className={styles.cardPreview}>
                  <div className={styles.liveBadge}>LIVE</div>
                </div>
                <div className={styles.cardInfo}>
                  <h4>{model.username}</h4>
                  <p>Join Room</p>
                </div>
              </div>
            ))}
            {models.length === 0 && <p className={styles.emptyState}>No models are currently live.</p>}
          </div>
        </section>
      </main>
      <footer data-lk-theme="default">
        Hosted on LiveKit Cloud.
      </footer>
    </>
  );
}
