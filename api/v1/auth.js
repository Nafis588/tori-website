import { connectToDatabase, sha256, applyRateLimit } from '../db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const allowed = await applyRateLimit(req, res, 'auth_get_hash', 20, 15 * 60 * 1000);
    if (!allowed) return;

    const defaultHash = process.env.DEFAULT_ADMIN_HASH || '240eb518567520e1a5392cf99a80b06b99f30b91cb34d284a7e289bf598912e8';
    return res.status(200).json({ defaultHash });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('auth');
    
    const action = typeof req.body.action === 'string' ? req.body.action : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const oldPassword = typeof req.body.oldPassword === 'string' ? req.body.oldPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';

    if (action === 'verify') {
      const allowed = await applyRateLimit(req, res, 'auth_verify', 10, 15 * 60 * 1000);
      if (!allowed) return;

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
      const allowed = await applyRateLimit(req, res, 'auth_change', 5, 15 * 60 * 1000);
      if (!allowed) return;

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

    const allowed = await applyRateLimit(req, res, 'auth_invalid', 20, 15 * 60 * 1000);
    if (!allowed) return;

    return res.status(400).json({ error: 'Invalid action. Use "verify" or "change".' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
