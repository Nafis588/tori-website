import type { MenuItem, LoyaltyCard, RestaurantSettings } from '../types';

// ============================================================
// API-first data layer with localStorage fallback.
// On Vercel: API routes connect to MongoDB.
// During local dev (npm run dev): falls back to localStorage.
// ============================================================

const MENU_KEY = 'tori_sushi_menu_items';
const CARDS_KEY = 'tori_sushi_loyalty_cards';
const SETTINGS_KEY = 'tori_sushi_restaurant_settings';
const ADMIN_HASH_KEY = 'tori_sushi_admin_hash';

// Default data for localStorage fallback seeding
const DEFAULT_MENU: MenuItem[] = [
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

const DEFAULT_CARDS: LoyaltyCard[] = [
  { token: 'TORI-777', status: 'approved', customerName: 'John Doe', customerPhone: '01712345678', customerEmail: 'john.doe@gmail.com', orderCount: 4, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), registeredAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), approvedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString() },
  { token: 'TORI-888', status: 'new', customerName: '', customerPhone: '', customerEmail: '', orderCount: 1, createdAt: new Date().toISOString() },
  { token: 'TORI-999', status: 'pending', customerName: 'Jane Smith', customerPhone: '01812345678', customerEmail: 'jane.smith@yahoo.com', orderCount: 1, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), registeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

const DEFAULT_SETTINGS: RestaurantSettings = {
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

// Helper: SHA-256 hashing using Web Crypto API (browser)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize localStorage with defaults (for fallback mode only)
function initializeLocalStorage() {
  if (!localStorage.getItem(MENU_KEY)) {
    localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU));
  }
  if (!localStorage.getItem(CARDS_KEY)) {
    localStorage.setItem(CARDS_KEY, JSON.stringify(DEFAULT_CARDS));
  }
  const existingSettingsStr = localStorage.getItem(SETTINGS_KEY);
  if (!existingSettingsStr) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } else {
    try {
      const parsed = JSON.parse(existingSettingsStr);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    } catch {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }
  }
}

// =================== MENU ===================

export async function getMenu(): Promise<MenuItem[]> {
  try {
    const res = await fetch('/api/v1/menu');
    if (res.ok) return await res.json();
  } catch { /* API not available */ }
  // Fallback
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem(MENU_KEY) || '[]');
}

export async function saveMenu(menu: MenuItem[]): Promise<void> {
  try {
    const res = await fetch('/api/v1/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: menu })
    });
    if (res.ok) return;
  } catch { /* API not available */ }
  // Fallback
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
}

// =================== CARDS ===================

export async function getCards(): Promise<LoyaltyCard[]> {
  try {
    const res = await fetch('/api/v1/cards');
    if (res.ok) return await res.json();
  } catch { /* API not available */ }
  // Fallback
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
}

export async function saveCards(cards: LoyaltyCard[]): Promise<void> {
  try {
    const res = await fetch('/api/v1/cards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards })
    });
    if (res.ok) return;
  } catch { /* API not available */ }
  // Fallback
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

// =================== SETTINGS ===================

export async function getSettings(): Promise<RestaurantSettings> {
  try {
    const res = await fetch('/api/v1/settings');
    if (res.ok) {
      const data = await res.json();
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_SETTINGS, ...data };
    }
  } catch { /* API not available */ }
  // Fallback
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
}

export async function saveSettings(settings: RestaurantSettings): Promise<void> {
  try {
    const res = await fetch('/api/v1/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) return;
  } catch { /* API not available */ }
  // Fallback
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// =================== AUTH ===================

export async function preloadDefaultHash(): Promise<void> {
  if (localStorage.getItem(ADMIN_HASH_KEY)) return;
  try {
    const res = await fetch('/api/v1/auth');
    if (res.ok) {
      const data = await res.json();
      if (data.defaultHash) {
        localStorage.setItem(ADMIN_HASH_KEY, data.defaultHash);
      }
    }
  } catch { /* API not available */ }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', password })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.valid === true) {
        // Cache the validated password hash locally for offline fallback
        const inputHash = await sha256(password);
        localStorage.setItem(ADMIN_HASH_KEY, inputHash);
        return true;
      }
      return false;
    }
  } catch { /* API not available */ }
  // Fallback: verify locally
  initializeLocalStorage();
  const storedHash = localStorage.getItem(ADMIN_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = await sha256(password);
  return storedHash === inputHash;
}

export async function changeAdminPassword(oldPass: string, newPass: string): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change', oldPassword: oldPass, newPassword: newPass })
    });
    if (res.ok) {
      const data = await res.json();
      return data.success === true;
    }
  } catch { /* API not available */ }
  // Fallback: change locally
  const verified = await verifyAdminPassword(oldPass);
  if (!verified) return false;
  const newHash = await sha256(newPass);
  localStorage.setItem(ADMIN_HASH_KEY, newHash);
  return true;
}
