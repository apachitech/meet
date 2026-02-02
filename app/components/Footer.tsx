'use client';

import React from 'react';
import { useSiteConfig } from './SiteConfigProvider';
import { AdDisplay } from './AdDisplay';

export const Footer = () => {
  const settings = useSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: '#0f0f0f',
      padding: '3rem 2rem',
      borderTop: '1px solid var(--border-color)',
      marginTop: 'auto',
      color: 'var(--text-muted)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto 2rem auto' }}>
        <AdDisplay location="footer" style={{ width: '100%', height: '100px' }} />
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem'
      }}>
        {/* Brand Column */}
        <div>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>
            {settings?.siteName || 'Apacciflix'}
          </h3>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
            The premier destination for live interactive streaming. Connect with your favorite creators in real-time.
          </p>
        </div>

        {/* Links Column */}
        <div>
          <h4 style={{ color: 'white', marginBottom: '1rem' }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="/faq" style={{ color: 'inherit', textDecoration: 'none' }}>Help Center & FAQ</a></li>
            <li><a href="/faq" style={{ color: 'inherit', textDecoration: 'none' }}>Billing Support</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</a></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 style={{ color: 'white', marginBottom: '1rem' }}>Legal</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookie Policy</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>DMCA</a></li>
          </ul>
        </div>
      </div>
      
      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto 0',
        paddingTop: '2rem',
        borderTop: '1px solid #222',
        textAlign: 'center',
        fontSize: '0.8rem'
      }}>
        &copy; {year} {settings?.siteName || 'Apacciflix'}. All rights reserved. 18+ Only.
      </div>
    </footer>
  );
};
