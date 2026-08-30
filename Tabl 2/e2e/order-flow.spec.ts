import { test, expect } from '@playwright/test';

test.describe('End-to-End Customer Order Flow with AI Concierge', () => {
  test('customer loads menu, consults AI concierge, adds dish to cart, and verifies cart count', async ({
    page,
  }) => {
    // 1. Mock the /api/chat route for deterministic, isolated AI responses
    await page.route('/api/chat', async (route) => {
      // Return a simulated AI SDK UI stream chunk with queryMenu tool call and dish recommendation
      const mockStreamBody = `0:{"role":"assistant","content":""}\n` +
        `9:{"toolCallId":"call-e2e-1","toolName":"queryMenu","args":{"isVegetarian":true,"maxPrice":1000}}\n` +
        `a:{"toolCallId":"call-e2e-1","result":{"found":true,"count":1,"items":[{"id":"dish-e2e-1","name":"Truffle Mushroom Risotto","category":"Mains","price":850,"description":"Creamy arborio rice with black truffle oil.","isVegetarian":true,"isVegan":false,"isGlutenFree":true,"spiceLevel":1}]}}\n` +
        `0:"I found our famous **Truffle Mushroom Risotto** within your preferences!"\n` +
        `d:{"finishReason":"stop"}\n`;

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
        body: mockStreamBody,
      });
    });

    // 2. Load the Table Menu page
    await page.goto('/menu');
    await expect(page).toHaveURL(/.*menu/);

    // Verify Menu page heading & content loaded
    await expect(page.getByRole('heading', { name: /Table Menu & Ordering/i })).toBeVisible();

    // 3. Open the AI Concierge Drawer / Modal
    const openConciergeBtn = page.getByRole('button', { name: /Open AI Menu Concierge/i });
    await expect(openConciergeBtn).toBeVisible();
    await openConciergeBtn.click();

    // Verify AI Concierge container is open
    await expect(page.getByRole('heading', { name: /Tabl AI Concierge/i })).toBeVisible();

    // 4. Type query into the chat input
    const chatInput = page.getByPlaceholderText(/Ask about dishes, allergens, diet, budget/i);
    await expect(chatInput).toBeVisible();
    await chatInput.fill('Suggest a vegetarian dish under Rs. 1000');

    // Click the Send button
    const sendButton = page.getByRole('button', { name: /Send question to Concierge/i });
    await sendButton.click();

    // 5. Verify generative dish card appears in chat
    const dishCardHeading = page.getByRole('heading', { name: /Truffle Mushroom Risotto/i });
    await expect(dishCardHeading).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Rs. 850')).toBeVisible();

    // 6. Click "Add to Cart" on the generative dish card
    const addToCartBtn = page.getByRole('button', { name: /\+ Add to Cart/i });
    await expect(addToCartBtn).toBeVisible();
    await addToCartBtn.click();

    // Verify inline feedback "Added to Table Cart!"
    await expect(page.getByText(/Added to Table Cart!/i)).toBeVisible();

    // 7. Verify cart indicator updates
    const viewCartLink = page.getByRole('link', { name: /View Table Cart/i });
    await expect(viewCartLink).toBeVisible();

    // Navigate to Cart page to verify item persistence
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Your Table Cart/i })).toBeVisible();
    await expect(page.getByText('Truffle Mushroom Risotto')).toBeVisible();
    await expect(page.getByText('Rs. 850')).toBeVisible();
  });
});
