import { MenuItem, LoyaltyCard, RestaurantSettings } from '../types';

const MENU_KEY = 'tori_sushi_menu_items';
const CARDS_KEY = 'tori_sushi_loyalty_cards';
const SETTINGS_KEY = 'tori_sushi_restaurant_settings';
const ADMIN_HASH_KEY = 'tori_sushi_admin_hash';

// Default menu items based on Tori Sushi's real Facebook page menu
const DEFAULT_MENU: MenuItem[] = [
  {
    id: 'm1',
    title: 'Tempura Crab Maki',
    description: 'Crispy prawn tempura, premium crab meat, topped with spicy mayo and teriyaki sauce (8 pieces).',
    price: 1090,
    category: 'Maki Rolls',
    imageType: 'crab'
  },
  {
    id: 'm2',
    title: 'Torikatsu Cheese Maki',
    description: 'Crispy chicken katsu, fresh cucumber pickles, premium cream cheese, rolled in toasted sesame (8 pieces).',
    price: 990,
    category: 'Maki Rolls',
    imageType: 'cheese'
  },
  {
    id: 'm3',
    title: 'Enshin Tuna Roll',
    description: 'Spicy cucumber pickles and fresh, top-grade marinated tuna, finished with a touch of wasabi glaze (8 pieces).',
    price: 1190,
    category: 'Maki Rolls',
    imageType: 'tuna'
  },
  {
    id: 'm4',
    title: 'Sake Avocado Maki',
    description: 'Rich, melt-in-your-mouth fresh Norwegian salmon paired with creamy avocado and toasted seaweed (8 pieces).',
    price: 1290,
    category: 'Maki Rolls',
    imageType: 'salmon'
  },
  {
    id: 'm5',
    title: 'Hikari Bulgogi Roll',
    description: 'Premium tender Bulgogi beef, homemade spicy kimchi, and green onions wrapped in seasoned sushi rice (8 pieces).',
    price: 1090,
    category: 'Maki Rolls',
    imageType: 'bulgogi'
  },
  {
    id: 'm6',
    title: 'Tori Combo Box 1',
    description: '12 pieces: 2 pieces of each signature sushi roll + 2 crispy prawn tempura, served with ginger & wasabi.',
    price: 1590,
    category: 'Combos',
    imageType: 'combo'
  },
  {
    id: 'm7',
    title: 'Tori Combo Box 2',
    description: '18 pieces: 3 pieces of each signature sushi roll + 3 crispy prawn tempura, perfect for sharing.',
    price: 2290,
    category: 'Combos',
    imageType: 'combo'
  },
  {
    id: 'm8',
    title: 'Prawn Tempura',
    description: 'Extra crispy golden-fried prawn tempura, served hot with custom dipping sauce (1 piece).',
    price: 110,
    category: 'Add-ons',
    imageType: 'tempura'
  },
  {
    id: 'm9',
    title: 'Crab Nigiri',
    description: 'Hand-pressed sushi rice topped with premium sweet crab meat and a touch of nori (1 piece).',
    price: 100,
    category: 'Add-ons',
    imageType: 'nigiri'
  }
];

// Pre-seeded Loyalty Tokens in different states:
// - TORI-777: Active & Approved customer (John Doe) with 4 orders
// - TORI-888: New, unregistered card (1 order, needs signup)
// - TORI-999: Pending customer (Jane Smith) awaiting owner approval
const DEFAULT_CARDS: LoyaltyCard[] = [
  {
    token: 'TORI-777',
    status: 'approved',
    customerName: 'John Doe',
    customerPhone: '01712345678',
    customerEmail: 'john.doe@gmail.com',
    orderCount: 4,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    token: 'TORI-888',
    status: 'new',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    orderCount: 1,
    createdAt: new Date().toISOString()
  },
  {
    token: 'TORI-999',
    status: 'pending',
    customerName: 'Jane Smith',
    customerPhone: '01812345678',
    customerEmail: 'jane.smith@yahoo.com',
    orderCount: 1,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_SETTINGS: RestaurantSettings = {
  name: 'Tori Sushi',
  phone: '01805748464',
  address: 'Road 11, Banani, Dhaka, Bangladesh',
  hours: 'Tuesday - Sunday: 12:00 PM - 10:30 PM (Monday Closed)',
  bannerText: '✨ Order 9 times, get your 10th Sushi Roll FREE! Ask for your loyalty token in-store! ✨',
  stampRewardLimit: 10
};

// SHA-256 hash of "admin123" to store as default password hash
const DEFAULT_ADMIN_HASH = '240eb518567520e1a5392cf99a80b06b99f30b91cb34d284a7e289bf598912e8';

// Simple SHA-256 helper using browser Web Crypto API
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function initializeDatabase() {
  if (!localStorage.getItem(MENU_KEY)) {
    localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU));
  }
  if (!localStorage.getItem(CARDS_KEY)) {
    localStorage.setItem(CARDS_KEY, JSON.stringify(DEFAULT_CARDS));
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(ADMIN_HASH_KEY)) {
    localStorage.setItem(ADMIN_HASH_KEY, DEFAULT_ADMIN_HASH);
  }
}

export function getMenu(): MenuItem[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(MENU_KEY) || '[]');
}

export function saveMenu(menu: MenuItem[]) {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
}

export function getCards(): LoyaltyCard[] {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
}

export function saveCards(cards: LoyaltyCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function getSettings(): RestaurantSettings {
  initializeDatabase();
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
}

export function saveSettings(settings: RestaurantSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  initializeDatabase();
  const storedHash = localStorage.getItem(ADMIN_HASH_KEY) || DEFAULT_ADMIN_HASH;
  const inputHash = await sha256(password);
  return storedHash === inputHash;
}

export async function changeAdminPassword(oldPass: string, newPass: string): Promise<boolean> {
  const verified = await verifyAdminPassword(oldPass);
  if (!verified) return false;
  const newHash = await sha256(newPass);
  localStorage.setItem(ADMIN_HASH_KEY, newHash);
  return true;
}
