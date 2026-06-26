import { connectToDatabase, applyRateLimit } from '../db.js';

function sanitizeCard(card) {
  if (!card || typeof card !== 'object') return null;
  const sanitized = {
    token: typeof card.token === 'string' ? card.token.toUpperCase().trim() : '',
    status: ['new', 'pending', 'approved'].includes(card.status) ? card.status : 'new',
    customerName: typeof card.customerName === 'string' ? card.customerName.trim() : '',
    customerPhone: typeof card.customerPhone === 'string' ? card.customerPhone.trim() : '',
    customerEmail: typeof card.customerEmail === 'string' ? card.customerEmail.trim() : '',
    orderCount: typeof card.orderCount === 'number' && !isNaN(card.orderCount) ? Math.max(0, card.orderCount) : 0,
    createdAt: typeof card.createdAt === 'string' ? card.createdAt : new Date().toISOString()
  };

  if (typeof card.registeredAt === 'string') {
    sanitized.registeredAt = card.registeredAt;
  }
  if (typeof card.approvedAt === 'string') {
    sanitized.approvedAt = card.approvedAt;
  }

  return sanitized;
}

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('cards');

    if (req.method === 'GET') {
      // Coerce to string to prevent NoSQL injection
      const token = req.query && typeof req.query.token === 'string' ? req.query.token : '';
      
      if (token) {
        const allowed = await applyRateLimit(req, res, 'cards_get_token', 30, 60000);
        if (!allowed) return;

        const card = await collection.findOne({ token: token.toUpperCase().trim() });
        if (card) {
          const { _id, ...cleaned } = card;
          return res.status(200).json(cleaned);
        }
        return res.status(404).json({ error: 'Card not found' });
      }

      const allowed = await applyRateLimit(req, res, 'cards_get_all', 60, 60000);
      if (!allowed) return;

      const items = await collection.find({}).toArray();
      const cleaned = items.map(({ _id, ...rest }) => rest);
      return res.status(200).json(cleaned);
    }

    if (req.method === 'PUT') {
      const allowed = await applyRateLimit(req, res, 'cards_put', 20, 60000);
      if (!allowed) return;

      const { cards } = req.body;
      if (!Array.isArray(cards)) {
        return res.status(400).json({ error: 'cards array is required' });
      }
      
      const sanitizedCards = cards.map(sanitizeCard).filter(Boolean);
      
      // Replace all cards
      await collection.deleteMany({});
      if (sanitizedCards.length > 0) {
        await collection.insertMany(sanitizedCards);
      }
      return res.status(200).json({ success: true });
    }

    const allowed = await applyRateLimit(req, res, 'cards_invalid', 30, 60000);
    if (!allowed) return;

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Cards API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
