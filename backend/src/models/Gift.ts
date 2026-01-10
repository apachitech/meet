import { db } from '../simple-db.js';
import crypto from 'crypto';

export class GiftModel {
  id: string;
  name: string;
  price: number;
  icon: string;
  type: 'standard' | 'premium' | 'luxury';

  constructor(data: any) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name;
    this.price = data.price;
    this.icon = data.icon;
    this.type = data.type || 'standard';
  }

  static async findAll() {
    const data = db.read();
    return data.gifts.map((g: any) => new GiftModel(g));
  }

  static async create(data: any) {
    const dbData = db.read();
    const newGift = new GiftModel(data);
    dbData.gifts.push(newGift);
    db.write(dbData);
    return newGift;
  }

  static async update(id: string, updates: any) {
    const dbData = db.read();
    const index = dbData.gifts.findIndex((g: any) => g.id === id);
    if (index === -1) return null;
    
    dbData.gifts[index] = { ...dbData.gifts[index], ...updates };
    db.write(dbData);
    return new GiftModel(dbData.gifts[index]);
  }

  static async delete(id: string) {
    const dbData = db.read();
    const index = dbData.gifts.findIndex((g: any) => g.id === id);
    if (index === -1) return false;
    
    dbData.gifts.splice(index, 1);
    db.write(dbData);
    return true;
  }
}

export const Gift = GiftModel;
