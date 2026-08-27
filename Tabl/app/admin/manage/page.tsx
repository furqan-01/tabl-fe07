'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  ChefHat,
  Plus,
  Globe,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  ArrowLeft,
  DollarSign,
  Tag,
  Flame,
  Check,
} from 'lucide-react';
import { MenuItem } from '@/types/restaurant';

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // New Dish Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Mains');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishSpice, setNewDishSpice] = useState(0);
  const [newDishVeg, setNewDishVeg] = useState(false);
  const [newDishVegan, setNewDishVegan] = useState(false);
  const [newDishGlutenFree, setNewDishGlutenFree] = useState(false);
  const [addingDish, setAddingDish] = useState(false);

  // Web Scraping Modal State
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeFeedback, setScrapeFeedback] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err: any) {
      console.error('Error fetching menu:', err);
      setError(err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleAvailability = async (item: MenuItem) => {
    const updatedStatus = !item.isAvailable;
    setTogglingId(item.id);

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: updatedStatus } : i))
    );

    try {
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: updatedStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !updatedStatus } : i))
      );
      alert('Could not update item availability. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName || !newDishPrice) return;

    setAddingDish(true);
    try {
      const newItem: MenuItem = {
        id: `dish-${Date.now()}`,
        name: newDishName.trim(),
        category: newDishCategory,
        price: parseFloat(newDishPrice) || 0,
        description: newDishDesc.trim(),
        isVegetarian: newDishVeg,
        isVegan: newDishVegan,
        isGlutenFree: newDishGlutenFree,
        spiceLevel: newDishSpice,
        isAvailable: true,
        ingredients: [],
        allergens: [],
      };

      const res = await fetch('/api/menu/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add dish');
      }

      setItems((prev) => [newItem, ...prev]);
      setShowAddModal(false);
      // Reset form
      setNewDishName('');
      setNewDishPrice('');
      setNewDishDesc('');
      setNewDishSpice(0);
      setNewDishVeg(false);
      setNewDishVegan(false);
      setNewDishGlutenFree(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add dish');
    } finally {
      setAddingDish(false);
    }
  };

  const handleScrapeMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl) return;

    setScraping(true);
    setScrapeFeedback(null);
    try {
      const res = await fetch('/api/menu/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Scraping failed');
      }

      setScrapeFeedback(`Successfully scraped ${data.count || 0} items from ${scrapeUrl}`);
      // Refresh menu
      await fetchMenu();
      setTimeout(() => {
        setShowScrapeModal(false);
        setScrapeFeedback(null);
        setScrapeUrl('');
      }, 1500);
    } catch (err: any) {
      setScrapeFeedback(`Error: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category || 'Mains')))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="manage-page" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Staff Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5 mb-8">
        <div className="flex items-center space-x-3">
          <Link
            id="back-to-admin-btn"
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Staff Hub
          </Link>
          <span className="text-gray-300">/</span>
          <h1 id="manage-title" className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Inventory & 86 Control
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            id="nav-to-kds"
            href="/admin/kds"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ChefHat className="w-4 h-4 text-orange-600" />
            Kitchen Display (KDS)
          </Link>
          <button
            type="button"
            id="open-add-dish-btn"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Dish
          </button>
          <button
            type="button"
            id="open-scrape-modal-btn"
            onClick={() => setShowScrapeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            Sync URL
          </button>
        </div>
      </div>

      {/* Overview & Quick Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            id="inventory-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items by name or ingredients..."
            className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none bg-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table Container */}
      <div
        id="inventory-table-container"
        className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase font-semibold text-gray-700 tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Item & Description</th>
                <th scope="col" className="px-6 py-4">Category</th>
                <th scope="col" className="px-6 py-4">Price</th>
                <th scope="col" className="px-6 py-4">Dietary</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Quick 86 Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
                    Loading catalog items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No matching items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    id={`inventory-row-${item.id}`}
                    className={`hover:bg-gray-50/75 transition-colors ${
                      !item.isAvailable ? 'bg-rose-50/20 opacity-85' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 max-w-sm mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                      Rs. {typeof item.price === 'number' ? item.price.toFixed(0) : item.price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {item.isVegetarian && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Veg
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="text-[10px] font-bold uppercase bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                            Vegan
                          </span>
                        )}
                        {item.spiceLevel ? (
                          <span className="text-[10px] font-bold flex items-center bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            <Flame className="w-3 h-3 mr-0.5 text-red-500" /> {item.spiceLevel}
                          </span>
                        ) : null}
                        {!item.isVegetarian && !item.isVegan && !item.spiceLevel && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> In Stock
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> 86&apos;d / Out
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        id={`toggle-item-${item.id}`}
                        disabled={togglingId === item.id}
                        onClick={() => handleToggleAvailability(item)}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shadow-2xs ${
                          item.isAvailable
                            ? 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50'
                            : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {togglingId === item.id
                          ? 'Updating...'
                          : item.isAvailable
                          ? '86 Item'
                          : 'Restore Stock'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Dish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Menu Item</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Garlic Butter Naan or Chicken Tikka"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  >
                    <option value="Mains">Mains</option>
                    <option value="Appetizers">Appetizers</option>
                    <option value="Burgers & Sandwiches">Burgers & Sandwiches</option>
                    <option value="Sides">Sides</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Price (Rs.)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  placeholder="Fresh ingredients, prep style, and flavor notes..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={newDishVeg}
                    onChange={(e) => setNewDishVeg(e.target.checked)}
                    className="rounded text-gray-900 mr-2"
                  />
                  Vegetarian
                </label>
                <label className="inline-flex items-center text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={newDishVegan}
                    onChange={(e) => setNewDishVegan(e.target.checked)}
                    className="rounded text-gray-900 mr-2"
                  />
                  Vegan
                </label>
                <label className="inline-flex items-center text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={newDishGlutenFree}
                    onChange={(e) => setNewDishGlutenFree(e.target.checked)}
                    className="rounded text-gray-900 mr-2"
                  />
                  Gluten Free
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDish}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {addingDish ? 'Saving...' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scrape External Menu URL Modal */}
      {showScrapeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Scrape & Sync Menu from Web</h3>
              <button
                type="button"
                onClick={() => setShowScrapeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Provide a restaurant webpage URL. The scraper will extract items and prices, storing them into the live database.
            </p>

            <form onSubmit={handleScrapeMenu} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Menu URL</label>
                <input
                  type="url"
                  required
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  placeholder="https://example-restaurant.com/menu"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>

              {scrapeFeedback && (
                <div className="p-3 rounded-lg bg-gray-100 text-xs font-mono text-gray-800">
                  {scrapeFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowScrapeModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scraping}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {scraping ? 'Scraping...' : 'Start Extraction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
