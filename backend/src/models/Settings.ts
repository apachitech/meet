import mongoose, { Document, Model } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  primaryColor: string;
  backgroundUrl: string;
  homeTitle: string;
  homeSubtitle: string;
  gridTitle: string;
  categories: { id: string; label: string; path: string }[];
  tokenPackages: { id: string; tokens: number; price: number; label: string; popular?: boolean }[];
  paymentMethods: { id: string; name: string; enabled: boolean }[];
  socialContacts: { whatsapp: string; telegram: string };
}

interface ISettingsModel extends Model<ISettings> {
  get(): Promise<ISettings>;
  update(updates: any): Promise<ISettings>;
}

const categorySchema = new mongoose.Schema({
  id: String,
  label: String,
  path: String
}, { _id: false });

const tokenPackageSchema = new mongoose.Schema({
  id: String,
  tokens: Number,
  price: Number,
  label: String,
  popular: Boolean,
  lemonVariantId: String // ID from LemonSqueezy Product Variant
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
  homeTitle: { type: String, default: 'Live Cams' },
  homeSubtitle: { type: String, default: 'Explore thousands of live cam models.' },
  gridTitle: { type: String, default: 'Live Cams' },
  categories: { 
    type: [categorySchema], 
    default: [
      { id: 'featured', label: 'Featured', path: '/featured' },
      { id: 'girls', label: 'Girls', path: '/girls' },
      { id: 'couples', label: 'Couples', path: '/couples' },
      { id: 'trans', label: 'Trans', path: '/trans' },
      { id: 'men', label: 'Men', path: '/men' },
      { id: 'vr', label: 'VR', path: '/vr' }
    ]
  },
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
        { id: 'lemon', name: 'LemonSqueezy', enabled: true },
        { id: 'stripe', name: 'Stripe', enabled: false },
        { id: 'crypto', name: 'Crypto', enabled: false }
      ] 
  },
  socialContacts: {
      whatsapp: { type: String, default: '' },
      telegram: { type: String, default: '' }
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
