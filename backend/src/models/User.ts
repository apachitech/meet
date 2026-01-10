import { db } from '../simple-db.js';
import crypto from 'crypto';

export class UserModel {
  _id: string;
  username: string;
  password?: string;
  email: string;
  role: 'user' | 'model' | 'admin';
  tokenBalance: number;
  totalTips: number;
  totalLikes: number;
  likes: number;
  avatar?: string;
  bio?: string;
  settings?: {
    emailNotifications: boolean;
    twoFactor: boolean;
  };

  constructor(data: any) {
    this._id = data._id || data.id || crypto.randomUUID();
    this.username = data.username;
    this.password = data.password;
    this.email = data.email;
    this.role = data.role || 'user';
    this.tokenBalance = data.tokenBalance || 0;
    this.totalTips = data.totalTips || 0;
    this.totalLikes = data.totalLikes || 0;
    this.likes = data.likes || 0;
    this.avatar = data.avatar || '';
    this.bio = data.bio || '';
    this.settings = data.settings || { emailNotifications: true, twoFactor: false };
  }

  static async findOne(query: any) {
    const data = db.read();
    const user = data.users.find((u: any) => {
      for (const key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
    return user ? new UserModel(user) : null;
  }

  static async findById(id: string) {
    const data = db.read();
    const user = data.users.find((u: any) => u._id === id);
    return user ? new UserModel(user) : null;
  }

  static async create(data: any) {
    const dbData = db.read();
    const newUser = new UserModel(data);
    // Ensure uniqueness if needed, simplified here
    dbData.users.push(newUser);
    db.write(dbData);
    return newUser;
  }

  static async find(query: any, projection?: string) {
      const data = db.read();
      let users = data.users.filter((u: any) => {
          for (const key in query) {
              if (u[key] !== query[key]) return false;
          }
          return true;
      });
      
      if (projection) {
          const keys = projection.split(' ');
          users = users.map((u: any) => {
              const proj: any = {};
              // Very basic projection handling
              if (keys.includes('username')) proj.username = u.username;
              if (keys.includes('_id')) proj._id = u._id;
              return proj;
          });
      }
      return users.map((u: any) => new UserModel(u));
  }

  async save() {
    const dbData = db.read();
    const index = dbData.users.findIndex((u: any) => u._id === this._id);
    if (index !== -1) {
      dbData.users[index] = this;
    } else {
      dbData.users.push(this);
    }
    db.write(dbData);
    return this;
  }
  
  select(projection: string) {
      // Simplified select implementation for method chaining
      if (projection === '-password') {
          const { password, ...rest } = this;
          return rest;
      }
      return this;
  }
}

export const User = UserModel;
