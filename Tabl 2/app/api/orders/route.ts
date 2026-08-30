import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import type { Query } from 'firebase-admin/firestore';
import { OrderItem, OrderRecord } from '@/types/restaurant';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableNumber, items, customerName, customerPhone, specialInstructions } = body;

    if (!tableNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'tableNumber is required to place a table order.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order must contain at least one item.',
        },
        { status: 400 }
      );
    }

    // Clean and validate items
    const sanitizedItems: OrderItem[] = items.map((item: any) => ({
      id: String(item.id || `item-${Date.now()}`),
      name: String(item.name || 'Unnamed Dish'),
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
      notes: item.notes ? String(item.notes) : undefined,
      spiceLevel: typeof item.spiceLevel === 'number' ? item.spiceLevel : undefined,
    }));

    // Calculate subtotal, estimated tax (e.g. 5%), and total
    const subtotal = sanitizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax;

    const orderData: Omit<OrderRecord, 'id'> = {
      tableNumber: String(tableNumber).trim(),
      items: sanitizedItems,
      subtotal,
      tax,
      total,
      status: 'pending',
      paymentStatus: 'pay-at-waiter', // Direct policy: Pay waiter at table
      createdAt: new Date().toISOString(),
      customerName: customerName ? String(customerName).trim() : undefined,
      customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      specialInstructions: specialInstructions ? String(specialInstructions).trim() : undefined,
    };

    const db = getAdminDb();

    if (!db) {
      // Local fallback simulation when Firestore credentials are not set
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const simulatedOrder: OrderRecord = {
        id: orderId,
        ...orderData,
      };

      return NextResponse.json(
        {
          success: true,
          message: 'Order received and routed to Kitchen Display System (Pay at waiter upon conclusion).',
          order: simulatedOrder,
        },
        { status: 201 }
      );
    }

    const docRef = await db.collection('orders').add(orderData);

    const savedOrder: OrderRecord = {
      id: docRef.id,
      ...orderData,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully. Routed to Kitchen Display System (Pay at table).',
        order: savedOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/orders POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit table order',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tableNumber = searchParams.get('tableNumber');
    const status = searchParams.get('status');

    const db = getAdminDb();

    if (!db) {
      return NextResponse.json({
        success: true,
        orders: [],
        message: 'Firestore connection inactive. Provide Firebase credentials to query stored live orders.',
      });
    }

    let query: Query = db.collection('orders').orderBy('createdAt', 'desc').limit(50);

    if (tableNumber) {
      query = query.where('tableNumber', '==', tableNumber);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const orders: OrderRecord[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<OrderRecord, 'id'>),
    }));

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error('[API /api/orders GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}
