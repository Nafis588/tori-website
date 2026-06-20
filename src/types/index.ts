export interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageType: 'crab' | 'tuna' | 'cheese' | 'salmon' | 'bulgogi' | 'combo' | 'tempura' | 'nigiri';
}

export interface LoyaltyCard {
  token: string;
  status: 'new' | 'pending' | 'approved';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderCount: number;
  createdAt: string;
  registeredAt?: string;
  approvedAt?: string;
}

export interface RestaurantSettings {
  name: string;
  phone: string;
  address: string;
  hours: string;
  bannerText: string;
  stampRewardLimit: number;
}
