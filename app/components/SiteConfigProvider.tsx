'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';

interface SiteSettings {
  siteName: string;
  primaryColor: string;
  backgroundUrl?: string;
}

const SiteConfigContext = createContext<SiteSettings | null>(null);

export const SiteConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Apacciflix',
    primaryColor: '#ef4444',
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        document.documentElement.style.setProperty('--accent-primary', data.primaryColor);
        if (data.backgroundUrl) {
            document.documentElement.style.setProperty('--bg-image', `url(${data.backgroundUrl})`);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <SiteConfigContext.Provider value={settings}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
