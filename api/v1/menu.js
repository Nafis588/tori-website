import { connectToDatabase, validateAndSanitizeImage, applyRateLimit } from '../db.js';

function sanitizeMenuItem(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    id: typeof item.id === 'string' ? item.id.trim() : '',
    title: typeof item.title === 'string' ? item.title.trim() : '',
    description: typeof item.description === 'string' ? item.description.trim() : '',
    price: typeof item.price === 'number' && !isNaN(item.price) ? Math.max(0, item.price) : 0,
    category: typeof item.category === 'string' ? item.category.trim() : '',
    imageType: ['crab', 'tuna', 'cheese', 'salmon', 'bulgogi', 'combo', 'tempura', 'nigiri'].includes(item.imageType) ? item.imageType : 'crab',
    imageUrl: typeof item.imageUrl === 'string' ? validateAndSanitizeImage(item.imageUrl) : undefined
  };
}

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('menu');

    if (req.method === 'GET') {
      const allowed = await applyRateLimit(req, res, 'menu_get', 60, 60000);
      if (!allowed) return;

      const items = await collection.find({}).toArray();
      // Remove MongoDB _id field for frontend compatibility
      const cleaned = items.map(({ _id, ...rest }) => rest);
      return res.status(200).json(cleaned);
    }

    if (req.method === 'PUT') {
      const allowed = await applyRateLimit(req, res, 'menu_put', 20, 60000);
      if (!allowed) return;

      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items array is required' });
      }
      
      const sanitizedItems = items.map(sanitizeMenuItem).filter(Boolean);
      
      // Replace all menu items
      await collection.deleteMany({});
      if (sanitizedItems.length > 0) {
        await collection.insertMany(sanitizedItems);
      }
      return res.status(200).json({ success: true });
    }

    const allowed = await applyRateLimit(req, res, 'menu_invalid', 30, 60000);
    if (!allowed) return;

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Menu API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
