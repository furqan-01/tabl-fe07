import { MenuItem, OrderItem } from '@/types/restaurant';

export interface CartItem extends OrderItem {
  isAvailable?: boolean;
}

const CART_STORAGE_KEY = 'tabl_cart_items';
const TABLE_STORAGE_KEY = 'tabl_current_table';

export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('tabl_cart_updated'));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
}

export function addToCart(item: MenuItem, quantity: number = 1, notes?: string): void {
  const current = getStoredCart();
  const existingIndex = current.findIndex(
    (c) => c.id === item.id && (c.notes || '') === (notes || '')
  );

  if (existingIndex > -1) {
    current[existingIndex].quantity += quantity;
  } else {
    current.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      notes,
      spiceLevel: item.spiceLevel,
      isAvailable: item.isAvailable,
    });
  }

  saveStoredCart(current);
}

export function updateCartQuantity(itemId: string, quantity: number): void {
  const current = getStoredCart();
  if (quantity <= 0) {
    const filtered = current.filter((c) => c.id !== itemId);
    saveStoredCart(filtered);
  } else {
    const item = current.find((c) => c.id === itemId);
    if (item) {
      item.quantity = quantity;
      saveStoredCart(current);
    }
  }
}

export function clearCart(): void {
  saveStoredCart([]);
}

export function getStoredTable(): string {
  if (typeof window === 'undefined') return '4';
  return localStorage.getItem(TABLE_STORAGE_KEY) || '4';
}

export function setStoredTable(tableNumber: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TABLE_STORAGE_KEY, tableNumber);
}
