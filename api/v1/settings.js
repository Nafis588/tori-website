import { connectToDatabase, sanitizeUrl, validateAndSanitizeImage, applyRateLimit } from '../db.js';

function sanitizeSettings(settings) {
  if (!settings || typeof settings !== 'object') return {};
  return {
    name: typeof settings.name === 'string' ? settings.name.trim() : '',
    phone: typeof settings.phone === 'string' ? settings.phone.trim() : '',
    address: typeof settings.address === 'string' ? settings.address.trim() : '',
    hours: typeof settings.hours === 'string' ? settings.hours.trim() : '',
    bannerText: typeof settings.bannerText === 'string' ? settings.bannerText.trim() : '',
    stampRewardLimit: typeof settings.stampRewardLimit === 'number' && !isNaN(settings.stampRewardLimit) ? Math.max(1, settings.stampRewardLimit) : 10,
    heroTitle: typeof settings.heroTitle === 'string' ? settings.heroTitle.trim() : '',
    heroSubtitle: typeof settings.heroSubtitle === 'string' ? settings.heroSubtitle.trim() : '',
    aboutTitle: typeof settings.aboutTitle === 'string' ? settings.aboutTitle.trim() : '',
    aboutText: typeof settings.aboutText === 'string' ? settings.aboutText.trim() : '',
    facebookUrl: typeof settings.facebookUrl === 'string' ? sanitizeUrl(settings.facebookUrl) : '',
    instagramUrl: typeof settings.instagramUrl === 'string' ? sanitizeUrl(settings.instagramUrl) : '',
    logoUrl: typeof settings.logoUrl === 'string' ? validateAndSanitizeImage(settings.logoUrl) : '',
    heroImageUrl: typeof settings.heroImageUrl === 'string' ? validateAndSanitizeImage(settings.heroImageUrl) : '',
    aboutImageUrl: typeof settings.aboutImageUrl === 'string' ? validateAndSanitizeImage(settings.aboutImageUrl) : ''
  };
}

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('settings');

    if (req.method === 'GET') {
      const allowed = await applyRateLimit(req, res, 'settings_get', 60, 60000);
      if (!allowed) return;

      const doc = await collection.findOne({ _configId: 'main' });
      if (doc) {
        const { _id, _configId, ...settings } = doc;
        return res.status(200).json(settings);
      }
      return res.status(200).json({});
    }

    if (req.method === 'PUT') {
      const allowed = await applyRateLimit(req, res, 'settings_put', 20, 60000);
      if (!allowed) return;

      const settings = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings object is required' });
      }

      const sanitized = sanitizeSettings(settings);

      await collection.updateOne(
        { _configId: 'main' },
        { $set: sanitized },
        { upsert: true }
      );
      return res.status(200).json({ success: true });
    }

    const allowed = await applyRateLimit(req, res, 'settings_invalid', 30, 60000);
    if (!allowed) return;

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
