import { connectToDatabase } from './db.js';

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('cards');

    if (req.method === 'GET') {
      // Optional token query param for public lookup
      const { token } = req.query || {};
      
      if (token) {
        const card = await collection.findOne({ token: token.toUpperCase() });
        if (card) {
          const { _id, ...cleaned } = card;
          return res.status(200).json(cleaned);
        }
        return res.status(404).json({ error: 'Card not found' });
      }

      const items = await collection.find({}).toArray();
      const cleaned = items.map(({ _id, ...rest }) => rest);
      return res.status(200).json(cleaned);
    }

    if (req.method === 'PUT') {
      const { cards } = req.body;
      if (!Array.isArray(cards)) {
        return res.status(400).json({ error: 'cards array is required' });
      }
      // Replace all cards
      await collection.deleteMany({});
      if (cards.length > 0) {
        await collection.insertMany(cards);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Cards API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
