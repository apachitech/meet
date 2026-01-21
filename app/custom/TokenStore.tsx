'use client';

import { useState, useEffect } from 'react';

export const TokenStore = ({ onClose, onPurchaseComplete }: { onClose: () => void, onPurchaseComplete: () => void }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
    
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.tokenPackages) setPackages(data.tokenPackages);
            })
            .catch(console.error);
    }, []);

    const handleMockPayment = async () => {
        if (!selectedPackage) return;
        setLoading(selectedPackage.id);
        
        try {
            const token = localStorage.getItem('token');
            // 1. Create Mock Order
            const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ packageId: selectedPackage.id, amount: selectedPackage.price, isMock: true })
            });
            const orderData = await createRes.json();
            
            if (!orderData.id) throw new Error("Failed to create mock order");

            // 2. Capture Mock Order
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/capture-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId: orderData.id, packageId: selectedPackage.id })
            });
            
            const result = await res.json();
            
            if (res.ok) {
                alert(`Successfully purchased ${selectedPackage.tokens} tokens!`);
                onPurchaseComplete();
                onClose();
            } else {
                alert(`Payment failed: ${result.message}`);
            }
            
        } catch (error) {
            console.error(error);
            alert("Payment failed");
        } finally {
            setLoading(null);
        }
    };

    return (
        <>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(2px)'
                }}>
                    Processing Payment...
                </div>
            )}
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
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    maxHeight: '90vh',
                    overflowY: 'auto'
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
                            cursor: 'pointer',
                            zIndex: 10
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
                                background: selectedPackage?.id === pkg.id ? 'var(--bg-sidebar)' : 'rgba(255,255,255,0.05)',
                                border: selectedPackage?.id === pkg.id ? '2px solid var(--accent-primary)' : (pkg.popular ? '2px solid var(--accent-secondary)' : '1px solid var(--border-color)'),
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
                            onClick={() => setSelectedPackage(pkg)}
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
                                    background: selectedPackage?.id === pkg.id ? 'var(--accent-primary)' : 'white',
                                    color: selectedPackage?.id === pkg.id ? 'white' : 'black',
                                    border: 'none',
                                    borderRadius: '25px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    {selectedPackage?.id === pkg.id ? 'Selected' : 'Select'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {selectedPackage && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            animation: 'fadeIn 0.3s ease-in'
                        }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white' }}>
                                Pay for {selectedPackage.tokens} Tokens
                            </h3>
                            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button 
                                        onClick={handleMockPayment}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        💳 Credit Card (Simulated)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Accepted Methods:</div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1rem' }}>
                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Credit Card</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
