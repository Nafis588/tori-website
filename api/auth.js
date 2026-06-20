import { connectToDatabase, sha256 } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('auth');
    const { action, password, oldPassword, newPassword } = req.body;

    if (action === 'verify') {
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const authDoc = await collection.findOne({ _configId: 'admin' });
      if (!authDoc) {
        return res.status(500).json({ error: 'Auth not initialized' });
      }

      const inputHash = await sha256(password);
      const isValid = authDoc.passwordHash === inputHash;
      return res.status(200).json({ valid: isValid });
    }

    if (action === 'change') {
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old and new passwords are required' });
      }

      const authDoc = await collection.findOne({ _configId: 'admin' });
      if (!authDoc) {
        return res.status(500).json({ error: 'Auth not initialized' });
      }

      const oldHash = await sha256(oldPassword);
      if (authDoc.passwordHash !== oldHash) {
        return res.status(200).json({ success: false, error: 'Old password is incorrect' });
      }

      const newHash = await sha256(newPassword);
      await collection.updateOne(
        { _configId: 'admin' },
        { $set: { passwordHash: newHash } }
      );
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action. Use "verify" or "change".' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
