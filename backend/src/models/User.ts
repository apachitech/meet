import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password?: string;
  email: string;
  role: 'user' | 'model' | 'admin';
  tokenBalance: number;
  totalTips: number;
  totalLikes: number;
  followersCount: number;
  viewsCount: number;
  likes: number;
  avatar: string;
  previewUrl: string;
  bio: string;
  settings: {
    emailNotifications: boolean;
    twoFactor: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  select(projection: string): Partial<IUser>;
}

interface IUserModel extends Model<IUser> {}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['user', 'model', 'admin'], 
    default: 'user' 
  },
  tokenBalance: { type: Number, default: 0 },
  totalTips: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  avatar: { type: String, default: '' },
  previewUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    twoFactor: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Add a method to mimic the old select behavior for removing password
userSchema.methods.select = function(projection: string) {
  if (projection === '-password') {
    const obj = this.toObject();
    delete obj.password;
    return obj;
  }
  return this;
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
