import { useState, useEffect } from 'react';
import GooglePayButton from '@google-pay/button-react';

export const TokenStore = ({ onClose, onPurchaseComplete }: { onClose: () => void, onPurchaseComplete: () => void }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [redeemCodeInput, setRedeemCodeInput] = useState('');
    const [redeemLoading, setRedeemLoading] = useState(false);
    const [socialContacts, setSocialContacts] = useState<{whatsapp?: string, telegram?: string}>({});
    const [mobileMoneySettings, setMobileMoneySettings] = useState<{enabled: boolean, instructions: string}>({ enabled: false, instructions: '' });
    const [googlePaySettings, setGooglePaySettings] = useState<{enabled: boolean, merchantId: string, merchantName: string, gateway: string, gatewayMerchantId: string} | null>(null);
    
    // Mobile Money State
    const [showMobileMoneyForm, setShowMobileMoneyForm] = useState(false);
    const [mmPhone, setMmPhone] = useState('');
    const [mmRef, setMmRef] = useState('');
    const [mmLoading, setMmLoading] = useState(false);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.tokenPackages) setPackages(data.tokenPackages);
                if (data.socialContacts) setSocialContacts(data.socialContacts);
                if (data.mobileMoney) setMobileMoneySettings(data.mobileMoney);
                if (data.googlePay) setGooglePaySettings(data.googlePay);
            })
            .catch(console.error);
    }, []);

    const handleGooglePayLoadPaymentData = async (paymentData: any) => {
        if (!selectedPackage) return;
        setLoading(selectedPackage.id);
        setError(null);
        
        try {
            console.log('[TokenStore] Google Pay Payment Data:', paymentData);
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/google-pay/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    paymentData,
                    packageId: selectedPackage.id 
                })
            });
            
            const result = await res.json();
            
            if (res.ok && result.success) {
                alert(`Successfully purchased ${selectedPackage.tokens} tokens!`);
                onPurchaseComplete();
                onClose();
            } else {
                throw new Error(result.message || 'Payment processing failed');
            }
        } catch (err: any) {
            console.error("Google Pay Error:", err);
            setError(`Payment failed: ${err.message}`);
        } finally {
            setLoading(null);
        }
    };


    const handleMobileMoneySubmit = async () => {
        if (!selectedPackage || !mmPhone || !mmRef) return;
        setMmLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payment/mobile-money/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ 
                    packageId: selectedPackage.id,
                    phoneNumber: mmPhone,
                    transactionReference: mmRef
                })
            });
            const data = await res.json();

            if (res.ok) {
                alert('Payment submitted! Tokens will be added after admin approval.');
                onClose();
            } else {
                throw new Error(data.message || 'Failed to submit payment');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setMmLoading(false);
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
                                    setShowMobileMoneyForm(false);
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

                                {!showMobileMoneyForm ? (
                                    <div style={{ maxWidth: '300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {googlePaySettings?.enabled ? (
                                            <div style={{ width: '100%' }}>
                                                <GooglePayButton
                                                    environment="TEST"
                                                    paymentRequest={{
                                                        apiVersion: 2,
                                                        apiVersionMinor: 0,
                                                        allowedPaymentMethods: [
                                                            {
                                                                type: 'CARD',
                                                                parameters: {
                                                                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                                                    allowedCardNetworks: ['MASTERCARD', 'VISA'],
                                                                },
                                                                tokenizationSpecification: {
                                                                    type: 'PAYMENT_GATEWAY',
                                                                    parameters: {
                                                                        gateway: googlePaySettings.gateway || 'example',
                                                                        gatewayMerchantId: googlePaySettings.gatewayMerchantId || 'exampleGatewayMerchantId',
                                                                    },
                                                                },
                                                            },
                                                        ],
                                                        merchantInfo: {
                                                            merchantId: googlePaySettings.merchantId || '12345678901234567890',
                                                            merchantName: googlePaySettings.merchantName || 'Demo Merchant',
                                                        },
                                                        transactionInfo: {
                                                            totalPriceStatus: 'FINAL',
                                                            totalPriceLabel: 'Total',
                                                            totalPrice: selectedPackage.price.toString(),
                                                            currencyCode: 'USD',
                                                            countryCode: 'US',
                                                        },
                                                    }}
                                                    onLoadPaymentData={handleGooglePayLoadPaymentData}
                                                    buttonType="buy"
                                                    buttonSizeMode="fill"
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
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
                                                <strong>Google Pay Not Configured</strong>
                                            </div>
                                        )}

                                        {mobileMoneySettings.enabled && (
                                            <button
                                                onClick={() => setShowMobileMoneyForm(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '1rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                📱 Pay with Mobile Money
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ background: '#262626', padding: '1rem', borderRadius: '8px' }}>
                                        <h4 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Mobile Money Payment</h4>
                                        
                                        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#ccc', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                                            {mobileMoneySettings.instructions || 'Please contact support for payment instructions.'}
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Your Phone Number</label>
                                            <input 
                                                type="text" 
                                                value={mmPhone}
                                                onChange={e => setMmPhone(e.target.value)}
                                                placeholder="+1234567890"
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#111', color: 'white' }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Transaction Reference ID</label>
                                            <input 
                                                type="text" 
                                                value={mmRef}
                                                onChange={e => setMmRef(e.target.value)}
                                                placeholder="e.g. TX123456789"
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#111', color: 'white' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => setShowMobileMoneyForm(false)}
                                                style={{ flex: 1, padding: '10px', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleMobileMoneySubmit}
                                                disabled={mmLoading || !mmPhone || !mmRef}
                                                style={{ 
                                                    flex: 1, 
                                                    padding: '10px', 
                                                    background: '#ef4444', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '4px', 
                                                    cursor: mmLoading ? 'not-allowed' : 'pointer',
                                                    opacity: mmLoading ? 0.7 : 1
                                                }}
                                            >
                                                {mmLoading ? 'Submitting...' : 'Confirm Payment'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Accepted Methods:</div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Google Pay</span>
                            <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Cards</span>
                            {mobileMoneySettings.enabled && <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Mobile Money</span>}
                        </div>
                        Secured Payment Processing.
                    </div>
                </div>
            </div>
    );
};
