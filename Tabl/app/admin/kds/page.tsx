'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Layers,
  Utensils,
  BellRing,
  CreditCard,
} from 'lucide-react';
import { OrderRecord } from '@/types/restaurant';

export default function KitchenDisplaySystemPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOrders();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchOrders]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  ) => {
    setUpdatingId(orderId);
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update order status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      // Revert if error
      fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  
  const displayedOrders = orders.filter((o) => {
    if (filterStatus === 'active') return o.status !== 'completed' && o.status !== 'cancelled';
    if (filterStatus === 'pending') return o.status === 'pending';
    if (filterStatus === 'preparing') return o.status === 'preparing';
    if (filterStatus === 'ready') return o.status === 'ready';
    if (filterStatus === 'completed') return o.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div id="kds-page" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Staff Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 mb-8">
        <div className="flex items-center space-x-3">
          <Link
            id="kds-back-to-hub"
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Staff Hub
          </Link>
          <span className="text-gray-300">/</span>
          <h1 id="kds-title" className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Kitchen Display System (KDS)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoRefresh ? 'Live Polling Active' : 'Polling Paused'}
          </button>

          <button
            type="button"
            onClick={() => fetchOrders()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Link
            id="kds-link-manage"
            href="/admin/manage"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            Inventory 86
          </Link>
        </div>
      </div>

      {/* Active Filter Tabs & Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'active', label: 'Active Queue', count: activeOrders.length },
            { key: 'pending', label: 'New / Pending', count: orders.filter((o) => o.status === 'pending').length },
            { key: 'preparing', label: 'In Kitchen', count: orders.filter((o) => o.status === 'preparing').length },
            { key: 'ready', label: 'Ready to Serve', count: orders.filter((o) => o.status === 'ready').length },
            { key: 'completed', label: 'Completed', count: orders.filter((o) => o.status === 'completed').length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                filterStatus === tab.key
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterStatus === tab.key
                    ? 'bg-gray-800 text-gray-200'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Orders update automatically in real-time</span>
        </div>
      </div>

      {/* Ticket Grid */}
      {displayedOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No tickets in this view</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Incoming table orders placed from the customer kiosk will appear here instantly.
          </p>
        </div>
      ) : (
        <div id="kds-ticket-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrders.map((order) => {
            const isUpdating = updatingId === order.id;
            return (
              <div
                key={order.id}
                id={`kds-ticket-${order.id}`}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden transition-all hover:shadow-sm"
              >
                {/* Ticket Header */}
                <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-gray-400">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-gray-700" />
                      Table {order.tableNumber || 'Takeout'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-mono block">
                      {formatTime(order.createdAt)}
                    </span>
                    <span
                      className={`inline-block border px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mt-1 ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 p-4 bg-white">
                  <ul className="space-y-2.5">
                    {order.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start space-x-2">
                          <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {item.name}
                            </span>
                            {item.notes && (
                              <p className="text-xs text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-0.5">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-mono text-xs text-gray-500">
                          Rs. {(item.price * item.quantity).toFixed(0)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Customer Order Notes */}
                  {order.specialInstructions && (
                    <div className="mt-3 rounded-lg bg-amber-50/80 border border-amber-200/60 p-2 text-xs text-amber-900">
                      <span className="font-semibold">Special Instructions:</span> {order.specialInstructions}
                    </div>
                  )}
                </div>

                {/* Bill Summary & Payment Status */}
                <div className="px-4 py-2.5 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-600 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                    <span>Pay at Table:</span>
                    <span className="font-semibold text-gray-900">
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pay to Waiter'}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-gray-900 text-sm">
                    Rs. {order.total?.toFixed(0) || '0'}
                  </div>
                </div>

                {/* Stage Action Controls */}
                <div className="border-t border-gray-100 p-3 bg-white flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Start Preparing'}
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Ready to Serve'}
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="flex-1 rounded-lg bg-gray-900 py-2 text-xs font-bold text-white hover:bg-gray-800 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Complete & Close Ticket'}
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <div className="w-full text-center py-1.5 text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Order Fulfilled
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
