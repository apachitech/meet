declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; role: 'user' | 'model' };
    }
  }
}

export {};
