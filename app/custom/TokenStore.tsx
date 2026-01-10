'use client';

import { useState, useEffect } from 'react';

export const TokenStore = ({ onClose, onPurchaseComplete }: { onClose: () => void, onPurchaseComplete: () => void }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.tokenPackages) setPackages(data.tokenPackages);
                if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
            })
            .catch(console.error);
    }, []);

    const handlePurchase = async (pkg: any) => {
        setLoading(pkg.id);
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // 1. Create Order
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ packageId: pkg.id, amount: pkg.price })
            });
            const order = await res.json();

            // 2. Simulate PayPal Redirect
            const width = 500;
            const height = 600;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            
            // In a real app, this would be the approval URL from PayPal
            const popup = window.open(
                '', 
                'PayPal Checkout', 
                `width=${width},height=${height},top=${top},left=${left}`
            );
            
            if (popup) {
                popup.document.write(`
                    <html>
                        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5;">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" width="150" style="margin-bottom: 20px;">
                            <h2>Processing Payment...</h2>
                            <p>Pay $${pkg.price} for ${pkg.tokens} Tokens</p>
                            <button id="pay" style="background: #0070ba; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 20px;">Pay Now</button>
                            <script>
                                document.getElementById('pay').onclick = function() {
                                    window.opener.postMessage({ type: 'PAYMENT_SUCCESS', orderId: '${order.id}' }, '*');
                                    window.close();
                                }
                            </script>
                        </body>
                    </html>
                `);
            }

            // 3. Listen for completion
            const handleMessage = async (event: MessageEvent) => {
                if (event.data.type === 'PAYMENT_SUCCESS') {
                    // 4. Capture Order
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/capture-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ orderId: event.data.orderId, packageId: pkg.id })
                    });
                    
                    alert(`Successfully purchased ${pkg.tokens} tokens!`);
                    onPurchaseComplete();
                    onClose();
                    window.removeEventListener('message', handleMessage);
                }
            };
            window.addEventListener('message', handleMessage);

        } catch (error) {
            console.error(error);
            alert('Purchase failed');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)',
                width: '90%',
                maxWidth: '800px',
                borderRadius: 'var(--border-radius-md)',
                padding: '2rem',
                position: 'relative',
                border: '1px solid var(--border-color)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }} onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '1.5rem',
                        cursor: 'pointer'
                    }}
                >✕</button>

                <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem', color: 'white' }}>
                    Get More <span style={{ color: 'var(--accent-primary)' }}>Tokens</span>
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Purchase tokens to support your favorite models and unlock private shows.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {packages.map(pkg => (
                        <div key={pkg.id} style={{
                            background: 'var(--bg-sidebar)',
                            border: pkg.popular ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative',
                            transform: pkg.popular ? 'scale(1.05)' : 'none',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = pkg.popular ? 'scale(1.08)' : 'scale(1.03)'}
                        onMouseOut={e => e.currentTarget.style.transform = pkg.popular ? 'scale(1.05)' : 'none'}
                        onClick={() => handlePurchase(pkg)}
                        >
                            {pkg.popular && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    background: 'var(--accent-primary)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>MOST POPULAR</div>
                            )}
                            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{pkg.label}</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{pkg.tokens}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '1.5rem', fontWeight: 600 }}>TOKENS</div>
                            
                            <div style={{ 
                                width: '100%', 
                                borderTop: '1px solid var(--border-color)', 
                                margin: '0 0 1.5rem 0' 
                            }} />

                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white' }}>${pkg.price}</div>
                            
                            <button style={{
                                marginTop: '1rem',
                                width: '100%',
                                padding: '10px',
                                background: loading === pkg.id ? 'var(--text-muted)' : 'white',
                                color: 'black',
                                border: 'none',
                                borderRadius: '25px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }} disabled={loading === pkg.id}>
                                {loading === pkg.id ? 'Processing...' : 'Buy Now'}
                            </button>
                        </div>
                    ))}
                </div>
                
                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Accepted Methods:</div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1rem' }}>
                        {paymentMethods.filter(m => m.enabled).map(m => (
                            <span key={m.id} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                {m.name}
                            </span>
                        ))}
                    </div>
                    Secured by {paymentMethods.find(m => m.enabled && m.id === 'paypal') ? 'PayPal' : 'Secure Gateway'}. By purchasing, you agree to our Terms of Service.
                </div>
            </div>
        </div>
    );
};
