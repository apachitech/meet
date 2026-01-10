import { User } from './models/User.js';

interface BattleState {
  roomName: string;
  challenger: string; // Username (usually Model)
  opponent: string;   // Username (Guest)
  startTime: number;
  duration: number; // in seconds
  scoreChallenger: number;
  scoreOpponent: number;
  status: 'pending' | 'active' | 'finished';
}

const battles: Record<string, BattleState> = {}; // Key: roomName

export const getBattleStatus = (req: any, res: any) => {
  const { roomName } = req.query;
  const battle = battles[roomName as string];
  
  if (!battle) {
    return res.json({ isActive: false });
  }

  // Check if expired
  if (battle.status === 'active') {
    const elapsed = (Date.now() - battle.startTime) / 1000;
    if (elapsed > battle.duration) {
      battle.status = 'finished';
    }
  }

  res.json({
    isActive: battle.status === 'active',
    ...battle
  });
};

export const startBattle = async (req: any, res: any) => {
  const { roomName, opponentUsername, duration = 120 } = req.body;
  const challengerUsername = req.user.username; // Assumed set by middleware

  // Simple validation: Only room owner can start? Or anyone?
  // Let's assume Room Owner (Model) starts it against a Guest.
  
  // Reset if exists
  battles[roomName] = {
    roomName,
    challenger: challengerUsername,
    opponent: opponentUsername,
    startTime: Date.now(),
    duration: duration,
    scoreChallenger: 0,
    scoreOpponent: 0,
    status: 'active'
  };

  res.json({ success: true, battle: battles[roomName] });
};

export const stopBattle = (req: any, res: any) => {
    const { roomName } = req.body;
    if (battles[roomName]) {
        battles[roomName].status = 'finished';
        delete battles[roomName]; // Or keep for history?
    }
    res.json({ success: true });
};

// Internal function to update score from gifts
export const updateBattleScore = (roomName: string, recipientId: string, amount: number) => {
    const battle = battles[roomName];
    if (!battle || battle.status !== 'active') return;

    // We need to map recipientId (Mongo ID) to username to check who got the points
    // This is tricky without an async DB call inside this sync flow or caching.
    // For now, let's assume the frontend passes the *recipientUsername* in the gift call? 
    // Or we fetch the user in `sendGift` anyway.
    
    // Better: pass the recipient USERNAME from `sendGift`.
};

export const updateBattleScoreByUsername = (roomName: string, recipientUsername: string, amount: number) => {
    const battle = battles[roomName];
    if (!battle || battle.status !== 'active') return;

    if (battle.challenger === recipientUsername) {
        battle.scoreChallenger += amount;
    } else if (battle.opponent === recipientUsername) {
        battle.scoreOpponent += amount;
    }
};
