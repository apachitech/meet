'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, apiJson, apiFetch } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { useUser } from '../components/UserProvider';
import { Skeleton } from '../components/Skeleton';

const GIFT_ICONS = [
    '🌹', '💎', '🔥', '💖', '🍾', '🏎️', '🏰', '🚀', 
    '🎁', '🍫', '🧸', '💍', '👑', '👠', '👙', '🍕', 
    '🥂', '🌈', '🦄', '🎸', '🎮', '📱', '💵', '💸'
];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'settings' | 'home' | 'users' | 'gifts' | 'economy' | 'promotions' | 'ads'>('settings');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  
  // Loading
  const [dataLoading, setDataLoading] = useState(true);

  // New Gift State
  const [newGiftIcon, setNewGiftIcon] = useState('');
  const [giftModalUser, setGiftModalUser] = useState<{id: string, username: string} | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user || user.role !== 'admin') {
        if (!user) {
            router.push('/');
        } else {
            toast.error('Access Denied: Admin privileges required.');
            router.push('/');
        }
        return;
    }

    setIsAdmin(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, router]);

  const fetchData = async () => {
    try {
        // Fetch Settings
        const settingsRes = await api.get('/api/admin/settings', true);
        if (settingsRes.ok) setSettings(await settingsRes.json());

        // Fetch Users
        const usersRes = await api.get('/api/admin/users', true);
        if (usersRes.ok) setUsers(await usersRes.json());

        // Fetch Gifts
        const giftsRes = await api.get('/api/admin/gifts', true);
        if (giftsRes.ok) setGifts(await giftsRes.json());

        // Fetch Promotions
        const promoRes = await api.get('/api/admin/promotions', true);
        if (promoRes.ok) setPromotions(await promoRes.json());

        // Fetch Ads
        const adsRes = await api.get('/api/admin/ads', true);
        if (adsRes.ok) setAds(await adsRes.json());

    } catch (e) {
        console.error(e);
        toast.error('Failed to load admin data');
    } finally {
        setDataLoading(false);
    }
  };

  const saveSettings = async () => {
    const token = localStorage.getItem('token');
    try {
        await api.put('/api/admin/settings', settings, true);
        toast.success('Settings Saved');
    } catch (e) {
        console.error(e);
        toast.error('Failed to save settings');
    }
  };

  const updateUserRole = async (id: string, role: string) => {
    try {
        await api.put(`/api/admin/users/${id}/role`, { role }, true);
        // Refresh
        const newUsers = users.map(u => u._id === id ? { ...u, role } : u);
        setUsers(newUsers);
        toast.success('User role updated successfully');
    } catch (error) {
        console.error('Failed to update role:', error);
        toast.error('Failed to update user role');
    }
  };

  const handleCreditUser = async (id: string, username: string) => {
      const amountStr = prompt(`Enter amount of tokens to send to ${username} (use negative to deduct):`);
      if (!amountStr) return;
      const amount = parseInt(amountStr);
      if (isNaN(amount)) {
          alert('Invalid amount');
          return;
      }

      try {
          const res = await api.post(`/api/admin/users/${id}/credit`, { amount }, true);
          if (res.ok) {
              const data = await res.json();
              toast.success(`Successfully sent ${amount} tokens to ${username}`);
              // Refresh local state
              setUsers(users.map(u => u._id === id ? { ...u, tokenBalance: data.newBalance } : u));
          } else {
              toast.error('Failed to credit user');
          }
      } catch (error) {
          console.error(error);
          toast.error('Error sending tokens');
      }
  };

  const handleAdminSendGift = async (giftId: string) => {
      if (!giftModalUser) return;
      try {
          const res = await api.post(`/api/admin/users/${giftModalUser.id}/gift`, { giftId }, true);
          if (res.ok) {
              const data = await res.json();
              toast.success(`Sent gift to ${giftModalUser.username}`);
              // Refresh user balance
              setUsers(users.map(u => u._id === giftModalUser.id ? { ...u, tokenBalance: data.newBalance } : u));
              setGiftModalUser(null);
          } else {
              toast.error('Failed to send gift');
          }
      } catch (e) {
          toast.error('Error sending gift');
      }
  };

  const addGift = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const form = e.target as HTMLFormElement;
          const data = {
              name: (form.elements.namedItem('name') as HTMLInputElement).value,
              price: parseInt((form.elements.namedItem('price') as HTMLInputElement).value),
              icon: newGiftIcon || (form.elements.namedItem('icon') as HTMLInputElement).value,
              type: (form.elements.namedItem('type') as HTMLSelectElement).value,
          };

          const res = await api.post('/api/admin/gifts', data, true);
          if (!res.ok) throw new Error('Failed to create gift');
          
          const newGift = await res.json();
          setGifts([...gifts, newGift]);
          setNewGiftIcon('');
          form.reset();
          toast.success('Gift added successfully');
      } catch (error) {
          console.error('Failed to add gift:', error);
          toast.error('Failed to add gift');
      }
  };

  const deleteGift = async (id: string) => {
      if(!confirm('Delete this gift?')) return;
      try {
          await apiFetch(`/api/admin/gifts/${id}`, { method: 'DELETE', requireAuth: true });
          setGifts(gifts.filter(g => g.id !== id));
          toast.success('Gift deleted successfully');
      } catch (error) {
          console.error('Failed to delete gift:', error);
          toast.error('Failed to delete gift');
      }
  };

  // Economy Helpers
  const addTokenPackage = () => {
      const newPkg = { id: `pkg_${Date.now()}`, tokens: 100, price: 9.99, label: 'New Pack' };
      setSettings({ ...settings, tokenPackages: [...(settings.tokenPackages || []), newPkg] });
  };

  const removeTokenPackage = (id: string) => {
      setSettings({ ...settings, tokenPackages: settings.tokenPackages.filter((p: any) => p.id !== id) });
  };

  const updateTokenPackage = (id: string, field: string, value: any) => {
      const newPkgs = settings.tokenPackages.map((p: any) => {
          if (p.id === id) return { ...p, [field]: value };
          return p;
      });
      setSettings({ ...settings, tokenPackages: newPkgs });
  };

  const togglePaymentMethod = (id: string) => {
      const newMethods = settings.paymentMethods.map((m: any) => {
          if (m.id === id) return { ...m, enabled: !m.enabled };
          return m;
      });
      setSettings({ ...settings, paymentMethods: newMethods });
  };

  // Promotions
  const handleCreatePromotion = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = {
          title: (form.elements.namedItem('title') as HTMLInputElement).value,
          description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
          startDate: (form.elements.namedItem('startDate') as HTMLInputElement).value,
          endDate: (form.elements.namedItem('endDate') as HTMLInputElement).value,
          bannerUrl: (form.elements.namedItem('bannerUrl') as HTMLInputElement).value,
      };

      try {
          const res = await api.post('/api/admin/promotions', data, true);
          if (res.ok) {
              const newPromo = await res.json();
              setPromotions([newPromo, ...promotions]);
              toast.success('Promotion created');
              form.reset();
          } else {
              toast.error('Failed to create promotion');
          }
      } catch (e) {
          console.error(e);
          toast.error('Error creating promotion');
      }
  };

  const handleDeletePromotion = async (id: string) => {
      if (!confirm('Delete this promotion?')) return;
      try {
          await apiFetch(`/api/admin/promotions/${id}`, { method: 'DELETE', requireAuth: true });
          setPromotions(promotions.filter(p => p._id !== id));
          toast.success('Promotion deleted');
      } catch (e) {
          toast.error('Failed to delete');
      }
  };

  // Ads
  const handleCreateAd = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = {
          title: (form.elements.namedItem('title') as HTMLInputElement).value,
          imageUrl: (form.elements.namedItem('imageUrl') as HTMLInputElement).value,
          targetUrl: (form.elements.namedItem('targetUrl') as HTMLInputElement).value,
          location: (form.elements.namedItem('location') as HTMLSelectElement).value,
      };

      try {
          const res = await api.post('/api/admin/ads', data, true);
          if (res.ok) {
              const newAd = await res.json();
              setAds([newAd, ...ads]);
              toast.success('Ad created');
              form.reset();
          } else {
              toast.error('Failed to create ad');
          }
      } catch (e) {
          console.error(e);
          toast.error('Error creating ad');
      }
  };

  const handleDeleteAd = async (id: string) => {
      if (!confirm('Delete this ad?')) return;
      try {
          await apiFetch(`/api/admin/ads/${id}`, { method: 'DELETE', requireAuth: true });
          setAds(ads.filter(a => a._id !== id));
          toast.success('Ad deleted');
      } catch (e) {
          toast.error('Failed to delete');
      }
  };

  if (userLoading || dataLoading) {
    return (
        <div style={{ padding: '2rem' }}>
            <Skeleton width="200px" height="40px" style={{ marginBottom: '2rem' }} />
            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ width: '250px' }}>
                    <Skeleton width="100%" height="50px" style={{ marginBottom: '1rem' }} />
                    <Skeleton width="100%" height="50px" style={{ marginBottom: '1rem' }} />
                    <Skeleton width="100%" height="50px" style={{ marginBottom: '1rem' }} />
                    <Skeleton width="100%" height="50px" />
                </div>
                <div style={{ flex: 1 }}>
                    <Skeleton width="100%" height="300px" />
                </div>
            </div>
        </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', color: '#fff' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(10px)', margin: '-2rem -2rem 2rem -2rem', padding: '2rem 2rem 0 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Admin Dashboard</h1>
            <button onClick={() => router.push('/')} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px' }}>Back to Home</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333', overflowX: 'auto', paddingBottom: '1rem' }}>
            <button onClick={() => setActiveTab('settings')} style={{ padding: '10px 20px', background: activeTab === 'settings' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Settings</button>
            <button onClick={() => setActiveTab('home')} style={{ padding: '10px 20px', background: activeTab === 'home' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Home</button>
            <button onClick={() => setActiveTab('users')} style={{ padding: '10px 20px', background: activeTab === 'users' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Users</button>
            <button onClick={() => setActiveTab('gifts')} style={{ padding: '10px 20px', background: activeTab === 'gifts' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Gifts</button>
            <button onClick={() => setActiveTab('economy')} style={{ padding: '10px 20px', background: activeTab === 'economy' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Economy</button>
            <button onClick={() => setActiveTab('promotions')} style={{ padding: '10px 20px', background: activeTab === 'promotions' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Promotions</button>
            <button onClick={() => setActiveTab('ads')} style={{ padding: '10px 20px', background: activeTab === 'ads' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Ads</button>
        </div>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h2>General Appearance</h2>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Site Name</label>
                <input 
                    type="text" 
                    value={settings.siteName || ''} 
                    onChange={e => setSettings({...settings, siteName: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} 
                />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Primary Color</label>
                <input 
                    type="color" 
                    value={settings.primaryColor || '#ef4444'} 
                    onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                    style={{ width: '100px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} 
                />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Background Image URL</label>
                <input 
                    type="text" 
                    value={settings.backgroundUrl || ''} 
                    onChange={e => setSettings({...settings, backgroundUrl: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} 
                />
            </div>
            <button onClick={saveSettings} style={{ padding: '10px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Save Changes
            </button>
        </div>
      )}

      {/* Home Tab */}
      {activeTab === 'home' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h2>Home Page Content</h2>
              
              <div style={{ marginBottom: '2rem' }}>
                  <h3>Hero Section</h3>
                  <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Title</label>
                      <input 
                          type="text" 
                          value={settings.homeTitle || ''} 
                          onChange={e => setSettings({...settings, homeTitle: e.target.value})}
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} 
                      />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Subtitle</label>
                      <input 
                          type="text" 
                          value={settings.homeSubtitle || ''} 
                          onChange={e => setSettings({...settings, homeSubtitle: e.target.value})}
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} 
                      />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Grid Title (e.g., Live Cams)</label>
                      <input 
                          type="text" 
                          value={settings.gridTitle || ''} 
                          onChange={e => setSettings({...settings, gridTitle: e.target.value})}
                          style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} 
                      />
                  </div>
              </div>

              <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Categories Menu</h3>
                    <button 
                        onClick={() => {
                            const newCat = { id: `cat_${Date.now()}`, label: 'New Category', path: '/' };
                            setSettings({...settings, categories: [...(settings.categories || []), newCat]});
                        }}
                        style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + Add Category
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                      {settings.categories?.map((cat: any, index: number) => (
                          <div key={cat.id || index} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                              <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Label</label>
                                  <input 
                                    value={cat.label} 
                                    onChange={(e) => {
                                        const newCats = [...settings.categories];
                                        newCats[index] = { ...cat, label: e.target.value };
                                        setSettings({...settings, categories: newCats});
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'white', borderBottom: '1px solid #444', width: '100%' }}
                                  />
                              </div>
                              <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Path</label>
                                  <input 
                                    value={cat.path} 
                                    onChange={(e) => {
                                        const newCats = [...settings.categories];
                                        newCats[index] = { ...cat, path: e.target.value };
                                        setSettings({...settings, categories: newCats});
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'white', borderBottom: '1px solid #444', width: '100%' }}
                                  />
                              </div>
                              <button 
                                onClick={() => {
                                    const newCats = settings.categories.filter((_: any, i: number) => i !== index);
                                    setSettings({...settings, categories: newCats});
                                }} 
                                style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                              >✕</button>
                          </div>
                      ))}
                  </div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <button onClick={saveSettings} style={{ padding: '10px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Save Changes
                </button>
              </div>
          </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h2>User Management</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Username</th>
                          <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Email</th>
                          <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Role</th>
                          <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Balance</th>
                          <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {users.map(u => (
                          <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '10px' }}>{u.username}</td>
                              <td style={{ padding: '10px' }}>{u.email}</td>
                              <td style={{ padding: '10px' }}>
                                  <span style={{ 
                                      padding: '2px 8px', 
                                      borderRadius: '4px', 
                                      background: u.role === 'admin' ? '#ef4444' : u.role === 'model' ? '#eab308' : '#333',
                                      fontSize: '0.8rem'
                                  }}>{u.role}</span>
                              </td>
                              <td style={{ padding: '10px' }}>{u.tokenBalance}</td>
                              <td style={{ padding: '10px' }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <select 
                                        value={u.role} 
                                        onChange={(e) => updateUserRole(u._id, e.target.value)}
                                        style={{ padding: '5px', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                      >
                                          <option value="user">User</option>
                                          <option value="model">Model</option>
                                          <option value="admin">Admin</option>
                                      </select>
                                      <button 
                                        onClick={() => handleCreditUser(u._id, u.username)}
                                        style={{ padding: '5px 10px', background: 'var(--accent-secondary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                      >
                                        💰 Send Tokens
                                      </button>
                                      <button 
                                        onClick={() => setGiftModalUser({ id: u._id, username: u.username })}
                                        style={{ padding: '5px 10px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                      >
                                        🎁 Send Gift
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>

              {giftModalUser && (
                  <div style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000
                  }}>
                      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
                          <h3>Send Gift to {giftModalUser.username}</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem', maxHeight: '400px', overflowY: 'auto', margin: '1rem 0' }}>
                              {gifts.map(g => (
                                  <button 
                                    key={g.id || g._id}
                                    onClick={() => handleAdminSendGift(g.id || g._id)}
                                    style={{
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                  >
                                      <span style={{ fontSize: '2rem' }}>{g.icon}</span>
                                      <span style={{ fontSize: '0.8rem' }}>{g.name}</span>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)' }}>{g.price}</span>
                                  </button>
                              ))}
                          </div>
                          <button onClick={() => setGiftModalUser(null)} style={{ width: '100%', padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Gifts Tab */}
      {activeTab === 'gifts' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h2>Gift Economy</h2>
              
              <div style={{ marginBottom: '2rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginTop: 0 }}>Create New Gift</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Choose an icon or paste your own URL/Emoji:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                        {GIFT_ICONS.map(icon => (
                            <button 
                                key={icon}
                                type="button"
                                onClick={() => setNewGiftIcon(icon)}
                                style={{
                                    fontSize: '1.5rem',
                                    background: newGiftIcon === icon ? 'var(--accent-primary)' : '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    width: '40px',
                                    height: '40px'
                                }}
                            >{icon}</button>
                        ))}
                    </div>
                  </div>

                  <form onSubmit={addGift} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Name</label>
                          <input name="name" required placeholder="Gift Name" style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Icon (Emoji/URL)</label>
                          <input 
                             name="icon" 
                             required 
                             placeholder="🌹" 
                             value={newGiftIcon}
                             onChange={(e) => setNewGiftIcon(e.target.value)}
                             style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} 
                          />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Price</label>
                          <input name="price" type="number" required placeholder="10" style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Type</label>
                          <select name="type" style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }}>
                              <option value="standard">Standard</option>
                              <option value="premium">Premium</option>
                              <option value="luxury">Luxury</option>
                          </select>
                      </div>
                      <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add Gift</button>
                  </form>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {gifts.map(g => (
                      <div key={g.id} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', position: 'relative', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{g.icon}</div>
                          <h3 style={{ margin: '0 0 0.5rem 0' }}>{g.name}</h3>
                          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{g.price} Tokens</p>
                          <span style={{ fontSize: '0.7rem', opacity: 0.7, color: 'var(--text-muted)' }}>{g.type}</span>
                          <button 
                            onClick={() => deleteGift(g.id)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >🗑️</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Economy Tab */}
      {activeTab === 'economy' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h2>Token Economy Settings</h2>
              
              <div style={{ marginBottom: '3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Token Packages</h3>
                    <button onClick={addTokenPackage} style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>+ Add Package</button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                      {settings.tokenPackages?.map((pkg: any) => (
                          <div key={pkg.id} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                              <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Label</label>
                                  <input 
                                    value={pkg.label} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'label', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', borderBottom: '1px solid #444', width: '100%' }}
                                  />
                              </div>
                              <div style={{ width: '100px' }}>
                                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Tokens</label>
                                  <input 
                                    type="number"
                                    value={pkg.tokens} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'tokens', parseInt(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'white', borderBottom: '1px solid #444', width: '100%' }}
                                  />
                              </div>
                              <div style={{ width: '100px' }}>
                                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Price ($)</label>
                                  <input 
                                    type="number"
                                    value={pkg.price} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'price', parseFloat(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'white', borderBottom: '1px solid #444', width: '100%' }}
                                  />
                              </div>
                              <div style={{ width: '100px' }}>
                                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Popular</label>
                                  <input 
                                    type="checkbox"
                                    checked={pkg.popular || false} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'popular', e.target.checked)}
                                  />
                              </div>
                              <button onClick={() => removeTokenPackage(pkg.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                      ))}
                  </div>
              </div>

              <div>
                  <h3>Payment Methods</h3>
                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      {settings.paymentMethods?.map((method: any) => (
                          <div key={method.id} style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontWeight: 'bold' }}>{method.name}</span>
                              <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '0.8rem', color: method.enabled ? '#4ade80' : '#aaa' }}>
                                      {method.enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                  <input 
                                    type="checkbox" 
                                    checked={method.enabled} 
                                    onChange={() => togglePaymentMethod(method.id)}
                                    style={{ transform: 'scale(1.2)' }}
                                  />
                              </label>
                          </div>
                      ))}
                  </div>
              </div>
              
              <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                  <button onClick={saveSettings} style={{ padding: '12px 30px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Save Economy Settings
                  </button>
              </div>
          </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h2>Promotions</h2>
              <form onSubmit={handleCreatePromotion} style={{ display: 'grid', gap: '1rem', marginBottom: '2rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px' }}>
                  <input name="title" placeholder="Title" required style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
                  <textarea name="description" placeholder="Description" required style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px', minHeight: '60px' }} />
                  <div style={{ display: 'flex', gap: '1rem' }}>
                      <input name="startDate" type="datetime-local" required style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px', flex: 1 }} />
                      <input name="endDate" type="datetime-local" required style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px', flex: 1 }} />
                  </div>
                  <input name="bannerUrl" placeholder="Banner URL" style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
                  <button type="submit" style={{ padding: '10px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Promotion</button>
              </form>

              <div style={{ display: 'grid', gap: '1rem' }}>
                  {promotions.map(p => (
                      <div key={p._id} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0' }}>{p.title}</h3>
                          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>{p.description}</p>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()}
                          </div>
                          <button 
                            onClick={() => handleDeletePromotion(p._id)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >🗑️</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Ads Tab */}
      {activeTab === 'ads' && (
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h2>Advertisements</h2>
              <form onSubmit={handleCreateAd} style={{ display: 'grid', gap: '1rem', marginBottom: '2rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px' }}>
                  <input name="title" placeholder="Title" required style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
                  <input name="imageUrl" placeholder="Image URL" required style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
                  <input name="targetUrl" placeholder="Target URL" required style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }} />
                  <select name="location" style={{ padding: '8px', background: '#333', border: 'none', color: 'white', borderRadius: '4px' }}>
                      <option value="home-top">Home Top</option>
                      <option value="video-overlay">Video Overlay</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="footer">Footer</option>
                  </select>
                  <button type="submit" style={{ padding: '10px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Ad</button>
              </form>

              <div style={{ display: 'grid', gap: '1rem' }}>
                  {ads.map(a => (
                      <div key={a._id} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
                          <h3 style={{ margin: '0 0 0.5rem 0' }}>{a.title} ({a.location})</h3>
                          <a href={a.targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>{a.targetUrl}</a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {a.imageUrl && <img src={a.imageUrl} alt={a.title} style={{ display: 'block', marginTop: '0.5rem', maxHeight: '100px', borderRadius: '4px' }} />}
                          <button 
                            onClick={() => handleDeleteAd(a._id)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >🗑️</button>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
