import mongoose, { Document, Model } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  primaryColor: string;
  backgroundUrl: string;
  tokenPackages: { id: string; tokens: number; price: number; label: string; popular?: boolean }[];
  paymentMethods: { id: string; name: string; enabled: boolean }[];
}

interface ISettingsModel extends Model<ISettings> {
  get(): Promise<ISettings>;
  update(updates: any): Promise<ISettings>;
}

const tokenPackageSchema = new mongoose.Schema({
  id: String,
  tokens: Number,
  price: Number,
  label: String,
  popular: Boolean
}, { _id: false });

const paymentMethodSchema = new mongoose.Schema({
  id: String,
  name: String,
  enabled: Boolean
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Apacciflix' },
  primaryColor: { type: String, default: '#ef4444' },
  backgroundUrl: { type: String, default: '' },
  tokenPackages: { 
      type: [tokenPackageSchema], 
      default: [
        { id: 'pkg_100', tokens: 100, price: 9.99, label: 'Starter' },
        { id: 'pkg_500', tokens: 500, price: 45.00, label: 'Popular', popular: true },
        { id: 'pkg_1000', tokens: 1000, price: 85.00, label: 'Pro' },
        { id: 'pkg_5000', tokens: 5000, price: 399.00, label: 'Whale' },
      ] 
  },
  paymentMethods: { 
      type: [paymentMethodSchema], 
      default: [
        { id: 'paypal', name: 'PayPal', enabled: true },
        { id: 'stripe', name: 'Stripe', enabled: false },
        { id: 'crypto', name: 'Crypto', enabled: false }
      ] 
  }
});

settingsSchema.statics.get = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

settingsSchema.statics.update = async function(updates: any) {
  let settings = await this.findOne();
  if (!settings) {
      settings = new this(updates);
  } else {
      settings.set(updates);
  }
  await settings.save();
  return settings;
};

export const Settings = mongoose.model<ISettings, ISettingsModel>('Settings', settingsSchema);
