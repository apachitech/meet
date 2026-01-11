'use client';

import { useState, useEffect } from 'react';
import { useSiteConfig } from '../components/SiteConfigProvider';
import { useSearchParams } from 'next/navigation';

export const Auth = () => {
  const settings = useSiteConfig();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    }
  }, [searchParams]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          window.location.href = '/profile';
        } else {
          setMessage('Registration successful! Please log in.');
          setIsLogin(true);
        }
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
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

          <button type="submit" className="lk-button" style={{ marginTop: '1rem', padding: '0.75rem' }}>
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        {message && <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem' }}>{message}</p>}

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
