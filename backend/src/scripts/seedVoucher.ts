import mongoose from 'mongoose';
import { Voucher } from '../models/Voucher.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const code = 'TEST-CODE-100';
        
        // Delete if exists
        await Voucher.deleteOne({ code });

        const voucher = new Voucher({
            code,
            tokens: 100,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        await voucher.save();
        console.log(`Voucher created: ${code} (100 tokens)`);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
