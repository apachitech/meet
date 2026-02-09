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
  const [activeTab, setActiveTab] = useState<'settings' | 'home' | 'users' | 'gifts' | 'economy' | 'promotions' | 'ads' | 'sections' | 'vouchers' | 'mobile-money'>('settings');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [mobileMoneyTransactions, setMobileMoneyTransactions] = useState<any[]>([]);
  
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

        // Fetch Sections
        const sectionsRes = await api.get('/api/admin/sections', true);
        if (sectionsRes.ok) setSections(await sectionsRes.json());

        // Fetch Vouchers
        const vouchersRes = await api.get('/api/admin/vouchers', true);
        if (vouchersRes.ok) {
            const data = await vouchersRes.json();
            setVouchers(data.vouchers || []);
        }

        // Fetch Mobile Money Transactions
        const mmRes = await api.get('/api/admin/mobile-money/pending', true);
        if (mmRes.ok) {
            const data = await mmRes.json();
            setMobileMoneyTransactions(data.transactions || []);
        }

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
          setGifts(gifts.filter(g => (g._id || g.id) !== id));
          toast.success('Gift deleted successfully');
      } catch (error) {
          console.error('Failed to delete gift:', error);
          toast.error('Failed to delete gift');
      }
  };

  const handleProcessMobileMoney = async (transactionId: string, action: 'approve' | 'reject') => {
      if (!confirm(`Are you sure you want to ${action} this transaction?`)) return;
      try {
          const res = await api.post('/api/admin/mobile-money/process', { transactionId, action }, true);
          if (res.ok) {
              toast.success(`Transaction ${action}d successfully`);
              setMobileMoneyTransactions(mobileMoneyTransactions.filter(t => t._id !== transactionId));
          } else {
              const data = await res.json();
              toast.error(data.message || `Failed to ${action} transaction`);
          }
      } catch (e) {
          console.error(e);
          toast.error(`Error processing transaction`);
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

  // Sections
  const handleCreateSection = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = {
          title: (form.elements.namedItem('title') as HTMLInputElement).value,
          filterType: (form.elements.namedItem('filterType') as HTMLSelectElement).value,
          filterValue: (form.elements.namedItem('filterValue') as HTMLInputElement).value,
          order: Number((form.elements.namedItem('order') as HTMLInputElement).value),
      };

      try {
          const res = await api.post('/api/admin/sections', data, true);
          if (res.ok) {
              const newSection = await res.json();
              setSections([...sections, newSection].sort((a, b) => a.order - b.order));
              toast.success('Section created');
              form.reset();
          } else {
              toast.error('Failed to create section');
          }
      } catch (e) {
          console.error(e);
          toast.error('Error creating section');
      }
  };

  const handleDeleteSection = async (id: string) => {
      if (!confirm('Delete this section?')) return;
      try {
          await apiFetch(`/api/admin/sections/${id}`, { method: 'DELETE', requireAuth: true });
          setSections(sections.filter(s => s._id !== id));
          toast.success('Section deleted');
      } catch (e) {
          toast.error('Failed to delete');
      }
  };

  // Vouchers
  const handleGenerateVouchers = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const data = {
          amount: parseInt((form.elements.namedItem('amount') as HTMLInputElement).value),
          count: parseInt((form.elements.namedItem('count') as HTMLInputElement).value),
          expiryDays: parseInt((form.elements.namedItem('expiryDays') as HTMLInputElement).value),
      };

      try {
          const res = await api.post('/api/admin/vouchers', data, true);
          if (res.ok) {
              const result = await res.json();
              toast.success(result.message);
              // Refresh vouchers list
              const vouchersRes = await api.get('/api/admin/vouchers', true);
              if (vouchersRes.ok) {
                  const vData = await vouchersRes.json();
                  setVouchers(vData.vouchers || []);
              }
              form.reset();
          } else {
              toast.error('Failed to generate vouchers');
          }
      } catch (e) {
          console.error(e);
          toast.error('Error generating vouchers');
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar Navigation */}
      <div style={{ 
          width: '260px', 
          background: '#121212', 
          borderRight: '1px solid #333', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'fixed', 
          height: '100vh', 
          zIndex: 100 
      }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid #222' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-primary)', margin: 0, letterSpacing: '-0.5px' }}>Admin Console</h1>
            <p style={{ fontSize: '0.8rem', color: '#666', margin: '5px 0 0 0' }}>v1.0.0</p>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
            {[
                { id: 'settings', label: 'Settings', icon: '⚙️' },
                { id: 'home', label: 'Home Layout', icon: '🏠' },
                { id: 'users', label: 'User Management', icon: '👥' },
                { id: 'gifts', label: 'Gifts', icon: '🎁' },
                { id: 'economy', label: 'Economy', icon: '💰' },
                { id: 'promotions', label: 'Promotions', icon: '📣' },
                { id: 'ads', label: 'Advertisements', icon: '📺' },
                { id: 'sections', label: 'Sections', icon: '📑' },
                { id: 'vouchers', label: 'Vouchers', icon: '🎟️' },
                { id: 'mobile-money', label: 'Mobile Money', icon: '📱' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: activeTab === tab.id ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--accent-primary)' : '#aaa',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: activeTab === tab.id ? 600 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span>{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #222' }}>
            <button 
                onClick={() => router.push('/')} 
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: '#222', 
                    color: '#fff', 
                    border: '1px solid #333', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s'
                }}
            >
                ← Back to Site
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ marginLeft: '260px', flex: 1, padding: '3rem', maxWidth: '1200px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p style={{ color: '#666', marginTop: '0.5rem' }}>Manage your platform configuration</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{user?.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>Administrator</div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {user?.username?.[0]?.toUpperCase()}
                </div>
            </div>
        </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>General Appearance</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Site Name</label>
                    <input 
                        type="text" 
                        value={settings.siteName || ''} 
                        onChange={e => setSettings({...settings, siteName: e.target.value})}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Primary Color</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input 
                            type="color" 
                            value={settings.primaryColor || '#ef4444'} 
                            onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                            style={{ width: '60px', height: '60px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} 
                        />
                        <span style={{ color: '#fff', fontFamily: 'monospace' }}>{settings.primaryColor || '#ef4444'}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Background Image URL</label>
                    <input 
                        type="text" 
                        value={settings.backgroundUrl || ''} 
                        onChange={e => setSettings({...settings, backgroundUrl: e.target.value})}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <button onClick={saveSettings} style={{ width: '100%', padding: '14px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                    Save Changes
                </button>
            </div>

            <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Contact & Social</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>WhatsApp Number</label>
                    <input 
                        type="text" 
                        placeholder="e.g. 1234567890"
                        value={settings.socialContacts?.whatsapp || ''} 
                        onChange={e => setSettings({
                            ...settings, 
                            socialContacts: { ...(settings.socialContacts || {}), whatsapp: e.target.value }
                        })}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                    <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>Format: Country code + Number (e.g. 15551234567)</small>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Telegram Username</label>
                    <input 
                        type="text" 
                        placeholder="e.g. support_bot"
                        value={settings.socialContacts?.telegram || ''} 
                        onChange={e => setSettings({
                            ...settings, 
                            socialContacts: { ...(settings.socialContacts || {}), telegram: e.target.value }
                        })}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                    <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>Without @ symbol</small>
                </div>

                <button onClick={saveSettings} style={{ width: '100%', padding: '14px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                    Save Contact Info
                </button>
            </div>

            <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Google Pay Configuration</h3>
                
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Enabled</label>
                    <input 
                        type="checkbox" 
                        checked={settings.googlePay?.enabled ?? true}
                        onChange={e => setSettings({
                            ...settings, 
                            googlePay: { ...(settings.googlePay || {}), enabled: e.target.checked }
                        })}
                        style={{ width: '20px', height: '20px' }} 
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Merchant ID</label>
                    <input 
                        type="text" 
                        value={settings.googlePay?.merchantId || ''} 
                        onChange={e => setSettings({
                            ...settings, 
                            googlePay: { ...(settings.googlePay || {}), merchantId: e.target.value }
                        })}
                        placeholder="BCR..."
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Merchant Name</label>
                    <input 
                        type="text" 
                        value={settings.googlePay?.merchantName || ''} 
                        onChange={e => setSettings({
                            ...settings, 
                            googlePay: { ...(settings.googlePay || {}), merchantName: e.target.value }
                        })}
                        placeholder="Example Corp"
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Gateway Name</label>
                    <input 
                        type="text" 
                        value={settings.googlePay?.gateway || ''} 
                        onChange={e => setSettings({
                            ...settings, 
                            googlePay: { ...(settings.googlePay || {}), gateway: e.target.value }
                        })}
                        placeholder="e.g. stripe, example"
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Gateway Merchant ID</label>
                    <input 
                        type="text" 
                        value={settings.googlePay?.gatewayMerchantId || ''} 
                        onChange={e => setSettings({
                            ...settings, 
                            googlePay: { ...(settings.googlePay || {}), gatewayMerchantId: e.target.value }
                        })}
                        placeholder="Gateway specific ID"
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <button onClick={saveSettings} style={{ width: '100%', padding: '14px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                    Save Google Pay Settings
                </button>
            </div>

            <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Signup Bonus & Promo Banner</h3>
                
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Enabled</label>
                    <input 
                        type="checkbox" 
                        checked={settings.promo?.enabled ?? true}
                        onChange={e => setSettings({
                            ...settings, 
                            promo: { ...(settings.promo || {}), enabled: e.target.checked }
                        })}
                        style={{ width: '20px', height: '20px' }} 
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Signup Bonus Amount (Tokens)</label>
                    <input 
                        type="number" 
                        value={settings.promo?.bonusAmount ?? 50}
                        onChange={e => setSettings({
                            ...settings, 
                            promo: { ...(settings.promo || {}), bonusAmount: Number(e.target.value) }
                        })}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Banner Title</label>
                    <input 
                        type="text" 
                        value={settings.promo?.title ?? '50 Tokens'}
                        onChange={e => setSettings({
                            ...settings, 
                            promo: { ...(settings.promo || {}), title: e.target.value }
                        })}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Banner Subtitle</label>
                    <input 
                        type="text" 
                        value={settings.promo?.subtitle ?? 'Free for new accounts!'}
                        onChange={e => setSettings({
                            ...settings, 
                            promo: { ...(settings.promo || {}), subtitle: e.target.value }
                        })}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Background Color / Gradient</label>
                    <input 
                        type="text" 
                        value={settings.promo?.backgroundColor ?? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}
                        onChange={e => setSettings({
                            ...settings, 
                            promo: { ...(settings.promo || {}), backgroundColor: e.target.value }
                        })}
                        style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                    />
                    <div style={{ marginTop: '0.5rem', height: '20px', borderRadius: '4px', background: settings.promo?.backgroundColor ?? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}></div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Text Color</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input 
                            type="color" 
                            value={settings.promo?.textColor ?? '#ffffff'}
                            onChange={e => setSettings({
                                ...settings, 
                                promo: { ...(settings.promo || {}), textColor: e.target.value }
                            })}
                            style={{ width: '60px', height: '60px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} 
                        />
                        <span style={{ color: '#fff', fontFamily: 'monospace' }}>{settings.promo?.textColor ?? '#ffffff'}</span>
                    </div>
                </div>

                <button onClick={saveSettings} style={{ width: '100%', padding: '14px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                    Save Promo Settings
                </button>
            </div>
        </div>
      )}

      {/* Home Tab */}
      {activeTab === 'home' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Hero Section</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Main Title</label>
                        <input 
                            type="text" 
                            value={settings.homeTitle || ''} 
                            onChange={e => setSettings({...settings, homeTitle: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Subtitle</label>
                        <input 
                            type="text" 
                            value={settings.homeSubtitle || ''} 
                            onChange={e => setSettings({...settings, homeSubtitle: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                        />
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Grid Section Title</label>
                      <input 
                          type="text" 
                          value={settings.gridTitle || ''} 
                          onChange={e => setSettings({...settings, gridTitle: e.target.value})}
                          style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none' }} 
                      />
                  </div>
              </div>

              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Categories Menu</h3>
                    <button 
                        onClick={() => {
                            const newCat = { id: `cat_${Date.now()}`, label: 'New Category', path: '/' };
                            setSettings({...settings, categories: [...(settings.categories || []), newCat]});
                        }}
                        style={{ background: '#222', color: 'white', border: '1px solid #333', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        + Add Category
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                      {settings.categories?.map((cat: any, index: number) => (
                          <div key={cat.id || index} style={{ display: 'flex', gap: '1rem', background: '#0a0a0a', padding: '1rem', borderRadius: '8px', alignItems: 'center', border: '1px solid #333' }}>
                              <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '4px' }}>Label</label>
                                  <input 
                                    value={cat.label} 
                                    onChange={(e) => {
                                        const newCats = [...settings.categories];
                                        newCats[index] = { ...cat, label: e.target.value };
                                        setSettings({...settings, categories: newCats});
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'white', borderBottom: '1px solid #333', width: '100%', padding: '4px 0', fontSize: '0.95rem' }}
                                  />
                              </div>
                              <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '4px' }}>Path</label>
                                  <input 
                                    value={cat.path} 
                                    onChange={(e) => {
                                        const newCats = [...settings.categories];
                                        newCats[index] = { ...cat, path: e.target.value };
                                        setSettings({...settings, categories: newCats});
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#aaa', borderBottom: '1px solid #333', width: '100%', padding: '4px 0', fontSize: '0.95rem' }}
                                  />
                              </div>
                              <button 
                                onClick={() => {
                                    const newCats = settings.categories.filter((_: any, i: number) => i !== index);
                                    setSettings({...settings, categories: newCats});
                                }} 
                                style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >✕</button>
                          </div>
                      ))}
                  </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={saveSettings} style={{ padding: '14px 40px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                    Save All Changes
                </button>
              </div>
          </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
          <div style={{ background: '#121212', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>User Directory</h3>
                  <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Total Users: {users.length}</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                          <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #333' }}>
                              <th style={{ padding: '16px', color: '#888', fontWeight: 500, fontSize: '0.9rem' }}>User</th>
                              <th style={{ padding: '16px', color: '#888', fontWeight: 500, fontSize: '0.9rem' }}>Email</th>
                              <th style={{ padding: '16px', color: '#888', fontWeight: 500, fontSize: '0.9rem' }}>Role</th>
                              <th style={{ padding: '16px', color: '#888', fontWeight: 500, fontSize: '0.9rem' }}>Balance</th>
                              <th style={{ padding: '16px', color: '#888', fontWeight: 500, fontSize: '0.9rem' }}>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {users.map(u => (
                              <tr key={u._id} style={{ borderBottom: '1px solid #222' }}>
                                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                          {u.username[0].toUpperCase()}
                                      </div>
                                      <span style={{ fontWeight: 500 }}>{u.username}</span>
                                  </td>
                                  <td style={{ padding: '16px', color: '#aaa' }}>{u.email}</td>
                                  <td style={{ padding: '16px' }}>
                                      <span style={{ 
                                          padding: '4px 10px', 
                                          borderRadius: '20px', 
                                          background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'model' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                          color: u.role === 'admin' ? '#ef4444' : u.role === 'model' ? '#eab308' : '#aaa',
                                          fontSize: '0.8rem',
                                          fontWeight: 600,
                                          textTransform: 'capitalize'
                                      }}>{u.role}</span>
                                  </td>
                                  <td style={{ padding: '16px', fontFamily: 'monospace' }}>{u.tokenBalance} 🪙</td>
                                  <td style={{ padding: '16px' }}>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <select 
                                            value={u.role} 
                                            onChange={(e) => updateUserRole(u._id, e.target.value)}
                                            style={{ padding: '6px 10px', background: '#0a0a0a', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                                          >
                                              <option value="user">User</option>
                                              <option value="model">Model</option>
                                              <option value="admin">Admin</option>
                                          </select>
                                          <button 
                                            onClick={() => handleCreditUser(u._id, u.username)}
                                            style={{ 
                                                padding: '6px 12px', 
                                                background: 'var(--accent-primary)', 
                                                color: '#fff', 
                                                border: 'none', 
                                                borderRadius: '6px', 
                                                cursor: 'pointer', 
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            title="Add/Deduct Tokens"
                                          >
                                            <span>💰</span> Top Up
                                          </button>
                                          <button 
                                            onClick={() => setGiftModalUser({ id: u._id, username: u.username })}
                                            style={{ padding: '6px 10px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                                            title="Send Gift"
                                          >
                                            🎁
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {giftModalUser && (
                  <div style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(5px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000
                  }}>
                      <div style={{ background: '#121212', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                          <h3 style={{ marginTop: 0 }}>Send Gift to <span style={{ color: 'var(--accent-primary)' }}>{giftModalUser.username}</span></h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem', maxHeight: '400px', overflowY: 'auto', margin: '1.5rem 0' }}>
                              {gifts.map(g => (
                                  <button 
                                    key={g.id || g._id}
                                    onClick={() => handleAdminSendGift(g.id || g._id)}
                                    style={{
                                        background: '#0a0a0a',
                                        border: '1px solid #333',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}
                                  >
                                      <span style={{ fontSize: '2rem' }}>{g.icon}</span>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{g.name}</span>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)' }}>{g.price} tk</span>
                                  </button>
                              ))}
                          </div>
                          <button onClick={() => setGiftModalUser(null)} style={{ width: '100%', padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Gifts Tab */}
      {activeTab === 'gifts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333', height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Create New Gift</h3>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>Select Icon</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', background: '#0a0a0a', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                        {GIFT_ICONS.map(icon => (
                            <button 
                                key={icon}
                                type="button"
                                onClick={() => setNewGiftIcon(icon)}
                                style={{
                                    fontSize: '1.4rem',
                                    background: newGiftIcon === icon ? 'var(--accent-primary)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                            >{icon}</button>
                        ))}
                    </div>
                  </div>

                  <form onSubmit={addGift} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Name</label>
                          <input name="name" required placeholder="e.g. Red Rose" style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Icon (Emoji/URL)</label>
                          <input 
                             name="icon" 
                             required 
                             placeholder="🌹" 
                             value={newGiftIcon}
                             onChange={(e) => setNewGiftIcon(e.target.value)}
                             style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} 
                          />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Price</label>
                              <input name="price" type="number" required placeholder="10" style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                          </div>
                          <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Type</label>
                              <select name="type" style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }}>
                                  <option value="standard">Standard</option>
                                  <option value="premium">Premium</option>
                                  <option value="luxury">Luxury</option>
                              </select>
                          </div>
                      </div>
                      <button type="submit" style={{ marginTop: '1rem', padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>+ Add Gift</button>
                  </form>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem', alignContent: 'start' }}>
                  {gifts.map(g => (
                      <div key={g._id || g.id} style={{ background: '#121212', padding: '1.5rem', borderRadius: '12px', position: 'relative', border: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{g.icon}</div>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', textAlign: 'center' }}>{g.name}</h3>
                          <div style={{ background: '#222', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 600 }}>
                            {g.price} 🪙
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>{g.type}</span>
                          <button 
                            onClick={() => deleteGift(g._id || g.id)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete Gift"
                          >🗑️</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Economy Tab */}
      {activeTab === 'economy' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Token Packages</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#666' }}>Define the token bundles available for purchase</p>
                    </div>
                    <button onClick={addTokenPackage} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>+ Add Package</button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                      {settings.tokenPackages?.map((pkg: any) => (
                          <div key={pkg.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 50px', gap: '1.5rem', background: '#0a0a0a', padding: '1.5rem', borderRadius: '12px', alignItems: 'center', border: '1px solid #333' }}>
                              <div>
                                  <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '6px' }}>Label</label>
                                  <input 
                                    value={pkg.label} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'label', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', borderBottom: '1px solid #333', width: '100%', padding: '6px 0', fontSize: '1rem', fontWeight: 500 }}
                                  />
                              </div>
                              <div>
                                  <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '6px' }}>Tokens</label>
                                  <input 
                                    type="number"
                                    value={pkg.tokens} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'tokens', parseInt(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', borderBottom: '1px solid #333', width: '100%', padding: '6px 0', fontSize: '1rem', fontWeight: 600 }}
                                  />
                              </div>
                              <div>
                                  <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '6px' }}>Price ($)</label>
                                  <input 
                                    type="number"
                                    value={pkg.price} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'price', parseFloat(e.target.value))}
                                    style={{ background: 'transparent', border: 'none', color: '#4ade80', borderBottom: '1px solid #333', width: '100%', padding: '6px 0', fontSize: '1rem', fontWeight: 600 }}
                                  />
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                  <label style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '6px' }}>Popular</label>
                                  <input 
                                    type="checkbox"
                                    checked={pkg.popular || false} 
                                    onChange={(e) => updateTokenPackage(pkg.id, 'popular', e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                  />
                              </div>
                              <button onClick={() => removeTokenPackage(pkg.id)} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                          </div>
                      ))}
                  </div>
              </div>

              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Payment Methods</h3>
                  <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                      {settings.paymentMethods?.map((method: any) => (
                          <div key={method.id} style={{ background: '#0a0a0a', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '1.5rem' }}>{method.id === 'stripe' ? '💳' : method.id === 'crypto' ? '₿' : '🏦'}</div>
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{method.name}</span>
                              </div>
                              <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={method.enabled} 
                                    onChange={() => togglePaymentMethod(method.id)}
                                    style={{ width: '20px', height: '20px', accentColor: '#4ade80' }}
                                  />
                              </label>
                          </div>
                      ))}
                  </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                  <button onClick={saveSettings} style={{ padding: '14px 40px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                    Save Economy Settings
                  </button>
              </div>
          </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333', height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Create Promotion</h3>
                  <form onSubmit={handleCreatePromotion} style={{ display: 'grid', gap: '1.2rem' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Title</label>
                          <input name="title" placeholder="Summer Sale" required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Description</label>
                          <textarea name="description" placeholder="Get 20% extra tokens..." required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none', minHeight: '80px', resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Start Date</label>
                              <input name="startDate" type="datetime-local" required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                          </div>
                          <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>End Date</label>
                              <input name="endDate" type="datetime-local" required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                          </div>
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Banner URL (Optional)</label>
                          <input name="bannerUrl" placeholder="https://..." style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <button type="submit" style={{ marginTop: '0.5rem', padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Create Promotion</button>
                  </form>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
                  {promotions.map(p => (
                      <div key={p._id} style={{ background: '#121212', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333', position: 'relative', display: 'flex', gap: '1.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '0.5rem' }}>
                                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>ACTIVE</span>
                                <h3 style={{ margin: 0 }}>{p.title}</h3>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', color: '#aaa', lineHeight: 1.5 }}>{p.description}</p>
                            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: '#666' }}>
                                <div><span style={{ color: '#888' }}>Starts:</span> {new Date(p.startDate).toLocaleDateString()}</div>
                                <div><span style={{ color: '#888' }}>Ends:</span> {new Date(p.endDate).toLocaleDateString()}</div>
                            </div>
                          </div>
                          {p.bannerUrl && (
                              <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.bannerUrl} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                          )}
                          <button 
                            onClick={() => handleDeletePromotion(p._id)}
                            style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                            title="Delete Promotion"
                          >🗑️</button>
                      </div>
                  ))}
                  {promotions.length === 0 && (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#666', background: '#121212', borderRadius: '12px', border: '1px dashed #333' }}>
                          No active promotions found. Create one to engage your users!
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Ads Tab */}
      {activeTab === 'ads' && (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333', height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>New Advertisement</h3>
                  <form onSubmit={handleCreateAd} style={{ display: 'grid', gap: '1.2rem' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Internal Title</label>
                          <input name="title" placeholder="Nike Summer Campaign" required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Image URL</label>
                          <input name="imageUrl" placeholder="https://..." required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Target URL</label>
                          <input name="targetUrl" placeholder="https://nike.com" required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Placement</label>
                          <select name="location" style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }}>
                              <option value="home-top">Home Top Banner</option>
                              <option value="video-overlay">Video Player Overlay</option>
                              <option value="sidebar">Sidebar Widget</option>
                              <option value="footer">Footer Banner</option>
                          </select>
                      </div>
                      <button type="submit" style={{ marginTop: '0.5rem', padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Create Ad</button>
                  </form>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
                  {ads.map(a => (
                      <div key={a._id} style={{ background: '#121212', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{a.title}</h3>
                              <span style={{ fontSize: '0.8rem', background: '#333', padding: '2px 8px', borderRadius: '4px', color: '#aaa' }}>{a.location}</span>
                          </div>
                          
                          <div style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', background: '#000', maxHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {a.imageUrl ? (
                                <img src={a.imageUrl} alt={a.title} style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                              ) : (
                                <div style={{ padding: '2rem', color: '#666' }}>No Image Preview</div>
                              )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <a href={a.targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {a.targetUrl} ↗
                            </a>
                            <button 
                                onClick={() => handleDeleteAd(a._id)}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                            >
                                Delete Ad
                            </button>
                          </div>
                      </div>
                  ))}
                  {ads.length === 0 && (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#666', background: '#121212', borderRadius: '12px', border: '1px dashed #333' }}>
                          No active advertisements. Add one to monetize your traffic.
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333', height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>New Section</h3>
                  <form onSubmit={handleCreateSection} style={{ display: 'grid', gap: '1.2rem' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Section Title</label>
                          <input name="title" placeholder="e.g. Popular in Europe" required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Filter Type</label>
                          <select name="filterType" style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }}>
                              <option value="all">All Models</option>
                              <option value="recommended">Recommended</option>
                              <option value="new">Newest</option>
                              <option value="tag">By Tag</option>
                              <option value="random">Random</option>
                          </select>
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Filter Value (for Tag)</label>
                          <input name="filterValue" placeholder="e.g. South African" style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Order Priority</label>
                          <input name="order" type="number" defaultValue={0} style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <button type="submit" style={{ marginTop: '0.5rem', padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Create Section</button>
                  </form>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
                  {sections.map(s => (
                      <div key={s._id} style={{ background: '#121212', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{s.title}</h3>
                              <span style={{ fontSize: '0.8rem', background: '#333', padding: '2px 8px', borderRadius: '4px', color: '#aaa' }}>Order: {s.order}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
                              <div>Type: <span style={{ color: 'white' }}>{s.filterType}</span></div>
                              {s.filterValue && <div>Value: <span style={{ color: 'white' }}>{s.filterValue}</span></div>}
                          </div>

                          <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                            <button 
                                onClick={() => handleDeleteSection(s._id)}
                                style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem' }}
                            >
                                Delete
                            </button>
                          </div>
                      </div>
                  ))}
                  {sections.length === 0 && (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#666', background: '#121212', borderRadius: '12px', border: '1px dashed #333' }}>
                          No custom sections. The default sections will be shown on the home page.
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Vouchers Tab */}
      {activeTab === 'vouchers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333', height: 'fit-content' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Generate Vouchers</h3>
                  <form onSubmit={handleGenerateVouchers} style={{ display: 'grid', gap: '1.2rem' }}>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Token Amount</label>
                          <input name="amount" type="number" placeholder="100" required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Quantity</label>
                          <input name="count" type="number" placeholder="1" defaultValue={1} min={1} max={50} required style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                      </div>
                      <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>Expiry (Days)</label>
                          <input name="expiryDays" type="number" placeholder="30" style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', outline: 'none' }} />
                          <small style={{ color: '#666', fontSize: '0.75rem' }}>Leave empty for no expiry</small>
                      </div>
                      <button type="submit" style={{ marginTop: '0.5rem', padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Generate Codes</button>
                  </form>
              </div>

              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Recent Vouchers</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                                <th style={{ padding: '10px', color: '#aaa' }}>Code</th>
                                <th style={{ padding: '10px', color: '#aaa' }}>Tokens</th>
                                <th style={{ padding: '10px', color: '#aaa' }}>Status</th>
                                <th style={{ padding: '10px', color: '#aaa' }}>Created</th>
                                <th style={{ padding: '10px', color: '#aaa' }}>Used By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map((v: any) => (
                                <tr key={v._id || v.code} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>
                                        {v.code}
                                        <button 
                                            onClick={() => {navigator.clipboard.writeText(v.code); toast.success('Copied!');}}
                                            style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '0.8rem' }}
                                            title="Copy Code"
                                        >
                                            📋
                                        </button>
                                    </td>
                                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{v.tokens} 🪙</td>
                                    <td style={{ padding: '12px 10px' }}>
                                        {v.isUsed ? (
                                            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Used</span>
                                        ) : (
                                            <span style={{ background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Active</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 10px', color: '#888' }}>{new Date(v.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px 10px', color: '#888' }}>
                                        {v.usedBy ? (
                                            <span title={v.usedBy}>User ID: ...{String(v.usedBy).slice(-6)}</span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {vouchers.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No vouchers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Money Tab */}
      {activeTab === 'mobile-money' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Settings Section */}
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Configuration</h3>
                  
                  <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Enable Mobile Money</label>
                      <input 
                          type="checkbox" 
                          checked={settings.mobileMoney?.enabled || false}
                          onChange={e => setSettings({
                              ...settings, 
                              mobileMoney: { ...(settings.mobileMoney || {}), enabled: e.target.checked }
                          })}
                          style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                      />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>Payment Instructions</label>
                      <textarea 
                          value={settings.mobileMoney?.instructions || ''} 
                          onChange={e => setSettings({
                              ...settings, 
                              mobileMoney: { ...(settings.mobileMoney || {}), instructions: e.target.value }
                          })}
                          rows={4}
                          placeholder="Send money to 0123456789 and enter the reference ID below."
                          style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none', minHeight: '100px', fontFamily: 'inherit' }} 
                      />
                  </div>

                  <button onClick={saveSettings} style={{ padding: '12px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                      Save Configuration
                  </button>
              </div>

              {/* Transactions Section */}
              <div style={{ background: '#121212', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ margin: 0 }}>Pending Transactions</h3>
                      <button 
                        onClick={fetchData} 
                        style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        ↻ Refresh
                      </button>
                  </div>

                  {mobileMoneyTransactions.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#666', background: '#0a0a0a', borderRadius: '8px' }}>
                          No pending transactions found.
                      </div>
                  ) : (
                      <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                              <thead>
                                  <tr style={{ borderBottom: '1px solid #333', color: '#aaa' }}>
                                      <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
                                      <th style={{ textAlign: 'left', padding: '12px' }}>User</th>
                                      <th style={{ textAlign: 'left', padding: '12px' }}>Phone</th>
                                      <th style={{ textAlign: 'left', padding: '12px' }}>Ref ID</th>
                                      <th style={{ textAlign: 'left', padding: '12px' }}>Amount</th>
                                      <th style={{ textAlign: 'left', padding: '12px' }}>Tokens</th>
                                      <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {mobileMoneyTransactions.map((tx: any) => (
                                      <tr key={tx._id} style={{ borderBottom: '1px solid #222' }}>
                                          <td style={{ padding: '12px' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                          <td style={{ padding: '12px' }}>{tx.username}</td>
                                          <td style={{ padding: '12px' }}>{tx.phoneNumber}</td>
                                          <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>{tx.transactionReference}</td>
                                          <td style={{ padding: '12px' }}>${tx.amount}</td>
                                          <td style={{ padding: '12px' }}>{tx.tokens} 🪙</td>
                                          <td style={{ padding: '12px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                              <button 
                                                  onClick={() => handleProcessMobileMoney(tx._id, 'approve')}
                                                  style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                              >
                                                  Approve
                                              </button>
                                              <button 
                                                  onClick={() => handleProcessMobileMoney(tx._id, 'reject')}
                                                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                              >
                                                  Reject
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          </div>
      )}
      </div>
    </div>
  );
}

