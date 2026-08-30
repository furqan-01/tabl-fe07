'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Utensils,
  CheckCircle2,
  CreditCard,
  ChefHat,
  Info,
} from 'lucide-react';
import {
  CartItem,
  getStoredCart,
  updateCartQuantity,
  clearCart,
  getStoredTable,
  setStoredTable,
} from '@/lib/cart';
import { OrderRecord } from '@/types/restaurant';

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string>('4');
  const [specialNotes, setSpecialNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCart = () => {
    setCart(getStoredCart());
    setTableNumber(getStoredTable());
  };

  useEffect(() => {
    loadCart();

    const handleUpdate = () => loadCart();
    window.addEventListener('tabl_cart_updated', handleUpdate);
    return () => window.removeEventListener('tabl_cart_updated', handleUpdate);
  }, []);

  const handleQty = (menuItemId: string, newQty: number) => {
    updateCartQuantity(menuItemId, newQty);
    loadCart();
  };

  const handleRemove = (menuItemId: string) => {
    updateCartQuantity(menuItemId, 0);
    loadCart();
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setPlacingOrder(true);
    setError(null);

    try {
      const payload = {
        tableNumber: tableNumber.trim() || '4',
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes || '',
        })),
        specialInstructions: specialNotes.trim(),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      setPlacedOrder(data.order);
      clearCart();
      loadCart();
    } catch (err: any) {
      console.error('Order submission error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (placedOrder) {
    return (
      <div id="order-success-screen" className="w-full max-w-3xl mx-auto px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 mb-2">
            Order Sent to Kitchen
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Order Confirmed for Table {placedOrder.tableNumber}!
          </h1>

          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            Your ticket <span className="font-mono font-bold text-gray-900">#{placedOrder.id.slice(-6).toUpperCase()}</span> has been dispatched directly to the kitchen display.
          </p>

          <div className="mt-8 rounded-2xl bg-gray-50 p-6 text-left border border-gray-200/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Order Summary
            </h2>
            <ul className="divide-y divide-gray-200">
              {placedOrder.items.map((item, idx) => (
                <li key={idx} className="py-2.5 flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs">
                      {item.quantity}x
                    </span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="font-mono text-gray-700">
                    Rs. {(item.price * item.quantity).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-200 mt-4 pt-3 flex justify-between font-bold text-base text-gray-900">
              <span>Total Bill</span>
              <span className="font-mono">Rs. {placedOrder.total?.toFixed(0)}</span>
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200/60 p-3 text-xs text-amber-900 flex items-start gap-2">
              <CreditCard className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Contactless Table Policy:</span> No online payment needed. Savor your meal and pay your waiter at table {placedOrder.tableNumber} (Cash/Card) whenever you are ready.
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/menu"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-xs font-bold text-white hover:bg-gray-800 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Menu
            </Link>
            <Link
              href="/admin/kds"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChefHat className="w-4 h-4 text-orange-600" />
              View Kitchen Screen (KDS)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="cart-page" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Menu
            </Link>
          </div>
          <h1 id="cart-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-1">
            Table {tableNumber} Order Cart
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-2xs">
            <Utensils className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700">Table:</span>
            <select
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value);
                setStoredTable(e.target.value);
              }}
              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <option key={num} value={String(num)}>
                  #{num}
                </option>
              ))}
            </select>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearCart();
                loadCart();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Your cart is empty</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Browse our menu or consult the AI Assistant for recommendations and add items to your table order.
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-colors shadow-xs"
          >
            <Utensils className="w-4 h-4" />
            Explore Menu & Combos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-3 mb-4">
                Selected Dishes ({cart.length})
              </h2>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                        <span className="font-mono text-xs font-semibold text-gray-600">
                          Rs. {item.price} each
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5 mt-1 inline-block">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-mono text-xs font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total for item */}
                      <span className="font-mono text-sm font-bold text-gray-900 min-w-16 text-right">
                        Rs. {(item.price * item.quantity).toFixed(0)}
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions Note Input */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <label htmlFor="special-notes" className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Special Kitchen Instructions / Allergies
              </label>
              <textarea
                id="special-notes"
                rows={2}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="e.g. Extra napkins, dressing on the side, no onions..."
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-100 pb-3 mb-4">
                Order Bill Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-gray-900">Rs. {subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST & Service (5%)</span>
                  <span className="font-mono font-medium text-gray-900">Rs. {tax.toFixed(0)}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold text-gray-900">
                  <span>Total Due</span>
                  <span className="font-mono text-lg">Rs. {total.toFixed(0)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                id="place-order-btn"
                disabled={placingOrder || cart.length === 0}
                onClick={handlePlaceOrder}
                className="mt-6 w-full rounded-xl bg-gray-900 py-3 px-4 text-sm font-bold text-white shadow-xs hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending to Kitchen...
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    Confirm Table {tableNumber} Order
                  </>
                )}
              </button>

              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200/80 p-3 text-[11px] text-gray-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>
                  Orders are dispatched directly to the chef. You will pay your waiter at table {tableNumber} after your meal.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
