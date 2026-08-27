'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShoppingBag,
  Search,
  Flame,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  MessageSquare,
  Tag,
  Clock,
  Info,
  Layers,
  ChevronRight,
  Utensils,
  Check,
  Database,
  RefreshCw,
} from 'lucide-react';
import { MenuItem, DealOrPromotion, RestaurantInfo } from '@/types/restaurant';
import ChatContainer from '@/components/chat/ChatContainer';
import { addToCart, getStoredCart, getStoredTable, setStoredTable } from '@/lib/cart';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [deals, setDeals] = useState<DealOrPromotion[]>([]);
  const [info, setInfo] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'vegan' | 'gf'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart & UI State
  const [cartCount, setCartCount] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [tableNumber, setTableNumberState] = useState('4');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Chat Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Refresh cart state
  const syncCartState = useCallback(() => {
    const cart = getStoredCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setCartCount(count);
    setCartSubtotal(subtotal);
  }, []);

  useEffect(() => {
    // Initial fetch from /api/menu
    async function loadMenu() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/menu');
        const data = await res.json();
        const menuList = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data)
          ? data.data
          : [];
        setItems(menuList);
        if (data.deals && Array.isArray(data.deals)) setDeals(data.deals);
        if (data.info) setInfo(data.info);
      } catch (err: any) {
        console.error('Failed to load menu:', err);
        setError(err.message || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
    setTableNumberState(getStoredTable());
    syncCartState();

    window.addEventListener('tabl_cart_updated', syncCartState);
    return () => window.removeEventListener('tabl_cart_updated', syncCartState);
  }, [syncCartState]);

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTableNumberState(val);
    setStoredTable(val);
  };

  const getItemQuantity = (id: string) => itemQuantities[id] || 1;

  const handleQuantityChange = (id: string, delta: number) => {
    setItemQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    const qty = getItemQuantity(item.id);
    addToCart(item, qty);
    setJustAddedId(item.id);
    setTimeout(() => setJustAddedId(null), 1200);
  };

  const handleSyncDatabase = async () => {
    try {
      setIsSyncingDb(true);
      setSyncSuccessMsg(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncSuccessMsg('Database synced & seeded successfully!');
        // Refresh menu
        const menuRes = await fetch('/api/menu');
        const menuData = await menuRes.json();
        if (menuData.items) setItems(menuData.items);
        if (menuData.deals) setDeals(menuData.deals);
        if (menuData.info) setInfo(menuData.info);
      } else {
        alert(data.message || 'Failed to seed database.');
      }
    } catch (err: any) {
      alert(err.message || 'Error syncing database.');
    } finally {
      setIsSyncingDb(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  // Extract Categories
  const availableCategories = ['All', ...Array.from(new Set(items.map((i) => i.category || 'Mains')))];

  // Filter Items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ingredients && item.ingredients.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase())));

    let matchesDietary = true;
    if (dietaryFilter === 'veg') matchesDietary = item.isVegetarian || item.isVegan;
    if (dietaryFilter === 'vegan') matchesDietary = item.isVegan;
    if (dietaryFilter === 'gf') matchesDietary = item.isGlutenFree;

    return matchesCategory && matchesSearch && matchesDietary;
  });

  return (
    <div id="menu-page-root" className="min-h-screen bg-gray-50/50 pb-28">
      {/* Top Banner / Table Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 id="menu-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                {info?.name || 'Tabl Modern Bistro'}
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                Kitchen Online
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Live contactless ordering. Pay directly to your waiter at the table.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Sync to Firestore button */}
            <button
              type="button"
              id="sync-firestore-btn"
              onClick={handleSyncDatabase}
              disabled={isSyncingDb}
              title="Populate your connected Firebase Firestore database with all default menu dishes and deals"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/70 hover:bg-amber-100/90 text-amber-900 px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 shadow-2xs"
            >
              {isSyncingDb ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
              ) : (
                <Database className="w-3.5 h-3.5 text-amber-700" />
              )}
              <span>{isSyncingDb ? 'Syncing...' : 'Sync to Firestore'}</span>
            </button>

            {/* Table Number Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 shadow-2xs">
              <Utensils className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">Table:</span>
              <select
                id="menu-table-select"
                value={tableNumber}
                onChange={handleTableChange}
                className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={String(num)}>
                    #{num}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Assistant Quick Toggle Header Button */}
            <button
              type="button"
              id="header-toggle-ai-btn"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shadow-xs ${
                isChatOpen
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isChatOpen ? 'Close AI Assistant' : 'Ask AI Assistant'}</span>
            </button>
          </div>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncSuccessMsg} Refreshing menu view.</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Content Layout */}
        <div className="w-full">
          {/* Menu Items & Catalog */}
          <div className="w-full">
            {/* Active Deals & Combo Offers */}
            {deals.length > 0 && (
              <section id="menu-deals-section" className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                    Active Deals & Special Combos
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      id={`deal-card-${deal.id}`}
                      className="relative flex flex-col justify-between rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                            Special Promo
                          </span>
                          {deal.discountedPrice && (
                            <span className="font-mono text-xs font-bold text-gray-900 bg-white border border-amber-200 px-2 py-0.5 rounded">
                              Rs. {deal.discountedPrice}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mt-2">{deal.title}</h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{deal.description}</p>
                      </div>
                      {deal.conditions && (
                        <p className="text-[10px] text-amber-700/90 mt-3 pt-2 border-t border-amber-100 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {deal.conditions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Search & Filter Controls */}
            <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-xs py-3 mb-6 border-b border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    id="menu-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, ingredients, or allergens..."
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none bg-white shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Dietary Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { key: 'all', label: 'All Dishes' },
                    { key: 'veg', label: '🌱 Veg' },
                    { key: 'vegan', label: '🌿 Vegan' },
                    { key: 'gf', label: '🌾 Gluten Free' },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setDietaryFilter(filter.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        dietaryFilter === filter.key
                          ? 'bg-gray-900 text-white shadow-2xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Assistant Quick Prompt Strip */}
            <div
              id="menu-ai-banner"
              className="mb-6 rounded-xl border border-gray-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Need personal dish recommendations or allergen check?</p>
                  <p className="text-[11px] text-gray-500">Ask the Tabl AI Assistant for budget combos, dietary substitutes, and live dish availability.</p>
                </div>
              </div>
              <button
                type="button"
                id="banner-open-ai-btn"
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black transition-colors shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Assistant</span>
              </button>
            </div>

            {/* Menu Items Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs animate-pulse">
                    <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-4 w-4/5 bg-gray-100 rounded mb-4" />
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                <Utensils className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-gray-900">No items match your filter</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Try clearing your search query or selecting a different dietary filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setDietaryFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 rounded-lg bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div
                id="menu-items-grid"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              >
                {filteredItems.map((item) => {
                  const qty = getItemQuantity(item.id);
                  const isJustAdded = justAddedId === item.id;

                  return (
                    <div
                      key={item.id}
                      id={`menu-card-${item.id}`}
                      className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                        item.isAvailable
                          ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          : 'border-rose-100 bg-gray-50/50 opacity-80'
                      }`}
                    >
                      {/* Top Meta & Badges */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            {item.category}
                          </span>

                          {/* Availability Badge */}
                          {item.isAvailable ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                              <CheckCircle2 className="w-3 h-3" /> In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-600/20">
                              <XCircle className="w-3 h-3" /> 86&apos;d / Out
                            </span>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="flex items-baseline justify-between gap-2 mb-1.5">
                          <h3 className="text-base font-bold text-gray-900 leading-snug">{item.name}</h3>
                          <span className="font-mono text-sm font-bold text-gray-900 whitespace-nowrap">
                            Rs. {typeof item.price === 'number' ? item.price.toFixed(0) : item.price}
                          </span>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}

                        {/* Dietary Tags & Spice */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-4">
                          {item.isVegetarian && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              Veg
                            </span>
                          )}
                          {item.isVegan && (
                            <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">
                              Vegan
                            </span>
                          )}
                          {item.isGlutenFree && (
                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                              Gluten Free
                            </span>
                          )}
                          {item.spiceLevel ? (
                            <span className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-red-500 fill-current" />
                              Spice {item.spiceLevel}
                            </span>
                          ) : null}
                          {item.allergens && item.allergens.length > 0 && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              Contains: {item.allergens.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                        {item.isAvailable ? (
                          <>
                            {/* Quantity Selector */}
                            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-mono text-xs font-bold text-gray-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Add Button */}
                            <button
                              type="button"
                              id={`add-to-cart-${item.id}`}
                              onClick={() => handleAddToCart(item)}
                              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold transition-all shadow-2xs ${
                                isJustAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              }`}
                            >
                              {isJustAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Added to Cart
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" /> Add to Cart
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="w-full text-center py-2 text-xs font-semibold text-rose-600 bg-rose-50/80 rounded-lg border border-rose-100">
                            Currently Unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Slide-over Right Drawer for AI Concierge */}
      {isChatOpen && (
        <div id="concierge-drawer-wrapper" className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Scrim */}
          <div
            id="concierge-drawer-backdrop"
            onClick={() => setIsChatOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
          />

          {/* Slide-over Drawer Panel rigidly clamped to viewport height */}
          <aside
            id="concierge-drawer-panel"
            className="fixed top-0 right-0 bottom-0 z-10 h-screen h-[100dvh] max-h-screen max-h-[100dvh] w-full sm:w-[460px] md:w-[480px] bg-white shadow-2xl flex flex-col border-l border-gray-200 overflow-hidden"
          >
            <ChatContainer
              onClose={() => setIsChatOpen(false)}
              onAddToCartItemName={(name) => {
                const match = items.find((i) => i.name.toLowerCase().includes(name.toLowerCase()));
                if (match) handleAddToCart(match);
              }}
            />
          </aside>
        </div>
      )}

      {/* Floating Action Trigger Button for AI Assistant */}
      {!isChatOpen && (
        <button
          type="button"
          id="floating-assistant-btn"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-black transition-all hover:scale-105 border border-gray-700"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
          </div>
          <span>Ask Tabl Concierge</span>
        </button>
      )}

      {/* Floating Bottom Cart Bar (if cart has items) */}
      {cartCount > 0 && (
        <div
          id="floating-cart-bar"
          className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Table {tableNumber} Cart:
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-gray-900">
                  Rs. {cartSubtotal.toFixed(0)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                id="view-cart-btn"
                href="/cart"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-colors shadow-xs"
              >
                <span>Review Cart & Place Order</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
