'use client';

import { useState, useEffect } from 'react';
import { useSiteConfig } from '../components/SiteConfigProvider';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export const Auth = () => {
  const settings = useSiteConfig();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    }
  }, [searchParams]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Basic Client-side Validation
    if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setIsLoading(false);
        return;
    }

    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const body: any = { username, password };
      if (!isLogin) {
        body.role = role;
        body.email = email;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          // Trigger user refresh in global state
          window.dispatchEvent(new Event('REFRESH_USER'));
          toast.success('Welcome back!');
          router.push('/profile');
        } else {
          toast.success('Registration successful! Logging you in...');
          // Automatically log in after registration
          try {
             const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/login`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ username, password })
             });
             const loginData = await loginRes.json();
             if (loginRes.ok) {
                 localStorage.setItem('token', loginData.token);
                 // Trigger user refresh in global state
                 window.dispatchEvent(new Event('REFRESH_USER'));
                 router.push('/profile');
             } else {
                 setIsLogin(true);
                 setIsLoading(false);
             }
          } catch(e) {
             setIsLogin(true);
             setIsLoading(false);
          }
        }
      } else {
        toast.error(data.message || 'Authentication failed');
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #1a1a1a, #000)'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        padding: '2.5rem',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-glow)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>
          {isLogin ? 'Welcome Back' : 'Join the Stage'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
           to {settings?.siteName || 'Apacciflix'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                background: '#222',
                color: 'white',
                outline: 'none'
              }}
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: '#222',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                background: '#222',
                color: 'white',
                outline: 'none'
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', gap: '1rem', margin: '0.5rem 0' }}>
              <label style={{ flex: 1, cursor: 'pointer', background: role === 'user' ? 'var(--accent-primary)' : '#222', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === 'user'}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ display: 'none' }}
                />
                Viewer
              </label>
              <label style={{ flex: 1, cursor: 'pointer', background: role === 'model' ? 'var(--accent-secondary)' : '#222', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <input
                  type="radio"
                  name="role"
                  value="model"
                  checked={role === 'model'}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ display: 'none' }}
                />
                Model
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className="lk-button" 
            style={{ marginTop: '1rem', padding: '0.75rem', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', color: 'var(--text-secondary)', textDecoration: 'underline' }}
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};
