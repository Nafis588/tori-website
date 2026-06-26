import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'tori_sushi';

let cachedClient = null;
let cachedDb = null;

// Default seed data
const DEFAULT_MENU = [
  { id: 'm1', title: 'Tempura Crab Maki', description: 'Crispy prawn tempura, premium crab meat, topped with spicy mayo and teriyaki sauce (8 pieces).', price: 1090, category: 'Maki Rolls', imageType: 'crab' },
  { id: 'm2', title: 'Torikatsu Cheese Maki', description: 'Crispy chicken katsu, fresh cucumber pickles, premium cream cheese, rolled in toasted sesame (8 pieces).', price: 990, category: 'Maki Rolls', imageType: 'cheese' },
  { id: 'm3', title: 'Enshin Tuna Roll', description: 'Spicy cucumber pickles and fresh, top-grade marinated tuna, finished with a touch of wasabi glaze (8 pieces).', price: 1190, category: 'Maki Rolls', imageType: 'tuna' },
  { id: 'm4', title: 'Sake Avocado Maki', description: 'Rich, melt-in-your-mouth fresh Norwegian salmon paired with creamy avocado and toasted seaweed (8 pieces).', price: 1290, category: 'Maki Rolls', imageType: 'salmon' },
  { id: 'm5', title: 'Hikari Bulgogi Roll', description: 'Premium tender Bulgogi beef, homemade spicy kimchi, and green onions wrapped in seasoned sushi rice (8 pieces).', price: 1090, category: 'Maki Rolls', imageType: 'bulgogi' },
  { id: 'm6', title: 'Tori Combo Box 1', description: '12 pieces: 2 pieces of each signature sushi roll + 2 crispy prawn tempura, served with ginger & wasabi.', price: 1590, category: 'Combos', imageType: 'combo' },
  { id: 'm7', title: 'Tori Combo Box 2', description: '18 pieces: 3 pieces of each signature sushi roll + 3 crispy prawn tempura, perfect for sharing.', price: 2290, category: 'Combos', imageType: 'combo' },
  { id: 'm8', title: 'Prawn Tempura', description: 'Extra crispy golden-fried prawn tempura, served hot with custom dipping sauce (1 piece).', price: 110, category: 'Add-ons', imageType: 'tempura' },
  { id: 'm9', title: 'Crab Nigiri', description: 'Hand-pressed sushi rice topped with premium sweet crab meat and a touch of nori (1 piece).', price: 100, category: 'Add-ons', imageType: 'nigiri' }
];

const DEFAULT_CARDS = [
  { token: 'TORI-777', status: 'approved', customerName: 'John Doe', customerPhone: '01712345678', customerEmail: 'john.doe@gmail.com', orderCount: 4, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), registeredAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), approvedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString() },
  { token: 'TORI-888', status: 'new', customerName: '', customerPhone: '', customerEmail: '', orderCount: 1, createdAt: new Date().toISOString() },
  { token: 'TORI-999', status: 'pending', customerName: 'Jane Smith', customerPhone: '01812345678', customerEmail: 'jane.smith@yahoo.com', orderCount: 1, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), registeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

const DEFAULT_SETTINGS = {
  name: 'Tori Sushi',
  phone: '01805748464',
  address: 'Road 11, Banani, Dhaka, Bangladesh',
  hours: 'Tuesday - Sunday: 12:00 PM - 10:30 PM (Monday Closed)',
  bannerText: '✨ Order 9 times, get your 10th Sushi Roll FREE! Ask for your loyalty token in-store! ✨',
  stampRewardLimit: 10,
  heroTitle: 'Crafting Art on a Bamboo Mat',
  heroSubtitle: 'At Tori Sushi, every roll represents a balance of traditions and modern culinary fusion. Fresh ingredients, exquisite flavors, and premium presentation await you.',
  aboutTitle: 'The Tori Sushi Story',
  aboutText: 'Tori Sushi brings the finest Japanese culinary experience to Dhaka, Bangladesh. We believe that sushi is more than just food—it is an art form. Our chefs combine time-honored traditional techniques with bold modern fusions to create memorable dining moments. From crunchy prawn tempuras to fresh salmon cuts, each plate is crafted with utmost dedication to quality, flavor, and elegance.',
  facebookUrl: 'https://www.facebook.com/tori.sushi.bd',
  instagramUrl: 'https://www.instagram.com/tori.sushi.bd'
};


// Compute SHA-256 on server side
async function sha256(message) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(message).digest('hex');
}

export async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  // Seed collections if empty
  await seedIfEmpty(db);

  // Ensure TTL index on rate_limit_logs (delete after 15 minutes / 900 seconds)
  await db.collection('rate_limit_logs').createIndex(
    { timestamp: 1 },
    { expireAfterSeconds: 900 }
  ).catch(err => console.error('Error creating TTL index:', err));

  return db;
}

async function seedIfEmpty(db) {
  const menuCount = await db.collection('menu').countDocuments();
  if (menuCount === 0) {
    await db.collection('menu').insertMany(DEFAULT_MENU);
  }

  const cardsCount = await db.collection('cards').countDocuments();
  if (cardsCount === 0) {
    await db.collection('cards').insertMany(DEFAULT_CARDS);
  }

  const settingsDoc = await db.collection('settings').findOne({ _configId: 'main' });
  if (!settingsDoc) {
    await db.collection('settings').insertOne({ _configId: 'main', ...DEFAULT_SETTINGS });
  }

  const authDoc = await db.collection('auth').findOne({ _configId: 'admin' });
  if (!authDoc) {
    // Hash of "tori123"
    const hash = await sha256('tori123');
    await db.collection('auth').insertOne({ _configId: 'admin', passwordHash: hash });
  }
}

export { sha256 };

export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return '';
  }
  return trimmed;
}

export function validateAndSanitizeImage(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  
  if (trimmed.toLowerCase().startsWith('data:')) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/i);
    if (!match) {
      return '';
    }
    
    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];
    
    // 1. Strict MIME type validation
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return '';
    }
    
    // 2. Strict size validation (3MB limit in Base64 representation)
    const approxSizeBytes = (base64Data.length * 3) / 4;
    const maxSizeBytes = 3 * 1024 * 1024; // 3MB
    if (approxSizeBytes > maxSizeBytes) {
      return '';
    }
    
    // 3. Strict base64 format validation
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(base64Data)) {
      return '';
    }
    
    return trimmed;
  }
  
  return sanitizeUrl(trimmed);
}


export async function applyRateLimit(req, res, actionName, limit = 60, windowMs = 60000) {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             (req.socket && req.socket.remoteAddress) || 
             '127.0.0.1';

  try {
    const db = await connectToDatabase();
    const collection = db.collection('rate_limit_logs');

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    const requestCount = await collection.countDocuments({
      ip,
      action: actionName,
      timestamp: { $gte: windowStart }
    });

    if (requestCount >= limit) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return false;
    }

    await collection.insertOne({
      ip,
      action: actionName,
      timestamp: now
    });

    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true;
  }
}
