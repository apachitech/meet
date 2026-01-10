'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { useSiteConfig } from './components/SiteConfigProvider';
import { Footer } from './components/Footer';

export default function Page() {
  const router = useRouter();
  const settings = useSiteConfig();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; role: 'user' | 'model'; tokenBalance: number } | null>(null);
  const [models, setModels] = useState<{ id: string; username: string }[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      setToken(storedToken);
      // Fetch Profile
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403 || res.status === 404) {
              localStorage.removeItem('token');
              setToken(null);
            }
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.username) setUser(data);
        })
        .catch((err) => {
           console.error(err);
        });
    }

    // Fetch Models
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/models`)
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch(console.error);
  }, [router]);

  const goLive = () => {
    if (user) {
      router.push(`/rooms/${user.username}`);
    } else {
        router.push('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <div className={styles.main}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          {settings?.siteName || 'Apacciflix'}
        </div>
        <div className={styles.navActions}>
          {token && user ? (
            <>
              <span className={styles.username}>
                {user?.tokenBalance ?? 0} tkns
              </span>
              <span className={styles.username} onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
                {user?.username}
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className={styles.logoutBtn} onClick={() => router.push('/login')}>Login</button>
              <button 
                className={styles.logoutBtn} 
                onClick={() => router.push('/login')} 
                style={{background: 'var(--accent-primary)', border: 'none', color: 'white'}}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <h3>Categories</h3>
          <ul className={styles.sidebarMenu}>
            <li className={`${styles.sidebarItem} ${styles.active}`}>Featured</li>
            <li className={styles.sidebarItem}>Girls</li>
            <li className={styles.sidebarItem}>Couples</li>
            <li className={styles.sidebarItem}>Trans</li>
            <li className={styles.sidebarItem}>Men</li>
            <li className={styles.sidebarItem}>VR</li>
          </ul>
          
          {token && (
            <>
              <h3 style={{ marginTop: '2rem' }}>My Favorites</h3>
              <ul className={styles.sidebarMenu}>
                <li className={styles.sidebarItem} style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No favorites yet</li>
              </ul>
            </>
          )}
        </aside>

        <main className={styles.content}>
          <div className={styles.hero}>
            <div>
              <h1>Live Cams</h1>
              <p>Explore thousands of live cam models.</p>
            </div>
            {user?.role === 'model' && (
              <button className="lk-button" onClick={goLive} style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>
                BROADCAST LIVE
              </button>
            )}
            {!token && (
                <button className="lk-button" onClick={() => router.push('/login')} style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>
                    BROADCAST LIVE
                </button>
            )}
          </div>

          <div className={styles.modelGrid}>
            {models.map((model) => (
              <div
                key={model.id}
                className={styles.modelCard}
                onClick={() => router.push(`/rooms/${model.username}`)}
              >
                <div className={styles.cardPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${model.username}`} 
                    alt={model.username} 
                  />
                  <div className={styles.liveBadge}>LIVE</div>
                  <div className={styles.cardOverlay}>
                    <h4>{model.username}</h4>
                    <div className={styles.viewers}>1.2k viewers</div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mock Data to fill the grid if few models exist */}
            {models.length < 4 && Array.from({ length: 8 }).map((_, i) => (
               <div key={`mock-${i}`} className={styles.modelCard} style={{ opacity: 0.5, pointerEvents: 'none' }}>
                 <div className={styles.cardPreview}>
                    <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                      Offline
                    </div>
                 </div>
               </div>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
