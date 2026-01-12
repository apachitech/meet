'use client';

import { useRouter } from 'next/navigation';
import { Footer } from '../components/Footer';
import { useEffect, useState } from 'react';
import { api, apiJson } from '../../lib/api';
import styles from '../../styles/Profile.module.css';
import { Toaster, toast } from 'react-hot-toast';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<{
        username: string;
        email: string;
        role: 'user' | 'model' | 'admin';
        tokenBalance: number;
        bio?: string;
        settings?: { emailNotifications: boolean; twoFactor: boolean };
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Local state for editing
    const [editForm, setEditForm] = useState({ email: '', bio: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        api.get('/api/profile', true)
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403 || res.status === 404) {
                        localStorage.removeItem('token');
                        router.push('/login');
                        throw new Error('Unauthorized');
                    }
                    throw new Error('Failed to fetch profile');
                }
                return res.json();
            })
            .then((data) => {
                const defaultSettings = { emailNotifications: true, twoFactor: false };
                setUser({ 
                    ...data, 
                    settings: data.settings ?? defaultSettings 
                });
                setEditForm({ email: data.email || '', bio: data.bio || '' });
                setLoading(false);
            })
            .catch((err) => {
                if (err.message !== 'Unauthorized') {
                    console.error(err);
                    toast.error('Failed to load profile');
                }
                setLoading(false);
            });
    }, [router]);

    const handleUpdateProfile = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await api.put('/api/profile', editForm, true);
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                toast.success('Profile updated successfully!');
            } else {
                toast.error('Failed to update profile');
            }
        } catch (err) {
            toast.error('Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    const toggleSetting = async (setting: 'emailNotifications' | 'twoFactor') => {
        if (!user) return;
        const currentSettings = user.settings || { emailNotifications: true, twoFactor: false };
        const newSettings = { ...currentSettings, [setting]: !currentSettings[setting] };
        
        // Optimistic update
        setUser({ ...user, settings: newSettings });

        const token = localStorage.getItem('token');
        try {
            await api.put('/api/profile', { settings: newSettings }, true);
        } catch (err) {
            toast.error('Failed to save setting');
             // Revert on error would be ideal
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('token');
            toast.success('Signed out successfully');
            router.push('/login');
        }
    };

    const goBack = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.profileContent}>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading security profile...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <>
                        <section className={styles.card}>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Username</span>
                                    <span className={styles.infoValue}>{user?.username}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Email</span>
                                    <span className={styles.infoValue}>{user?.email || 'Not set'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Bio</span>
                                    <span className={styles.infoValue} style={{ fontSize: '0.9rem', fontStyle: user?.bio ? 'normal' : 'italic' }}>
                                        {user?.bio || 'No bio provided'}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Account Role</span>
                                    <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                                        {user?.role}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {user?.role === 'admin' && (
                             <section className={styles.card} style={{ border: '2px solid var(--accent-primary)', background: 'rgba(239, 68, 68, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--accent-primary)' }}>Admin Access</h3>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Manage site settings, users, and economy.</p>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/admin')}
                                        style={{
                                            background: 'var(--accent-primary)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: 'var(--border-radius-sm)',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Open Admin Panel
                                    </button>
                                </div>
                             </section>
                        )}

                        <section className={styles.card}>
                            <div className={styles.balanceSection}>
                                <div className={styles.tokenBalance}>
                                    <span className={styles.infoLabel}>Available Credit</span>
                                    <div className={styles.tokenAmount}>
                                        {user?.tokenBalance} <span>Tokens</span>
                                    </div>
                                </div>
                                {user?.role === 'user' && (
                                    <button className={styles.actionBtn}>
                                        Top Up Tokens
                                    </button>
                                )}
                                {user?.role === 'model' && (
                                    <button className={styles.actionBtn} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                        Withdraw Earnings
                                    </button>
                                )}
                            </div>
                        </section>
                    </>
                );
            case 'edit':
                return (
                    <section className={styles.card}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Edit Profile</h2>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Username</label>
                            <input className={styles.formInput} defaultValue={user?.username} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                            <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Username cannot be changed.</small>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Email Address</label>
                            <input 
                                className={styles.formInput} 
                                value={editForm.email} 
                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                type="email" 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Bio / Description</label>
                            <textarea 
                                className={styles.formInput} 
                                rows={4} 
                                placeholder="Tell us about yourself..." 
                                value={editForm.bio}
                                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            />
                        </div>
                        <button 
                            className={styles.actionBtn} 
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </section>
                );
            case 'transactions':
                return (
                    <section className={styles.card}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Transaction History</h2>
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-sm)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💸</div>
                            <p>No recent transactions found.</p>
                        </div>
                    </section>
                );
            case 'settings':
                return (
                    <section className={styles.card}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Account Settings</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Email Notifications</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receive updates about your account activity</div>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={!!user?.settings?.emailNotifications} 
                                onChange={() => toggleSetting('emailNotifications')}
                                style={{ transform: 'scale(1.5)', accentColor: 'var(--accent-primary)' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 0', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Two-Factor Authentication</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Secure your account with 2FA</div>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={!!user?.settings?.twoFactor} 
                                onChange={() => toggleSetting('twoFactor')}
                                style={{ transform: 'scale(1.5)', accentColor: 'var(--accent-primary)' }} 
                            />
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div className={styles.profileContainer} style={{ flex: 1 }}>
                <Toaster position="top-right" />
                <div className={styles.profileContent}>
                    <div style={{ 
                        position: 'sticky', 
                        top: 0, 
                        zIndex: 40, 
                        background: 'rgba(18, 18, 18, 0.95)', 
                        backdropFilter: 'blur(10px)',
                        padding: '2rem 0 0 0', 
                        margin: '0 0 2rem 0', 
                        borderBottom: '1px solid var(--border-color)' 
                    }}>
                        <header className={styles.header}>
                            <h1>User Management</h1>
                            <button className={styles.backBtn} onClick={goBack}>
                                ← Back to Home
                            </button>
                        </header>

                        <div className={styles.tabs} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: '1rem' }}>
                            <button 
                                className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`} 
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </button>
                            <button 
                                className={`${styles.tab} ${activeTab === 'edit' ? styles.active : ''}`} 
                                onClick={() => setActiveTab('edit')}
                            >
                                Edit Profile
                            </button>
                            <button 
                                className={`${styles.tab} ${activeTab === 'transactions' ? styles.active : ''}`} 
                                onClick={() => setActiveTab('transactions')}
                            >
                                Transactions
                            </button>
                            <button 
                                className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`} 
                                onClick={() => setActiveTab('settings')}
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    {renderContent()}

                    <div className={styles.logoutSection}>
                        <button className={styles.logoutBtn} onClick={handleLogout}>
                            Sign Out of Account
                        </button>
                    </div>
                </div>
            </div>
            <div aria-hidden style={{ height: '200px', flexShrink: 0 }} />
            <div style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}>
                <Footer />
            </div>
        </div>
    );
}
