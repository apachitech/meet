import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['user', 'model'], default: 'user' },
    tokenBalance: { type: Number, default: 0 }
});

export const User = model('User', userSchema);
