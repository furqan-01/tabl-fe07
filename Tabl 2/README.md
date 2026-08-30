<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Tabl — Smart Menu Kiosk & Contactless Ordering System

A contactless dining application featuring real-time menu management, Kitchen Display System (KDS), and an AI-driven culinary concierge with Generative UI and tool calling.

View your app in AI Studio: https://ai.studio/apps/749bd8ab-4a4b-47e6-ad05-10c381be1e6b

---

## Smart Menu Assistant Tool Contract

The Tabl Concierge utilizes server-side tool calling powered by the Vercel AI SDK (`ai`) and Gemini models to query the live restaurant inventory and render interactive Generative UI cards (`<DishCardGrid />`) directly in the dining chat drawer.

### 1. Tool Identification
- **Tool Name**: `queryMenu`
- **File Location**: `lib/ai/tools.ts` (consumed in `app/api/chat/route.ts`)
- **Description**: Search and filter the live restaurant menu catalog by category, budget (max price in Rs.), dietary preferences (vegetarian, vegan, gluten-free), spice levels, or keyword search. Returns verified in-stock dishes for Generative UI rendering.

### 2. Trigger Conditions
The AI model invokes `queryMenu` when a dining guest:
- Requests dish or meal recommendations (e.g., *"What do you recommend for dinner?"*)
- Specifies a budget or price constraint (e.g., *"Show me dishes under Rs. 1000"*, *"Budget dinner for two"*)
- Inquires about dietary needs (e.g., *"Vegetarian options"*, *"Do you have anything 100% vegan?"*, *"Gluten-free dishes"*)
- Asks for spice preferences (e.g., *"Mild dishes with no heat"*, *"Hot spicy food"*)
- Filters by course or category (e.g., *"Show Appetizers"*, *"What desserts do you have?"*)
- Searches for specific ingredients or keywords (e.g., *"Truffle"*, *"Burger"*, *"Chicken"*)

### 3. Input Zod Schema Definition
```typescript
import { z } from 'zod';

export const queryMenuSchema = z.object({
  category: z
    .string()
    .optional()
    .describe('Dish category to filter by (e.g. "Mains", "Appetizers", "Beverages", "Desserts", "Sides")'),
  maxPrice: z
    .number()
    .optional()
    .describe('Maximum budget limit in PKR / Rs. (e.g. 1000 for dishes <= Rs. 1000)'),
  isVegetarian: z
    .boolean()
    .optional()
    .describe('Filter strictly for vegetarian-friendly dishes'),
  isVegan: z
    .boolean()
    .optional()
    .describe('Filter strictly for 100% plant-based vegan dishes'),
  isGlutenFree: z
    .boolean()
    .optional()
    .describe('Filter strictly for gluten-free dishes'),
  maxSpiceLevel: z
    .number()
    .min(0)
    .max(3)
    .optional()
    .describe('Maximum acceptable spice level: 0 (Mild/None), 1 (Low), 2 (Medium), 3 (Hot)'),
  query: z
    .string()
    .optional()
    .describe('Keyword search term to match against dish names, descriptions, or ingredients'),
});
```

### 4. Return Shape Structure
```typescript
export interface QueryMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  spiceLevel: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
}

export interface QueryMenuOutput {
  found: boolean;
  count: number;
  items: QueryMenuItem[];
  message?: string;
  appliedFilters: {
    category?: string;
    maxPrice?: number;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    maxSpiceLevel?: number;
    query?: string;
  };
}
```

### 5. Client 4-State Generative UI Lifecycle
The client interface in `components/chat/ChatContainer.tsx` handles tool execution through a 4-state lifecycle machine:
1. **State 1: Input Streaming (`partial-call`)**: Displays a shimmering status indicator (`🔍 Tabl Concierge is searching kitchen catalog...`).
2. **State 2: Input Available (`call`)**: Renders active filter badges selected by the model with a live querying indicator.
3. **State 3: Output Available (`result` with items)**: Renders interactive `<DishCardGrid />` component with dish details, dietary tags, and functional `+ Add to Cart` buttons.
4. **State 4: Output Error / Empty (`result` with 0 items / `found: false`)**: Displays an amber alert banner explaining that no matching in-stock items were found, accompanied by "Reset Filters" and "Browse Full Menu" action triggers.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`) in `.env.local`
3. Run the application:
   ```bash
   npm run dev
   ```

---

## Deploying to Netlify

When deploying this Next.js App Router application to Netlify:

1. **Add Environment Variables in Netlify**:
   - In your Netlify dashboard, navigate to **Site configuration > Environment variables**.
   - Click **Add a variable** and add:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: *(Your Google Gemini API Key from AI Studio)*
   - *(Optional for live Firestore database syncing)*:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`

2. **Trigger a Deploy**:
   - Re-deploy the site (or push to your Git branch).
   - Netlify will use `@netlify/plugin-nextjs` and configure the streaming API route (`/api/chat`) as a serverless function with `force-dynamic` support.

