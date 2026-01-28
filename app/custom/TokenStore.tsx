import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export const TokenStore = ({ onClose, onPurchaseComplete }: { onClose: () => void, onPurchaseComplete: () => void }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [redeemCodeInput, setRedeemCodeInput] = useState('');
    const [redeemLoading, setRedeemLoading] = useState(false);
    const [lemonLoading, setLemonLoading] = useState(false);
    const [socialContacts, setSocialContacts] = useState<{whatsapp?: string, telegram?: string}>({});
    
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.tokenPackages) setPackages(data.tokenPackages);
                if (data.socialContacts) setSocialContacts(data.socialContacts);
            })
            .catch(console.error);
    }, []);

    // PayPal Configuration
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const isPayPalConfigured = paypalClientId && paypalClientId !== 'test';

    const handleLemonCheckout = async () => {
        if (!selectedPackage) return;
        setLemonLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/lemon/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ packageId: selectedPackage.id })
            });
            const data = await res.json();
            
            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.message || 'Failed to start checkout');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLemonLoading(false);
        }
    };

    const handleRedeemCode = async () => {
        if (!redeemCodeInput.trim()) return;
        setRedeemLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code: redeemCodeInput })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert(data.message);
                onPurchaseComplete();
                onClose();
            } else {
                throw new Error(data.message || 'Redemption failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRedeemLoading(false);
        }
    };

    const createOrder = async (data: any, actions: any) => {
        if (!selectedPackage) return '';
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log(`[TokenStore] Starting Payment Flow`);
        console.log(`[TokenStore] API URL: ${apiUrl}`);
        console.log(`[TokenStore] Package: ${selectedPackage.id} ($${selectedPackage.price})`);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                const msg = "You are not logged in. Please log in to purchase tokens.";
                alert(msg);
                throw new Error(msg);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

            console.log(`[TokenStore] Sending request to ${apiUrl}/api/payment/create-order`);
            
            const res = await fetch(`${apiUrl}/api/payment/create-order`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    packageId: selectedPackage.id, 
                    amount: selectedPackage.price 
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            console.log(`[TokenStore] Response received: ${res.status}`);
            
            // Handle HTTP Errors
            if (!res.ok) {
                const text = await res.text();
                console.error(`[TokenStore] Error Body: ${text}`);
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.message || json.details || `Server Error: ${res.status}`);
                } catch (e) {
                    throw new Error(`Server Error: ${res.status} - ${text.substring(0, 50)}...`);
                }
            }

            const order = await res.json();
            console.log(`[TokenStore] Order ID received: ${order.id}`);
            
            if (!order.id) {
                throw new Error('Invalid response from server: No Order ID');
            }
            
            return order.id;

        } catch (err: any) {
            console.error("[TokenStore] Create Order Fatal Error:", err);
            
            let msg = err.message;
            if (err.name === 'AbortError') msg = "Connection timed out. Check if backend is running.";
            if (err.message.includes('Failed to fetch')) msg = "Network Error: Cannot connect to backend server. Is it running?";

            setError(msg);
            alert(`Payment Failed: ${msg}`);
            
            // Re-throw to stop PayPal spinner
            throw err;
        }
    };

    const onApprove = async (data: any, actions: any) => {
        if (!selectedPackage) return;
        setLoading(selectedPackage.id);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/capture-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId: data.orderID, packageId: selectedPackage.id })
            });
            
            const result = await res.json();
            
            if (res.ok && result.status === 'COMPLETED') {
                alert(`Successfully purchased ${selectedPackage.tokens} tokens!`);
                onPurchaseComplete();
                onClose();
            } else {
                throw new Error(result.message || 'Payment capture failed');
            }
        } catch (err: any) {
            console.error("Capture Error:", err);
            setError(`Payment failed: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };

    return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.8)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    background: '#1a1a1a',
                    padding: '2rem',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    border: '1px solid #333',
                    position: 'relative'
                }}>
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                    
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'white' }}>Get Tokens</h2>
                    
                    {!selectedPackage ? (
                        <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {packages.map(pkg => (
                                <div 
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg)}
                                    style={{
                                        background: pkg.popular ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : '#262626',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        border: '2px solid transparent',
                                        transition: 'transform 0.2s',
                                        textAlign: 'center'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                                        {pkg.tokens} 🪙
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        ${pkg.price}
                                    </div>
                                    {pkg.popular && (
                                        <div style={{ 
                                            fontSize: '0.8rem', 
                                            background: 'white', 
                                            color: '#ef4444', 
                                            padding: '2px 8px', 
                                            borderRadius: '10px',
                                            display: 'inline-block',
                                            marginTop: '0.5rem',
                                            fontWeight: 'bold'
                                        }}>
                                            BEST VALUE
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Manual Purchase Section */}
                        {(socialContacts.whatsapp || socialContacts.telegram) && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                                <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Manual Purchase</h3>
                                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    Prefer to pay manually? Contact our agent to pay and get a code.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                    {socialContacts.whatsapp && (
                                        <a 
                                            href={`https://wa.me/${socialContacts.whatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                background: '#25D366', color: 'white', textDecoration: 'none',
                                                padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>📱</span> WhatsApp
                                        </a>
                                    )}
                                    {socialContacts.telegram && (
                                        <a 
                                            href={`https://t.me/${socialContacts.telegram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                background: '#0088cc', color: 'white', textDecoration: 'none',
                                                padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            <span style={{ fontSize: '1.2rem' }}>✈️</span> Telegram
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Redemption Section */}
                        <div style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.1rem' }}>Have a code?</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter redemption code"
                                    value={redeemCodeInput}
                                    onChange={(e) => setRedeemCodeInput(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid #333',
                                        background: '#262626',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={handleRedeemCode}
                                    disabled={redeemLoading || !redeemCodeInput}
                                    style={{
                                        padding: '0 1.5rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#ef4444',
                                        color: 'white',
                                        cursor: redeemLoading || !redeemCodeInput ? 'not-allowed' : 'pointer',
                                        opacity: redeemLoading || !redeemCodeInput ? 0.7 : 1,
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {redeemLoading ? '...' : 'Redeem'}
                                </button>
                            </div>
                            {error && !selectedPackage && (
                                <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                    {error}
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <div>
                            <button 
                                onClick={() => {
                                    setSelectedPackage(null);
                                    setError(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    marginBottom: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                ← Back to packages
                            </button>
                            
                            <div style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                marginBottom: '1.5rem'
                            }}>
                                <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white' }}>
                                    Pay for {selectedPackage.tokens} Tokens
                                </h3>
                                
                                {error && (
                                    <div style={{
                                        padding: '10px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid #ef4444',
                                        color: '#ef4444',
                                        borderRadius: '4px',
                                        marginBottom: '1rem',
                                        fontSize: '0.9rem',
                                        textAlign: 'center'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                                    {isPayPalConfigured ? (
                                        <PayPalButtons 
                                            style={{ layout: "vertical", shape: "rect" }}
                                            createOrder={createOrder}
                                            onApprove={onApprove}
                                            onError={(err) => {
                                                console.error("PayPal Button Error:", err);
                                                const errorMsg = err?.message || JSON.stringify(err);
                                                setError(`PayPal Error: ${errorMsg}`);
                                            }}
                                            onCancel={() => {
                                                console.log("User cancelled PayPal payment");
                                                setError("Payment was cancelled");
                                            }}
                                            onInit={(data, actions) => {
                                                console.log("[TokenStore] PayPal buttons initialized");
                                            }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            padding: '1rem', 
                                            background: 'rgba(255, 165, 0, 0.1)', 
                                            border: '1px solid orange',
                                            borderRadius: '8px',
                                            color: 'orange',
                                            textAlign: 'center',
                                            fontSize: '0.9rem'
                                        }}>
                                            <strong>Setup Required</strong>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
                                                PayPal Client ID is missing.<br/>
                                                Please check your <code>.env.local</code> file.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                                    <button
                                        onClick={handleLemonCheckout}
                                        disabled={lemonLoading}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: '#7047EB',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '1rem',
                                            cursor: lemonLoading ? 'not-allowed' : 'pointer',
                                            opacity: lemonLoading ? 0.7 : 1,
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {lemonLoading ? 'Loading...' : (
                                            <>
                                                <span>🍋</span> Pay with Card (LemonSqueezy)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Accepted Methods:</div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1rem' }}>
                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>PayPal</span>
                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Cards</span>
                        </div>
                        Secured by PayPal. By purchasing, you agree to our Terms of Service.
                    </div>
                </div>
            </div>
    );
};
