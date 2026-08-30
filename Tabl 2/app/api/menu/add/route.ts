import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { MenuItem } from '@/types/restaurant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      category,
      price,
      description,
      ingredients,
      allergens,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spiceLevel,
      isAvailable,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error: "name" and "price" are required fields.',
        },
        { status: 400 }
      );
    }

    const newItem: Omit<MenuItem, 'id'> = {
      name: String(name).trim(),
      category: category ? String(category).trim() : 'Mains',
      price: Number(price) || 0,
      description: description ? String(description).trim() : '',
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      allergens: Array.isArray(allergens) ? allergens : [],
      isVegetarian: Boolean(isVegetarian),
      isVegan: Boolean(isVegan),
      isGlutenFree: Boolean(isGlutenFree),
      spiceLevel: typeof spiceLevel === 'number' ? Math.min(Math.max(spiceLevel, 0), 3) : 0,
      isAvailable: isAvailable !== false,
    };

    const db = getAdminDb();

    if (!db) {
      // Return accepted mock confirmation if DB credentials aren't wired yet
      const simulatedId = `item-sim-${Date.now()}`;
      return NextResponse.json(
        {
          success: true,
          message: 'Item registered (Simulated in local fallback mode - configure FIREBASE_PROJECT_ID for live persistence).',
          data: {
            id: simulatedId,
            ...newItem,
          },
        },
        { status: 201 }
      );
    }

    const docRef = await db.collection('menu').add({
      ...newItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Menu item created successfully in Firestore.',
        data: {
          id: docRef.id,
          ...newItem,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/menu/add POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add menu item',
      },
      { status: 500 }
    );
  }
}
