import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96';

export const register = async (req: Request, res: Response) => {
  const { username, password, role, email } = req.body;

  if (!username || !password || !role || !email) {
    return res.status(400).json({ message: 'Username, password, email, and role are required' });
  }

  await db.read();
  db.data ||= { users: [] };
  const existingUser = db.data.users.find((user) => user.username === username);

  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: randomUUID(), username, password: hashedPassword, role, email, tokenBalance: 0 };

  db.data.users.push(newUser);
  await db.write();

  res.status(201).json({ message: 'User registered successfully' });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  await db.read();
  db.data ||= { users: [] };
  const user = db.data.users.find((user) => user.username === username);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
};
