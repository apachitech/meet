import jwt from 'jsonwebtoken';
import { User } from './models/User.js';

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const secret = process.env.JWT_SECRET || '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96';
  console.log('[Auth] Verifying token with secret:', secret.substring(0, 10) + '...');
  
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      console.error('[Auth] Token verification failed:', err.message);
      console.error('[Auth] Token:', token.substring(0, 20) + '...');
      return res.status(403).json({ message: 'Token verification failed: ' + err.message });
    }
    console.log('[Auth] Token verified for user:', user?.userId);
    req.user = user;
    next();
  });
};

// Lenient authentication for payment endpoints - logs in but doesn't block on error
export const authenticateTokenForPayment = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[Payment Auth] No token provided - returning 400');
    return res.status(400).json({ message: 'Authentication required for payment' });
  }

  const secret = process.env.JWT_SECRET || '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96';
  
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      console.error('[Payment Auth] Token verification failed:', err.message);
      // For payment, we still fail but with a clearer error
      return res.status(401).json({ 
        message: 'Invalid authentication token. Please log in again.',
        error: err.message
      });
    }
    console.log('[Payment Auth] Token verified for user:', user?.userId);
    req.user = user;
    next();
  });
};

export const authenticateAdmin = (req: any, res: any, next: any) => {
    authenticateToken(req, res, async () => {
        try {
            // Double check user role from DB
            const user = await User.findById(req.user.userId);
            if (!user) {
                console.log(`[Admin Auth] User ${req.user.userId} not found in DB`);
                return res.status(403).json({ message: 'User not found' });
            }
            
            if (user.role !== 'admin') {
                console.log(`[Admin Auth] Access denied. User ${user.username} has role: ${user.role}`);
                return res.status(403).json({ message: 'Access Denied: Admin role required' });
            }
            
            next();
        } catch (error) {
            console.error('[Admin Auth] Error verifying admin status:', error);
            return res.status(500).json({ message: 'Internal Server Error during auth' });
        }
    });
};
