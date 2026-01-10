'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const GIFT_ICONS = [
    '🌹', '💎', '🔥', '💖', '🍾', '🏎️', '🏰', '🚀', 
    '🎁', '🍫', '🧸', '💍', '👑', '👠', '👙', '🍕', 
    '🥂', '🌈', '🦄', '🎸', '🎮', '📱', '💵', '💸'
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'gifts' | 'economy'>('settings');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  
  // Loading
  const [loading, setLoading] = useState(true);

  // New Gift State
  const [newGiftIcon, setNewGiftIcon] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.role !== 'admin') {
                alert('Access Denied: Admins only');
                router.push('/');
            } else {
                setIsAdmin(true);
                fetchData(token);
            }
        } catch(e) {
            console.error(e);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };
    checkAdmin();
  }, []);

  const fetchData = async (token: string) => {
    // Fetch Settings
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setSettings);

    // Fetch Users
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setUsers);

    // Fetch Gifts
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/gifts`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json()).then(setGifts);
  };

  const saveSettings = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
    });
    alert('Settings Saved');
    window.location.reload();
  };

  const updateUserRole = async (id: string, role: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role })
    });
    // Refresh
    const newUsers = users.map(u => u._id === id ? { ...u, role } : u);
    setUsers(newUsers);
  };

  const addGift = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = {
          name: (form.elements.namedItem('name') as HTMLInputElement).value,
          price: parseInt((form.elements.namedItem('price') as HTMLInputElement).value),
          icon: newGiftIcon || (form.elements.namedItem('icon') as HTMLInputElement).value,
          type: (form.elements.namedItem('type') as HTMLSelectElement).value,
      };

      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      const newGift = await res.json();
      setGifts([...gifts, newGift]);
      setNewGiftIcon('');
      form.reset();
  };

  const deleteGift = async (id: string) => {
      if(!confirm('Delete this gift?')) return;
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/gifts/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
      });
      setGifts(gifts.filter(g => g.id !== id));
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

  if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading Admin Panel...</div>;
  if (!isAdmin) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(10px)', margin: '-2rem -2rem 2rem -2rem', padding: '2rem 2rem 0 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Admin Dashboard</h1>
            <button onClick={() => router.push('/')} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '4px' }}>Back to Home</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333', overflowX: 'auto', paddingBottom: '1rem' }}>
            <button onClick={() => setActiveTab('settings')} style={{ padding: '10px 20px', background: activeTab === 'settings' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Settings</button>
            <button onClick={() => setActiveTab('users')} style={{ padding: '10px 20px', background: activeTab === 'users' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Users</button>
            <button onClick={() => setActiveTab('gifts')} style={{ padding: '10px 20px', background: activeTab === 'gifts' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Gifts</button>
            <button onClick={() => setActiveTab('economy')} style={{ padding: '10px 20px', background: activeTab === 'economy' ? 'var(--accent-primary)' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}>Economy</button>
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
                                  <select 
                                    value={u.role} 
                                    onChange={(e) => updateUserRole(u._id, e.target.value)}
                                    style={{ padding: '5px', background: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                  >
                                      <option value="user">User</option>
                                      <option value="model">Model</option>
                                      <option value="admin">Admin</option>
                                  </select>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
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
    </div>
  );
}
