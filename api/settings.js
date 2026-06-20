import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('settings');

    if (req.method === 'GET') {
      const doc = await collection.findOne({ _configId: 'main' });
      if (doc) {
        const { _id, _configId, ...settings } = doc;
        return res.status(200).json(settings);
      }
      return res.status(200).json({});
    }

    if (req.method === 'PUT') {
      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings object is required' });
      }
      // Remove any stale fields that shouldn't be stored
      delete settings._id;
      delete settings._configId;

      await collection.updateOne(
        { _configId: 'main' },
        { $set: settings },
        { upsert: true }
      );
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
