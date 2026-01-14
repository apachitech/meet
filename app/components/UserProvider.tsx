'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface User {
  username: string;
  role: 'user' | 'model' | 'admin';
  tokenBalance: number;
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/api/profile', true);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    
    // Listen for custom event to refresh user (e.g., after login)
    const handleRefresh = () => fetchUser();
    window.addEventListener('REFRESH_USER', handleRefresh);
    
    // Poll for balance updates every 30 seconds
    const interval = setInterval(fetchUser, 30000);
    
    return () => {
        window.removeEventListener('REFRESH_USER', handleRefresh);
        clearInterval(interval);
    };
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}
