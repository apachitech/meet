'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        // Apply CSS Variables
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
