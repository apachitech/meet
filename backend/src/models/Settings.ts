import { db } from '../simple-db.js';

export class SettingsModel {
  siteName: string;
  primaryColor: string;
  backgroundUrl?: string;
  tokenPackages: { id: string; tokens: number; price: number; label: string; popular?: boolean }[];
  paymentMethods: { id: string; name: string; enabled: boolean }[];

  constructor(data: any) {
    this.siteName = data.siteName || 'Apacciflix';
    this.primaryColor = data.primaryColor || '#ef4444';
    this.backgroundUrl = data.backgroundUrl || '';
    this.tokenPackages = data.tokenPackages || [
        { id: 'pkg_100', tokens: 100, price: 9.99, label: 'Starter' },
        { id: 'pkg_500', tokens: 500, price: 45.00, label: 'Popular', popular: true },
        { id: 'pkg_1000', tokens: 1000, price: 85.00, label: 'Pro' },
        { id: 'pkg_5000', tokens: 5000, price: 399.00, label: 'Whale' },
    ];
    this.paymentMethods = data.paymentMethods || [
        { id: 'paypal', name: 'PayPal', enabled: true },
        { id: 'stripe', name: 'Stripe', enabled: false },
        { id: 'crypto', name: 'Crypto', enabled: false }
    ];
  }

  static async get() {
    const data = db.read();
    return new SettingsModel(data.settings);
  }

  static async update(updates: any) {
    const data = db.read();
    data.settings = { ...data.settings, ...updates };
    db.write(data);
    return new SettingsModel(data.settings);
  }
}

export const Settings = SettingsModel;
