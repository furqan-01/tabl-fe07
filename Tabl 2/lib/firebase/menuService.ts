import { getAdminDb } from './admin';
import { getFirebaseClientDb } from './client';
import { collection, getDocs, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { MenuItem, DealOrPromotion, RestaurantInfo, RestaurantContext, OrderRecord } from '@/types/restaurant';

// Default Fallback Restaurant Context in case Firestore is unreachable or empty
export const FALLBACK_RESTAURANT_INFO: RestaurantInfo = {
  name: 'Tabl Modern Bistro',
  openingHours: 'Monday - Sunday: 11:00 AM - 11:00 PM',
  orderingWorkflow:
    '1. Browse the live menu or ask the AI assistant for recommendations based on taste, dietary restrictions, or budget.\n2. Add items to your cart.\n3. Submit your order with your Table Number.\n4. Your order is sent directly to the kitchen (KDS).\n5. Savor your meal and pay directly to the waiter at your table when done.',
  tablePolicy:
    'Order directly from your table. No advance online payment required — payment is collected by your waiter after your meal (Cash / Card / Contactless).',
  currency: 'Rs.',
  address: '12 Gourmet Boulevard, Downtown Culinary District',
  phone: '+1 (555) 234-8225',
};

export const FALLBACK_DEALS: DealOrPromotion[] = [
  {
    id: 'deal-lunch-combo',
    title: 'Lunch Express Combo',
    description: 'Any Gourmet Smash Burger + Truffle Fries + Sparkling Iced Tea',
    discountedPrice: 1250,
    conditions: 'Valid Mon - Fri, 11:00 AM to 3:30 PM',
    isActive: true,
  },
  {
    id: 'deal-chef-duo',
    title: 'Duo Feast Deal',
    description: '2 Mains + 1 Appetizer + 2 Refreshments with a 15% flat discount',
    discountedPrice: 2400,
    conditions: 'Available all day for dine-in tables',
    isActive: true,
  },
  {
    id: 'deal-sweet-end',
    title: 'Dessert Pairing',
    description: 'Add a Matcha Lava Cake to any Main course for only Rs. 450',
    discountedPrice: 450,
    conditions: 'Valid with purchase of any Main dish',
    isActive: true,
  },
];

export const FALLBACK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-1',
    name: 'Truffle Smash Burger',
    category: 'Mains',
    price: 850,
    description: 'Double smashed beef patties, aged cheddar, caramelized onions, and black truffle aioli on a toasted brioche bun.',
    ingredients: ['Beef Chuck', 'Aged Cheddar', 'Caramelized Onion', 'Truffle Aioli', 'Brioche Bun'],
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 1,
    isAvailable: true,
  },
  {
    id: 'item-2',
    name: 'Crispy Chicken Bao Buns',
    category: 'Appetizers',
    price: 650,
    description: 'Tender buttermilk fried chicken tossed in sweet chili glaze, pickled cucumbers, and spicy sriracha mayo in steamed lotus buns.',
    ingredients: ['Chicken Thigh', 'Steamed Bao', 'Pickled Cucumber', 'Sriracha Mayo', 'Scallions'],
    allergens: ['Gluten', 'Eggs', 'Soy'],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 2,
    isAvailable: true,
  },
  {
    id: 'item-3',
    name: 'Artisan Margherita Flatbread',
    category: 'Mains',
    price: 750,
    description: 'Hand-stretched sourdough flatbread, San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic sweet basil.',
    ingredients: ['Sourdough Crust', 'San Marzano Tomato', 'Buffalo Mozzarella', 'Fresh Basil', 'EVOO'],
    allergens: ['Dairy', 'Gluten'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 0,
    isAvailable: true,
  },
  {
    id: 'item-4',
    name: 'Parmesan Truffle Fries',
    category: 'Sides',
    price: 450,
    description: 'Crispy skin-on russet fries tossed in white truffle oil, grated 24-month Parmigiano-Reggiano, and fresh rosemary.',
    ingredients: ['Russet Potatoes', 'Truffle Oil', 'Parmigiano-Reggiano', 'Rosemary', 'Garlic Aioli'],
    allergens: ['Dairy', 'Eggs'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    spiceLevel: 0,
    isAvailable: false, // Out of stock example for live kitchen inventory demonstration
  },
  {
    id: 'item-5',
    name: 'Wild Berry Sparkling Cooler',
    category: 'Beverages',
    price: 280,
    description: 'Cold-brewed Ceylon black tea infused with wild berry compote, fresh mint sprigs, and sparkling mineral water.',
    ingredients: ['Black Tea', 'Wild Berries', 'Mint', 'Sparkling Water', 'Organic Agave'],
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    spiceLevel: 0,
    isAvailable: true,
  },
  {
    id: 'item-6',
    name: 'Matcha Lava Cake',
    category: 'Desserts',
    price: 550,
    description: 'Warm Uji green tea molten cake with a flowing white chocolate core, served with Madagascar vanilla bean gelato.',
    ingredients: ['Ceremonial Matcha', 'White Chocolate', 'Vanilla Gelato', 'Butter', 'Eggs', 'Flour'],
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 0,
    isAvailable: true,
  },
  {
    id: 'item-7',
    name: 'Spicy Firecracker Wings',
    category: 'Appetizers',
    price: 680,
    description: 'Crispy jumbo wings drenched in ghost pepper honey glaze, served with cool buttermilk ranch dipping sauce.',
    ingredients: ['Chicken Wings', 'Ghost Pepper Sauce', 'Honey', 'Buttermilk', 'Garlic'],
    allergens: ['Dairy'],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    spiceLevel: 3,
    isAvailable: true,
  },
  {
    id: 'item-8',
    name: 'Roasted Harvest Buddha Bowl',
    category: 'Mains',
    price: 720,
    description: 'Tri-color quinoa, roasted butternut squash, avocado slices, kale crisps, and creamy tahini lemon dressing.',
    ingredients: ['Quinoa', 'Butternut Squash', 'Avocado', 'Baby Kale', 'Tahini', 'Pomegranate Seeds'],
    allergens: ['Sesame'],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    spiceLevel: 0,
    isAvailable: true,
  },
  {
    id: 'item-9',
    name: 'Creamy Truffle Wild Mushroom Fettuccine',
    category: 'Mains',
    price: 890,
    description: 'Fresh egg fettuccine tossed with sautéed porcini and shiitake mushrooms, black truffle cream, and shaved pecorino.',
    ingredients: ['Fresh Fettuccine', 'Porcini Mushrooms', 'Shiitake', 'Heavy Cream', 'Black Truffle Paste', 'Pecorino'],
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 0,
    isAvailable: true,
  },
  {
    id: 'item-10',
    name: 'Smoked Jalapeño Poppers',
    category: 'Appetizers',
    price: 520,
    description: 'Crisp panko-crusted fresh jalapeños stuffed with smoked cream cheese, cheddar, and cilantro lime dip.',
    ingredients: ['Jalapeños', 'Cream Cheese', 'Smoked Cheddar', 'Panko Crumbs', 'Cilantro'],
    allergens: ['Dairy', 'Gluten'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 2,
    isAvailable: true,
  },
  {
    id: 'item-11',
    name: 'Warm Cinnamon Churros',
    category: 'Desserts',
    price: 420,
    description: 'Freshly fried Spanish pastry dusted in Ceylon cinnamon sugar, served with warm Belgian dark chocolate dipping ganache.',
    ingredients: ['Churro Dough', 'Cinnamon Sugar', 'Belgian Dark Chocolate', 'Cream'],
    allergens: ['Dairy', 'Gluten'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 0,
    isAvailable: true,
  },
  {
    id: 'item-12',
    name: 'Yuzu Dragonfruit Refresher',
    category: 'Beverages',
    price: 320,
    description: 'Fresh Japanese yuzu juice shaken with diced red dragonfruit, coconut water, and a touch of wild wildflower honey.',
    ingredients: ['Yuzu Juice', 'Red Dragonfruit', 'Coconut Water', 'Wild Honey', 'Crushed Ice'],
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    spiceLevel: 0,
    isAvailable: true,
  },
];

/**
 * Fetches live restaurant context from Firestore:
 * - 'menu' collection
 * - 'deals' collection (where isActive == true)
 * - 'settings' collection (document 'info' or 'restaurant')
 * Falls back safely to pre-defined items on network/DB failure.
 */
export async function getLiveRestaurantContext(): Promise<RestaurantContext> {
  const fetchWithTimeout = async (): Promise<RestaurantContext> => {
    const clientDb = getFirebaseClientDb();
    if (!clientDb) return { menu: FALLBACK_MENU_ITEMS, deals: FALLBACK_DEALS, info: FALLBACK_RESTAURANT_INFO };

    // 1. Fetch Menu Collection via Client SDK
    const menuSnap = await getDocs(collection(clientDb, 'menu'));
    const menu: MenuItem[] = menuSnap.empty
      ? FALLBACK_MENU_ITEMS
      : menuSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || 'Unnamed Item',
            category: data.category || 'Mains',
            price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
            description: data.description || '',
            ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
            allergens: Array.isArray(data.allergens) ? data.allergens : [],
            isVegetarian: Boolean(data.isVegetarian),
            isVegan: Boolean(data.isVegan),
            isGlutenFree: Boolean(data.isGlutenFree),
            spiceLevel: typeof data.spiceLevel === 'number' ? data.spiceLevel : 0,
            isAvailable: data.isAvailable !== false,
          } as MenuItem;
        });

    // 2. Fetch Deals
    const dealsSnap = await getDocs(collection(clientDb, 'deals'));
    const deals: DealOrPromotion[] = dealsSnap.empty
      ? FALLBACK_DEALS
      : dealsSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || '',
              description: data.description || '',
              discountedPrice: data.discountedPrice ? Number(data.discountedPrice) : undefined,
              conditions: data.conditions || '',
              isActive: data.isActive !== false,
            } as DealOrPromotion;
          })
          .filter((d) => d.isActive);

    // 3. Fetch Info
    const infoSnap = await getDoc(firestoreDoc(clientDb, 'settings', 'info'));
    const infoData = infoSnap.exists() ? infoSnap.data() : {};
    const info: RestaurantInfo = {
      name: infoData.name || FALLBACK_RESTAURANT_INFO.name,
      openingHours: infoData.openingHours || FALLBACK_RESTAURANT_INFO.openingHours,
      orderingWorkflow: infoData.orderingWorkflow || FALLBACK_RESTAURANT_INFO.orderingWorkflow,
      tablePolicy: infoData.tablePolicy || FALLBACK_RESTAURANT_INFO.tablePolicy,
      currency: infoData.currency || FALLBACK_RESTAURANT_INFO.currency,
      address: infoData.address || FALLBACK_RESTAURANT_INFO.address,
      phone: infoData.phone || FALLBACK_RESTAURANT_INFO.phone,
    };

    return {
      menu: menu.length > 0 ? menu : FALLBACK_MENU_ITEMS,
      deals: deals.length > 0 ? deals : FALLBACK_DEALS,
      info,
    };
  };

  try {
    const timeoutPromise = new Promise<RestaurantContext>((resolve) => {
      setTimeout(() => {
        resolve({
          menu: FALLBACK_MENU_ITEMS,
          deals: FALLBACK_DEALS,
          info: FALLBACK_RESTAURANT_INFO,
        });
      }, 1500);
    });

    return await Promise.race([fetchWithTimeout(), timeoutPromise]);
  } catch (clientErr: any) {
    console.warn('[menuService] Client SDK fetch failed, using fallback:', clientErr?.message);
    return {
      menu: FALLBACK_MENU_ITEMS,
      deals: FALLBACK_DEALS,
      info: FALLBACK_RESTAURANT_INFO,
    };
  }
}

/**
 * Seeds default menu items, deals, and restaurant info into Firestore.
 */
export async function seedDatabase(): Promise<{ success: boolean; count: number; message: string }> {
  const db = getAdminDb();
  if (!db) {
    return {
      success: false,
      count: 0,
      message: 'Firestore connection not initialized. Please verify Firebase credentials.',
    };
  }

  try {
    const batch = db.batch();

    // 1. Seed Menu Items
    for (const item of FALLBACK_MENU_ITEMS) {
      const docRef = db.collection('menu').doc(item.id);
      batch.set(docRef, item, { merge: true });
    }

    // 2. Seed Deals
    for (const deal of FALLBACK_DEALS) {
      const docRef = db.collection('deals').doc(deal.id);
      batch.set(docRef, deal, { merge: true });
    }

    // 3. Seed Restaurant Info
    const infoRef = db.collection('settings').doc('info');
    batch.set(infoRef, FALLBACK_RESTAURANT_INFO, { merge: true });

    await batch.commit();

    return {
      success: true,
      count: FALLBACK_MENU_ITEMS.length + FALLBACK_DEALS.length + 1,
      message: `Successfully seeded ${FALLBACK_MENU_ITEMS.length} dishes, ${FALLBACK_DEALS.length} deals, and restaurant info to Firestore.`,
    };
  } catch (error: any) {
    console.error('[menuService] Error seeding database:', error);
    return {
      success: false,
      count: 0,
      message: error.message || 'Failed to seed database.',
    };
  }
}

