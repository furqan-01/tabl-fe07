import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseClientDb } from '@/lib/firebase/client';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { FALLBACK_MENU_ITEMS, FALLBACK_DEALS, FALLBACK_RESTAURANT_INFO } from '@/lib/firebase/menuService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleSeed();
}

export async function POST(req: NextRequest) {
  return handleSeed();
}

async function handleSeed() {
  try {
    const db = getFirebaseClientDb();
    const batch = writeBatch(db);

    // 1. Seed Menu Items
    for (const item of FALLBACK_MENU_ITEMS) {
      const docRef = doc(db, 'menu', item.id);
      batch.set(docRef, item, { merge: true });
    }

    // 2. Seed Deals
    for (const deal of FALLBACK_DEALS) {
      const docRef = doc(db, 'deals', deal.id);
      batch.set(docRef, deal, { merge: true });
    }

    // 3. Seed Restaurant Info
    const infoRef = doc(db, 'settings', 'info');
    batch.set(infoRef, FALLBACK_RESTAURANT_INFO, { merge: true });

    await batch.commit();

    return NextResponse.json({
      success: true,
      count: FALLBACK_MENU_ITEMS.length + FALLBACK_DEALS.length + 1,
      message: `Successfully seeded ${FALLBACK_MENU_ITEMS.length} dishes, ${FALLBACK_DEALS.length} deals, and restaurant info directly to Firestore!`,
    });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Seeding error' },
      { status: 500 }
    );
  }
}
