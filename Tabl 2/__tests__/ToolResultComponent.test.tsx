import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatContainer from '@/components/chat/ChatContainer';
import * as aiSdkReact from '@ai-sdk/react';
import { createMockUseChat } from '@/test-utils/mock-ai-sdk';
import * as cartLib from '@/lib/cart';

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

vi.mock('@/lib/cart', () => ({
  addToCart: vi.fn(),
  getStoredCart: vi.fn().mockReturnValue([]),
  getStoredTable: vi.fn().mockReturnValue('4'),
  setStoredTable: vi.fn(),
}));

describe('Generative UI & Tool Result Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Generative Dish Card Output with dietary tags
  it('renders generative dish cards with name, price, dietary badges, and description', () => {
    vi.mocked(aiSdkReact.useChat).mockReturnValue(
      createMockUseChat({
        status: 'ready',
        messages: [
          {
            id: 'msg-tool-1',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: 'Here is what our chef prepared for you:',
              },
              {
                type: 'tool-queryMenu',
                toolCallId: 'call-1',
                state: 'output-available',
                input: { isVegetarian: true, maxPrice: 1000 },
                output: {
                  found: true,
                  count: 1,
                  items: [
                    {
                      id: 'dish-101',
                      name: 'Smoked Paneer Burger',
                      category: 'Burgers',
                      price: 750,
                      description: 'Charcoal grilled cottage cheese patty with spicy sauce.',
                      isVegetarian: true,
                      isVegan: false,
                      isGlutenFree: false,
                      spiceLevel: 2,
                      allergens: ['Dairy', 'Gluten'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      }) as any
    );

    render(<ChatContainer />);

    // Accessible verification
    expect(screen.getByRole('heading', { name: /Smoked Paneer Burger/i })).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 750/i)).toBeInTheDocument();
    expect(screen.getByText(/Charcoal grilled cottage cheese patty/i)).toBeInTheDocument();
    expect(screen.getByText(/🌱 Vegetarian/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Add to Cart/i })).toBeInTheDocument();
  });

  // Interactive 'Add to Cart' callback execution
  it('triggers addToCart callback and feedback when clicking "+ Add to Cart"', async () => {
    const user = userEvent.setup();

    vi.mocked(aiSdkReact.useChat).mockReturnValue(
      createMockUseChat({
        status: 'ready',
        messages: [
          {
            id: 'msg-tool-2',
            role: 'assistant',
            parts: [
              {
                type: 'tool-queryMenu',
                toolCallId: 'call-2',
                state: 'output-available',
                output: {
                  found: true,
                  count: 1,
                  items: [
                    {
                      id: 'dish-102',
                      name: 'Avocado Quinoa Salad',
                      category: 'Salads',
                      price: 850,
                      description: 'Fresh Haas avocado with organic quinoa.',
                      isVegetarian: true,
                      isVegan: true,
                      isGlutenFree: true,
                    },
                  ],
                },
              },
            ],
          },
        ],
      }) as any
    );

    render(<ChatContainer />);

    const addToCartButton = screen.getByRole('button', { name: /\+ Add to Cart/i });
    expect(addToCartButton).toBeInTheDocument();

    await user.click(addToCartButton);

    expect(cartLib.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dish-102',
        name: 'Avocado Quinoa Salad',
        price: 850,
      }),
      1
    );

    // Feedback state confirmation
    expect(await screen.findByText(/Added to Table Cart!/i)).toBeInTheDocument();
  });

  // Generative Empty Search State
  it('renders generative empty state banner when no items match filters', () => {
    vi.mocked(aiSdkReact.useChat).mockReturnValue(
      createMockUseChat({
        status: 'ready',
        messages: [
          {
            id: 'msg-tool-3',
            role: 'assistant',
            parts: [
              {
                type: 'tool-queryMenu',
                toolCallId: 'call-3',
                state: 'output-available',
                input: { isVegan: true, maxPrice: 100 },
                output: {
                  found: false,
                  count: 0,
                  message: 'No active dishes matched under Rs. 100 with Vegan tag.',
                  items: [],
                },
              },
            ],
          },
        ],
      }) as any
    );

    render(<ChatContainer />);

    expect(screen.getByRole('heading', { name: /No matching in-stock dishes found/i })).toBeInTheDocument();
    expect(screen.getByText(/No active dishes matched under Rs\. 100/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Filters/i })).toBeInTheDocument();
  });
});
