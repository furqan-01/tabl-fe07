export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  ingredients: string[];
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: number; // 0 (Mild/None), 1 (Low), 2 (Medium), 3 (Hot)
  isAvailable: boolean;
}

export interface DealOrPromotion {
  id: string;
  title: string;
  description: string;
  discountedPrice?: number;
  conditions?: string;
  isActive: boolean;
}

export interface RestaurantInfo {
  name: string;
  openingHours: string;
  orderingWorkflow: string;
  tablePolicy: string;
  currency?: string;
  address?: string;
  phone?: string;
}

export interface RestaurantContext {
  menu: MenuItem[];
  deals: DealOrPromotion[];
  info: RestaurantInfo;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  spiceLevel?: number;
}

export interface OrderRequest {
  tableNumber: string | number;
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
}

export interface OrderRecord {
  id: string;
  tableNumber: string | number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pay-at-waiter' | 'paid' | 'unpaid';
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  specialInstructions?: string;
}
