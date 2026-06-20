import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('menu');

    if (req.method === 'GET') {
      const items = await collection.find({}).toArray();
      // Remove MongoDB _id field for frontend compatibility
      const cleaned = items.map(({ _id, ...rest }) => rest);
      return res.status(200).json(cleaned);
    }

    if (req.method === 'PUT') {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items array is required' });
      }
      // Replace all menu items
      await collection.deleteMany({});
      if (items.length > 0) {
        await collection.insertMany(items);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Menu API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
