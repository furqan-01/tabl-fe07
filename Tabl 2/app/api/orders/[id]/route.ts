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
    const { status, paymentStatus } = body;

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updatePayload.status = status;
    if (paymentStatus) updatePayload.paymentStatus = paymentStatus;

    const db = getAdminDb();
    if (db) {
      const docRef = db.collection('orders').doc(id);
      await docRef.update(updatePayload);
    }

    return NextResponse.json({
      success: true,
      message: `Order ${id} updated to status ${status || paymentStatus}.`,
      data: { id, ...updatePayload },
    });
  } catch (error: any) {
    console.error('[API /api/orders/[id] PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
