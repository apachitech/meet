'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { api, apiJson } from '../lib/api';
import styles from '../styles/Home.module.css';
import { useSiteConfig } from './components/SiteConfigProvider';
import { useUser } from './components/UserProvider';
import { Footer } from './components/Footer';
import { Skeleton } from './components/Skeleton';
import { AdDisplay } from './components/AdDisplay';

export default function Page() {
  const router = useRouter();
  const settings = useSiteConfig();
  const { user, loading: userLoading, logout } = useUser();
  const [models, setModels] = useState<{ id: string; username: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchModels = useCallback(async () => {
    try {
      const data = await apiJson('/api/models');
      if (Array.isArray(data)) {
        setModels(data as { id: string; username: string }[]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    // Poll for active models every 15 seconds
    const interval = setInterval(fetchModels, 15000);
    return () => clearInterval(interval);
  }, [fetchModels]);

  const goLive = () => {
    if (user) {
      router.push(`/rooms/${user.username}`);
    } else {
        router.push('/login');
    }
  };

  return (
    <div className={styles.main}>
      <nav className={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className={styles.hamburgerBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
          <div className={styles.logo}>
            {settings?.siteName || 'Apacciflix'}
          </div>
        </div>
        <div className={styles.navActions}>
          {userLoading ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
               <Skeleton width="80px" height="36px" borderRadius="20px" />
               <Skeleton width="80px" height="36px" borderRadius="20px" />
            </div>
          ) : user ? (
            <>
              <span className={styles.username}>
                {user.tokenBalance} tkns
              </span>
              <span className={styles.username} onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
                {user.username}
              </span>
              {user.role === 'admin' && (
                <button 
                  className={styles.logoutBtn} 
                  onClick={() => router.push('/admin')}
                  style={{ background: '#ef4444', color: 'white', border: 'none' }}
                >
                  Admin
                </button>
              )}
              <button className={styles.logoutBtn} onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button className={styles.logoutBtn} onClick={() => router.push('/login')}>Login</button>
              <button 
                className={styles.logoutBtn} 
                onClick={() => router.push('/login?mode=register')} 
                style={{background: 'var(--accent-primary)', border: 'none', color: 'white'}}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <AdDisplay location="home-top" style={{ width: '100%', height: '150px', marginBottom: '2rem' }} />
      </div>

      <div className={styles.container}>
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className={styles.overlay} 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Categories</h3>
            <button 
              className={styles.closeBtn}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          <ul className={styles.sidebarMenu}>
            {settings?.categories?.map((cat) => (
               <li 
                 key={cat.id} 
                 className={`${styles.sidebarItem} ${cat.id === 'featured' ? styles.active : ''}`}
                 onClick={() => router.push(cat.path)}
               >
                 {cat.label}
               </li>
            )) || (
              <>
                <li className={`${styles.sidebarItem} ${styles.active}`}>Featured</li>
                <li className={styles.sidebarItem}>Girls</li>
                <li className={styles.sidebarItem}>Couples</li>
                <li className={styles.sidebarItem}>Trans</li>
                <li className={styles.sidebarItem}>Men</li>
                <li className={styles.sidebarItem}>VR</li>
              </>
            )}
          </ul>
          
          {token && (
            <>
              <h3 style={{ marginTop: '2rem' }}>My Favorites</h3>
              <ul className={styles.sidebarMenu}>
                <li className={styles.sidebarItem} style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No favorites yet</li>
              </ul>
            </>
          )}
          
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
             <AdDisplay location="sidebar" style={{ width: '100%', height: '250px' }} />
          </div>
        </aside>

        <main className={styles.content}>
          <div className={styles.hero}>
            <h1 className={styles.title}>
              {settings?.homeTitle || <>Welcome to <span className={styles.highlight}>{settings?.siteName || 'Apacciflix'}</span></>}
            </h1>
            <p className={styles.description}>
              {settings?.homeSubtitle || 'Interactive Live Streaming Platform. Connect, Share, and Earn.'}
            </p>
            <div className={styles.cta}>
              <button className={styles.primaryBtn} onClick={goLive}>
                Start Broadcasting
              </button>
              <button className={styles.secondaryBtn} onClick={() => router.push('/search')}>
                Find Creators
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
            {settings?.gridTitle || 'Live Cams'}
          </h2>

          <div className={styles.grid}>
            {loadingModels ? (
              // Skeleton Loading for Grid
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.card} style={{ pointerEvents: 'none' }}>
                  <Skeleton width="100%" height="180px" borderRadius="12px" style={{ marginBottom: '1rem' }} />
                  <Skeleton width="60%" height="24px" borderRadius="4px" style={{ marginBottom: '0.5rem' }} />
                  <Skeleton width="40%" height="16px" borderRadius="4px" />
                </div>
              ))
            ) : models.length > 0 ? (
              models.map((model) => (
                <div key={model.id} className={styles.card} onClick={() => router.push(`/rooms/${model.username}`)}>
                  <div className={styles.thumbnailPlaceholder}>
                    <div className={styles.liveBadge}>LIVE</div>
                  </div>
                  <h3>{model.username}</h3>
                  <p>Live now!</p>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', width: '100%', color: '#888' }}>
                No models are live right now. Be the first!
              </p>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
