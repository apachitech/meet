'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';

interface SiteSettings {
  siteName: string;
  primaryColor: string;
  backgroundUrl?: string;
  homeTitle: string;
  homeSubtitle: string;
  gridTitle?: string;
  categories: { id: string; label: string; path: string }[];
  promo?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    backgroundColor: string;
    textColor: string;
    bonusAmount: number;
  };
}

const SiteConfigContext = createContext<SiteSettings | null>(null);

export const SiteConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Apacciflix',
    primaryColor: '#ef4444',
    homeTitle: 'Live Cams',
    homeSubtitle: 'Explore thousands of live cam models.',
    gridTitle: 'Live Cams',
    categories: [
      { id: 'featured', label: 'Featured', path: '/featured' },
      { id: 'girls', label: 'Female', path: '/girls' },
      { id: 'men', label: 'Male', path: '/men' },
      { id: 'vr', label: 'VR', path: '/vr' }
    ],
    promo: {
      enabled: true,
      title: '50 Tokens',
      subtitle: 'Free for new accounts!',
      backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      textColor: '#ffffff',
      bonusAmount: 50
    }
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/settings`)
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.primaryColor) {
            document.documentElement.style.setProperty('--accent-primary', data.primaryColor);
        }
        if (data.backgroundUrl) {
            document.documentElement.style.setProperty('--bg-image', `url(${data.backgroundUrl})`);
        } else {
            document.documentElement.style.removeProperty('--bg-image');
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
