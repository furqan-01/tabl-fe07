import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Utensils,
  ChefHat,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Clock,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div id="home-page" className="flex flex-1 flex-col justify-center py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1 text-xs font-semibold text-gray-800 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Smart Menu & Contactless Table Ordering System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-950">
          Effortless Dining, <br className="hidden sm:inline" />
          Powered by Real-Time AI.
        </h1>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Browse live inventory, get instant dietary recommendations and budget meal plans with our AI Menu Assistant, and order directly from your table with zero app downloads.
        </p>

        {/* Primary CTA Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            id="home-explore-menu-btn"
            href="/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black transition-all hover:scale-[1.02]"
          >
            <Utensils className="w-4 h-4" />
            Launch Table Menu & AI Concierge
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            id="home-kds-btn"
            href="/admin/kds"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors shadow-2xs"
          >
            <ChefHat className="w-4 h-4 text-orange-600" />
            Kitchen Display (KDS)
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature 1 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">AI Concierge & Dietary Guide</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Real-time streaming assistant aware of live ingredients, allergen profiles, 86 statuses, and customized budget combos.
            </p>
          </div>
          <Link
            href="/menu"
            className="mt-6 text-xs font-bold text-gray-900 inline-flex items-center gap-1 hover:underline"
          >
            Try AI Assistant &rarr;
          </Link>
        </div>

        {/* Feature 2 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Live Kitchen Queue (KDS)</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Incoming table orders appear instantly on kitchen screens with stage controls from prep to ready-to-serve.
            </p>
          </div>
          <Link
            href="/admin/kds"
            className="mt-6 text-xs font-bold text-gray-900 inline-flex items-center gap-1 hover:underline"
          >
            Open KDS Screen &rarr;
          </Link>
        </div>

        {/* Feature 3 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Instant 86 & Menu Manager</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Staff can mark items out of stock with one click, immediately updating both customer menus and AI recommendations.
            </p>
          </div>
          <Link
            href="/admin/manage"
            className="mt-6 text-xs font-bold text-gray-900 inline-flex items-center gap-1 hover:underline"
          >
            Manage Inventory &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
