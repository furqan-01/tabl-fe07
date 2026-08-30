import { tool } from 'ai';
import { z } from 'zod';
import { getLiveRestaurantContext } from '@/lib/firebase/menuService';
import { MenuItem } from '@/types/restaurant';

/**
 * Zod schema defining all filter parameters accepted by the queryMenu tool.
 */
export const queryMenuSchema = z.object({
  category: z
    .string()
    .optional()
    .describe(
      'Filter by menu category (e.g. Starters, Mains, Burgers, Pizzas, Desserts, Beverages, Combos)'
    ),
  maxPrice: z
    .number()
    .optional()
    .describe('Filter dishes priced less than or equal to this amount in PKR (Rs.)'),
  isVegetarian: z
    .boolean()
    .optional()
    .describe('Filter strictly for vegetarian friendly dishes'),
  isVegan: z
    .boolean()
    .optional()
    .describe('Filter strictly for 100% plant-based / vegan dishes'),
  isGlutenFree: z
    .boolean()
    .optional()
    .describe('Filter strictly for gluten-free dishes'),
  maxSpiceLevel: z
    .number()
    .min(0)
    .max(3)
    .optional()
    .describe('Maximum spice tolerance: 0 (Mild/None), 1 (Mild), 2 (Medium), 3 (Hot)'),
  query: z
    .string()
    .optional()
    .describe(
      'Keyword search to match against dish names, descriptions, or ingredients (e.g. "cheese", "burger", "coffee")'
    ),
});

export type QueryMenuInput = z.infer<typeof queryMenuSchema>;

export interface QueryMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  allergens?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: number;
}

export interface QueryMenuOutput {
  found: boolean;
  count: number;
  message?: string;
  items: QueryMenuItem[];
}

/**
 * Server-side AI SDK Tool: queryMenu
 *
 * Executes real-time querying against the live restaurant Firestore / memory catalog.
 * Returns structured dish objects for Generative UI rendering in ChatContainer.
 */
export const queryMenu = tool({
  description:
    'Search and filter the live restaurant menu catalog by category, budget (max price in Rs.), dietary preferences (vegetarian, vegan, gluten-free), spice levels, or keyword search. Returns verified in-stock dishes for Generative UI rendering.',
  inputSchema: queryMenuSchema,
  execute: async ({
    category,
    maxPrice,
    isVegetarian,
    isVegan,
    isGlutenFree,
    maxSpiceLevel,
    query,
  }: QueryMenuInput): Promise<QueryMenuOutput> => {
    try {
      const context = await getLiveRestaurantContext();
      let matchedItems = (context.menu || []).filter((item) => item.isAvailable !== false);

      // Category filter (case-insensitive substring or exact match)
      if (category && category.trim()) {
        const catLower = category.toLowerCase().trim();
        matchedItems = matchedItems.filter(
          (item) => item.category && item.category.toLowerCase().includes(catLower)
        );
      }

      // Max price filter (PKR / Rs.)
      if (typeof maxPrice === 'number' && maxPrice > 0) {
        matchedItems = matchedItems.filter((item) => item.price <= maxPrice);
      }

      // Dietary preference filters
      if (isVegetarian) {
        matchedItems = matchedItems.filter((item) => Boolean(item.isVegetarian || item.isVegan));
      }
      if (isVegan) {
        matchedItems = matchedItems.filter((item) => Boolean(item.isVegan));
      }
      if (isGlutenFree) {
        matchedItems = matchedItems.filter((item) => Boolean(item.isGlutenFree));
      }

      // Spice level filter (0: Mild/None, 1: Mild, 2: Medium, 3: Hot)
      if (typeof maxSpiceLevel === 'number') {
        matchedItems = matchedItems.filter((item) => (item.spiceLevel ?? 0) <= maxSpiceLevel);
      }

      // Keyword query matching across name, description, and ingredients
      if (query && query.trim()) {
        const qLower = query.toLowerCase().trim();
        matchedItems = matchedItems.filter((item) => {
          const nameMatch = item.name.toLowerCase().includes(qLower);
          const descMatch = item.description?.toLowerCase().includes(qLower);
          const ingMatch = item.ingredients?.some((ing) => ing.toLowerCase().includes(qLower));
          const catMatch = item.category?.toLowerCase().includes(qLower);
          return nameMatch || descMatch || ingMatch || catMatch;
        });
      }

      // Limit results to top 6 most relevant items to avoid UI overwhelm
      const topItems = matchedItems.slice(0, 6);

      const items: QueryMenuItem[] = topItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description || '',
        allergens: item.allergens || [],
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        isGlutenFree: item.isGlutenFree,
        spiceLevel: item.spiceLevel ?? 0,
      }));

      if (items.length === 0) {
        return {
          found: false,
          count: 0,
          message:
            'No in-stock dishes matched your exact search filters. Try adjusting price, category, or dietary criteria.',
          items: [],
        };
      }

      return {
        found: true,
        count: items.length,
        items,
      };
    } catch (error) {
      console.error('[queryMenu tool execution error]:', error);
      return {
        found: false,
        count: 0,
        message: 'Unable to query the kitchen catalog at this moment. Please try again.',
        items: [],
      };
    }
  },
});
