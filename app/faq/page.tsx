'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSiteConfig } from '../components/SiteConfigProvider';
import { Footer } from '../components/Footer';

export default function FAQPage() {
    const router = useRouter();
    const settings = useSiteConfig();
    const siteName = settings?.siteName || 'Apacciflix';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
            <nav style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div 
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)', cursor: 'pointer' }}
                    onClick={() => router.push('/')}
                >
                    {siteName}
                </div>
                <button 
                    onClick={() => router.push('/')}
                    style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Back to Home
                </button>
            </nav>

            <main style={{ flex: 1, padding: '3rem', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Help Center & FAQ</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section>
                        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>General Questions</h2>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>What is {siteName}?</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {siteName} is a premium interactive streaming platform where you can connect with creators in real-time through high-quality video, chat, and interactive gifts.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>Is {siteName} free to use?</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Watching public streams is generally free. However, tipping creators, sending gifts, and accessing private shows requires Tokens, which can be purchased in our store.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Account & Billing</h2>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>How do I buy Tokens?</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                You can purchase tokens by clicking the &quot;Buy Tokens&quot; button in the sidebar or visiting your profile page. We support various secure payment methods.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>Can I get a refund?</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Token purchases are generally non-refundable once used. If you experience technical issues, please contact our support team immediately.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Safety & Privacy</h2>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>Is my information secure?</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Yes, we use industry-standard encryption to protect your personal and payment information. We do not share your private data with third parties.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
