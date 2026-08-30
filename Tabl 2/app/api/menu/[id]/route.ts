import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const db = getAdminDb();
    if (!db) {
      // Return simulated success if Firestore is not connected
      return NextResponse.json({
        success: true,
        message: `Updated item ${id} in local session mode.`,
        data: { id, ...body },
      });
    }

    const docRef = db.collection('menu').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      // If doc doesn't exist, create it with provided data
      await docRef.set({
        ...body,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await docRef.update({
        ...body,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Menu item ${id} updated successfully.`,
      data: { id, ...body },
    });
  } catch (error: any) {
    console.error('[API /api/menu/[id] PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getAdminDb();

    if (db) {
      await db.collection('menu').doc(id).delete();
    }

    return NextResponse.json({
      success: true,
      message: `Menu item ${id} removed successfully.`,
    });
  } catch (error: any) {
    console.error('[API /api/menu/[id] DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
