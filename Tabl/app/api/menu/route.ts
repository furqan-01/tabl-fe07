import { NextResponse } from 'next/server';
import { getLiveRestaurantContext } from '@/lib/firebase/menuService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await getLiveRestaurantContext();
    return NextResponse.json({
      success: true,
      items: context.menu,
      data: context.menu,
      count: context.menu.length,
      deals: context.deals,
      info: context.info,
    });
  } catch (error: any) {
    console.error('[API /api/menu GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve menu items',
      },
      { status: 500 }
    );
  }
}
