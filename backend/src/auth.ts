import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './models/User.js';
import { Settings } from './models/Settings.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96';

export const register = async (req: Request, res: Response) => {
  const { username, password, role, email } = req.body;

  if (!username || !password || !role || !email) {
    return res.status(400).json({ message: 'Username, password, email, and role are required' });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Get signup bonus from settings
    let bonus = 50; // Default fallback
    try {
        const settings = await Settings.findOne();
        if (settings && settings.promo && settings.promo.enabled) {
            bonus = settings.promo.bonusAmount;
        }
    } catch (e) {
        console.error('Failed to fetch settings for signup bonus:', e);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      email,
      tokenBalance: bonus
    });

    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error: any) {
    console.error('Registration error details:', JSON.stringify(error, null, 2));
    console.error('Registration error stack:', error.stack);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val: any) => val.message);
        return res.status(400).json({ message: 'Validation Error', errors: messages });
    }

    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: user.select('-password') });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
