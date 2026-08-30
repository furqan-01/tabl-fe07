import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartPage from '@/app/cart/page';
import * as cartLib from '@/lib/cart';

vi.mock('@/lib/cart', () => ({
  getStoredCart: vi.fn(),
  getStoredTable: vi.fn().mockReturnValue('4'),
  setStoredTable: vi.fn(),
  updateCartQuantity: vi.fn(),
  clearCart: vi.fn(),
}));

describe('Cart Checkout & Order Flow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart state with CTA to browse menu', () => {
    vi.mocked(cartLib.getStoredCart).mockReturnValue([]);

    render(<CartPage />);

    expect(screen.getByRole('heading', { name: /Your cart is empty/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Menu & Combos/i })).toBeInTheDocument();
  });

  it('renders cart items, calculates totals, and places order successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(cartLib.getStoredCart).mockReturnValue([
      {
        id: 'cart-1',
        name: 'Gourmet Truffle Fries',
        price: 500,
        quantity: 2,
      },
    ]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        order: {
          id: 'ord-9988',
          tableNumber: '4',
          totalAmount: 1050,
          status: 'pending',
          createdAt: new Date().toISOString(),
          items: [{ name: 'Gourmet Truffle Fries', quantity: 2, price: 500 }],
        },
      }),
    });
    global.fetch = mockFetch;

    render(<CartPage />);

    expect(screen.getByRole('heading', { name: 'Gourmet Truffle Fries' })).toBeInTheDocument();
    expect(screen.getByText('Selected Dishes (1)')).toBeInTheDocument();
    expect(screen.getByText('Rs. 500 each')).toBeInTheDocument();

    // Submit Order
    const placeOrderBtn = screen.getByRole('button', { name: /Confirm Table 4 Order/i });
    await user.click(placeOrderBtn);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/orders',
      expect.objectContaining({
        method: 'POST',
      })
    );

    // Confirm Order Placed Screen
    expect(await screen.findByRole('heading', { name: /Order Confirmed for Table 4!/i })).toBeInTheDocument();
    expect(screen.getByText(/D-9988/i)).toBeInTheDocument();
    expect(cartLib.clearCart).toHaveBeenCalled();
  });
});
