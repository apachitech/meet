import db from './db.js';

export const getModels = async (req, res) => {
    await db.read();
    const models = db.data.users
        .filter((u) => u.role === 'model')
        .map((u) => ({ id: u.id, username: u.username })); // Don't return passwords/balances
    res.json(models);
};
