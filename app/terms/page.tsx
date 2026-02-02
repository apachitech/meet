'use client';

import React from 'react';
import { useSiteConfig } from '../components/SiteConfigProvider';

export default function TermsPage() {
  const settings = useSiteConfig();
  const siteName = settings?.siteName || 'Apacciflix Meet';

  return (
    <main style={{
      minHeight: '100vh',
      background: '#000',
      color: '#e0e0e0',
      fontFamily: 'sans-serif',
      padding: '4rem 2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '2rem' }}>Terms and Conditions</h1>
        
        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Last Updated: {new Date().toLocaleDateString()}</p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Introduction</h2>
          <p style={{ lineHeight: '1.6' }}>
            Welcome to {siteName}. By accessing or using our website, services, and tools, you agree to comply with and be bound by the following Terms and Conditions. Please read these terms carefully before using our platform.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Age Restriction</h2>
          <p style={{ lineHeight: '1.6' }}>
            You must be at least 18 years of age to use this Platform. By accessing {siteName}, you certify that you are 18 years of age or older. We strictly prohibit the use of our services by minors.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>3. User Accounts</h2>
          <p style={{ lineHeight: '1.6' }}>
            To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during registration.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>4. Token System and Payments</h2>
          <p style={{ lineHeight: '1.6' }}>
            Our platform operates on a virtual token system ("Tokens").
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
            <li>Tokens are a license to access and use certain features of the Service.</li>
            <li>Tokens have no monetary value outside of our platform and cannot be exchanged for cash.</li>
            <li>All Token purchases are final and non-refundable, except as required by applicable law.</li>
            <li>We reserve the right to change Token pricing at any time without prior notice.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>5. User Conduct</h2>
          <p style={{ lineHeight: '1.6' }}>
            You agree not to engage in any of the following prohibited activities:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
            <li>Violating any applicable laws or regulations.</li>
            <li>Harassing, abusing, or harming another person.</li>
            <li>Posting or transmitting content that is illegal, obscene, defamatory, or threatening.</li>
            <li>Attempting to interfere with the proper functioning of the Service.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>6. Intellectual Property</h2>
          <p style={{ lineHeight: '1.6' }}>
            The content, organization, graphics, design, and other matters related to the Site are protected under applicable copyrights and other proprietary laws. The copying, redistribution, use, or publication by you of any such matters or any part of the Site is strictly prohibited.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>7. Termination</h2>
          <p style={{ lineHeight: '1.6' }}>
            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>8. Contact Us</h2>
          <p style={{ lineHeight: '1.6' }}>
            If you have any questions about these Terms, please contact us at support@{siteName.toLowerCase().replace(/\s/g, '')}.com.
          </p>
        </section>
      </div>
    </main>
  );
}
