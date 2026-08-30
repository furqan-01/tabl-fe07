import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuPage from '@/app/menu/page';
import * as cartLib from '@/lib/cart';

vi.mock('@/components/chat/ChatContainer', () => ({
  default: () => <div>Mocked AI Concierge Chat Container</div>,
}));

vi.mock('@/lib/cart', () => ({
  addToCart: vi.fn(),
  getStoredCart: vi.fn().mockReturnValue([]),
  getStoredTable: vi.fn().mockReturnValue('4'),
  setStoredTable: vi.fn(),
}));

describe('Menu Catalog & Cart Interaction Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'm1',
            name: 'Classic Margherita Pizza',
            category: 'Pizzas',
            price: 1200,
            description: 'San Marzano tomatoes, fresh mozzarella, basil.',
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false,
            spiceLevel: 0,
            isAvailable: true,
          },
          {
            id: 'm2',
            name: 'Spicy Dragon Noodles',
            category: 'Noodles',
            price: 950,
            description: 'Wok-tossed noodles with chili garlic paste.',
            isVegetarian: true,
            isVegan: true,
            isGlutenFree: false,
            spiceLevel: 3,
            isAvailable: true,
          },
        ],
        deals: [],
        info: { name: 'Tabl Bistro', currency: 'Rs.' },
      }),
    });
  });

  it('renders menu items and filters by search query and category', async () => {
    const user = userEvent.setup();

    render(<MenuPage />);

    // Wait for items to load
    expect(await screen.findByText('Classic Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('Spicy Dragon Noodles')).toBeInTheDocument();

    // Test Search Filter
    const searchInput = screen.getByPlaceholderText(/Search dishes, ingredients, or allergens/i);
    await user.type(searchInput, 'Margherita');

    expect(screen.getByText('Classic Margherita Pizza')).toBeInTheDocument();
    expect(screen.queryByText('Spicy Dragon Noodles')).not.toBeInTheDocument();
  });

  it('adds an item to cart and updates table number selection', async () => {
    const user = userEvent.setup();

    render(<MenuPage />);

    expect(await screen.findByText('Classic Margherita Pizza')).toBeInTheDocument();

    // Add item to cart
    const addButtons = screen.getAllByRole('button', { name: /Add to Cart/i });
    await user.click(addButtons[0]);

    expect(cartLib.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'm1',
        name: 'Classic Margherita Pizza',
        price: 1200,
      }),
      1
    );

    // Switch Table Number
    const tableSelect = screen.getByRole('combobox');
    await user.selectOptions(tableSelect, '7');
    expect(cartLib.setStoredTable).toHaveBeenCalledWith('7');
  });
});
