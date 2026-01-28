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
import { VideoCard } from './components/VideoCard';
import { TokenStore } from './custom/TokenStore';
import { toast, Toaster } from 'react-hot-toast';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

// Helper component for sections
const SectionGrid = ({ title, models, loading, onSeeAll }: { title: string, models: any[], loading: boolean, onSeeAll?: () => void }) => (
  <div className={styles.section}>
    <div className={styles.sectionHeader}>
      <h3 className={styles.sectionTitle}>
        {/* Optional Icon could go here */}
        {title}
      </h3>
      {onSeeAll && <span className={styles.seeAll} onClick={onSeeAll}>See All</span>}
    </div>
    
    <div className={styles.grid}>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
           <VideoCard key={i} model={{} as any} loading={true} />
        ))
      ) : models.length > 0 ? (
        models.map((model, i) => (
          <VideoCard key={`${model.id}-${i}`} model={model} />
        ))
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>
          No broadcasts available in this category.
        </p>
      )}
    </div>
  </div>
);

export default function Page() {
  const router = useRouter();
  const settings = useSiteConfig();
  const { user, loading: userLoading, logout, refreshUser } = useUser();
  const [models, setModels] = useState<{ id: string; username: string; avatar?: string; previewUrl?: string }[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showTokenStore, setShowTokenStore] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [modelsData, sectionsData] = await Promise.all([
        apiJson('/api/models'),
        apiJson('/api/sections')
      ]);
      
      if (Array.isArray(modelsData)) {
        setModels(modelsData as { id: string; username: string; avatar?: string; previewUrl?: string }[]);
      }
      if (Array.isArray(sectionsData)) {
        setSections(sectionsData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getFilteredModels = (section: any) => {
    let filtered = [...models];
    
    // Filter by Type
    switch (section.filterType) {
        case 'recommended':
            // Mock recommendation logic
            filtered = filtered.filter((_, i) => i % 2 === 0);
            break;
        case 'new':
            // Mock new logic (reverse order)
            filtered = [...filtered].reverse();
            break;
        case 'tag':
            if (section.filterValue) {
                // Mock tag filtering - in real app check model.tags
                // For demo, we'll just return random subset based on length of tag
                const seed = section.filterValue.length;
                filtered = filtered.filter((_, i) => (i + seed) % 3 === 0);
            }
            break;
        case 'random':
            filtered = filtered.sort(() => 0.5 - Math.random());
            break;
        case 'all':
        default:
            break;
    }

    return filtered.slice(0, 4); // Limit to 4 for grid
  };

  const goLive = () => {
    if (user) {
      router.push(`/rooms/${user.username}`);
    } else {
        router.push('/login');
    }
  };

  // Mock distribution of models into categories for demo (Fallback if no dynamic sections)
  const recommendedModels = models.slice(0, 4);
  const allIconModels = models; // All models
  const saModels = models.filter((_, i) => i % 3 === 0); // Mock filter
  const topRatedModels = models.filter((_, i) => i % 2 === 0); // Mock filter

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', currency: 'USD', intent: 'capture' }}>
      <div className={styles.main}>
      <nav className={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className={styles.hamburgerBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
          <div className={styles.logo} onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
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
              <button 
                 className={styles.primaryBtn} 
                 style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', marginRight: '0.5rem' }}
                 onClick={goLive}
              >
                Go Live
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                  <span className={styles.username}>
                    {user.tokenBalance} tkns
                  </span>
                  <button 
                    onClick={() => setShowTokenStore(true)}
                    style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        padding: 0
                    }}
                    title="Top Up Tokens"
                  >
                    +
                  </button>
              </div>
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
             {/* Only show close btn on mobile */}
            {isMobileMenuOpen && (
                <button 
                className={styles.closeBtn}
                style={{ display: 'block', marginLeft: 'auto' }}
                onClick={() => setIsMobileMenuOpen(false)}
                >
                ✕
                </button>
            )}
          </div>

          <div className={styles.mobileUserSection}>
            {user ? (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                            alt="Profile" 
                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{user.username}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span>{user.tokenBalance} Tokens</span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTokenStore(true);
                                    }}
                                    style={{
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => router.push('/profile')}
                        style={{ 
                            width: '100%', 
                            padding: '0.6rem', 
                            background: '#333', 
                            color: 'white', 
                            border: '1px solid #444', 
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem'
                        }}
                    >
                        My Profile
                    </button>
                    {user.role === 'admin' && (
                        <button 
                            onClick={() => router.push('/admin')}
                            style={{ 
                                width: '100%', 
                                padding: '0.6rem', 
                                background: '#ef4444', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Admin Panel
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#ccc', marginBottom: '1rem' }}>Join the community!</p>
                    <button 
                        onClick={() => router.push('/login')}
                        style={{ 
                            width: '100%', 
                            padding: '0.6rem', 
                            background: '#333', 
                            color: 'white', 
                            border: '1px solid #444', 
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginBottom: '0.5rem'
                        }}
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => router.push('/login?mode=register')}
                        style={{ 
                            width: '100%', 
                            padding: '0.6rem', 
                            background: 'var(--accent-primary)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Sign Up
                    </button>
                </div>
            )}
          </div>

          {(!user && settings?.promo?.enabled !== false) && (
            <div 
                className={styles.sidebarPromo} 
                onClick={() => router.push('/login?mode=register')}
                style={{ 
                    background: settings?.promo?.backgroundColor,
                    color: settings?.promo?.textColor
                }}
            >
                <h4 style={{ color: settings?.promo?.textColor }}>{settings?.promo?.title || '50 Tokens'}</h4>
                <p style={{ color: settings?.promo?.textColor, opacity: 0.9 }}>{settings?.promo?.subtitle || 'Free for new accounts!'}</p>
            </div>
          )}

          <h3 style={{ marginTop: '1rem' }}>Categories</h3>
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
                <li className={styles.sidebarItem}>Female</li>
                <li className={styles.sidebarItem}>Male</li>
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
           {/* Top Ad */}
           <div style={{ maxWidth: '100%', marginBottom: '2rem' }}>
            <AdDisplay location="home-top" style={{ width: '100%', height: '150px' }} />
           </div>

           {/* Hero Section */}
           {settings?.homeTitle && (
             <div className={styles.hero}>
               <div>
                 <h1>{settings.homeTitle}</h1>
                 <p>{settings.homeSubtitle}</p>
               </div>
             </div>
           )}

           {/* Dynamic Sections */}
           {sections.length > 0 ? (
             sections.map((section) => (
               <SectionGrid 
                 key={section._id}
                 title={section.title} 
                 models={getFilteredModels(section)} 
                 loading={loadingModels}
                 onSeeAll={() => console.log(`See all ${section.title}`)}
               />
             ))
           ) : (
             <>
                {/* Default Sections (Fallback) */}
                <SectionGrid 
                    title="Today's Recommendations For You" 
                    models={recommendedModels} 
                    loading={loadingModels}
                    onSeeAll={() => console.log('See all recommendations')}
                />

                <SectionGrid 
                    title="All Icons" 
                    models={allIconModels} 
                    loading={loadingModels}
                    onSeeAll={() => console.log('See all icons')}
                />

                <SectionGrid 
                    title="South African Broadcasters" 
                    models={saModels} 
                    loading={loadingModels}
                    onSeeAll={() => console.log('See all SA')}
                />

                <SectionGrid 
                    title="Top Rated Live Channels" 
                    models={topRatedModels} 
                    loading={loadingModels}
                    onSeeAll={() => console.log('See all top rated')}
                />

                <SectionGrid 
                    title="Couples Live" 
                    models={recommendedModels} 
                    loading={loadingModels}
                    onSeeAll={() => console.log('See all couples')}
                />

                <SectionGrid 
                    title="VR Cams" 
                    models={models.slice(0, 2)} 
                    loading={loadingModels}
                    onSeeAll={() => console.log('See all VR')}
                />
             </>
           )}

        </main>
      </div>
      <Footer />
      <Toaster position="top-center" />
      {showTokenStore && (
          <TokenStore 
              onClose={() => setShowTokenStore(false)} 
              onPurchaseComplete={() => {
                  toast.success('Tokens added successfully!');
                  // Refresh user data to show new balance
                  if (refreshUser) refreshUser();
              }} 
          />
      )}
      </div>
    </PayPalScriptProvider>
  );
}
