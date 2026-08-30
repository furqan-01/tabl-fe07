'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  ChefHat,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Key,
} from 'lucide-react';

export default function AdminLoginPage() {
  const [authMode, setAuthMode] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    // Check saved session
    try {
      const savedAuth = localStorage.getItem('tabl_staff_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload =
        authMode === 'password'
          ? { email: email.trim(), password }
          : { pin: pin.trim() };

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please verify credentials.');
      }

      // Save user session
      localStorage.setItem('tabl_staff_auth', JSON.stringify(data.user));
      setCurrentUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@tabl.local');
    setPassword('admin123');
    setError(null);
  };

  const handleFillDemoPin = () => {
    setPin('1234');
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('tabl_staff_auth');
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setPin('');
    setError(null);
  };

  // If user is authenticated, display Staff Dashboard Hub
  if (currentUser) {
    return (
      <div id="admin-dashboard-hub" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Welcome Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
              </span>
              <span className="text-xs uppercase font-mono tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {currentUser.role}
              </span>
            </div>
            <h1 id="admin-hub-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-2">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Logged in as <span className="font-medium text-gray-800">{currentUser.email}</span>
            </p>
          </div>

          <button
            type="button"
            id="staff-logout-btn"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            Sign Out
          </button>
        </div>

        {/* Portal Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: KDS */}
          <Link
            id="hub-link-kds"
            href="/admin/kds"
            className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs hover:border-gray-900 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <ChefHat className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                Real-Time Queue
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-black">
              Kitchen Display System (KDS)
            </h2>
            <p className="text-sm text-gray-600 mt-2 flex-1">
              Monitor incoming table orders in real time, advance tickets through kitchen prep stages, and verify table payment status.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mt-6 pt-4 border-t border-gray-100">
              Open Kitchen Screen
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Inventory & 86 Manager */}
          <Link
            id="hub-link-manage"
            href="/admin/manage"
            className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs hover:border-gray-900 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Live Menu Control
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-black">
              Inventory & 86 Availability
            </h2>
            <p className="text-sm text-gray-600 mt-2 flex-1">
              Instant 86/out-of-stock toggling synced directly to both the customer kiosk and the AI menu concierge, plus new dish creation.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mt-6 pt-4 border-t border-gray-100">
              Manage Live Catalog
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Customer Experience Quick Access */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Dining Kiosk & AI Chat View</h3>
              <p className="text-xs text-gray-600">Test the guest ordering interface as seen by restaurant patrons.</p>
            </div>
          </div>
          <Link
            id="hub-link-kiosk"
            href="/menu"
            className="w-full sm:w-auto text-center rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-xs"
          >
            Launch Customer Menu
          </Link>
        </div>
      </div>
    );
  }

  // Otherwise, render interactive Login Form
  return (
    <div id="admin-login-page" className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50/50">
      <div id="admin-login-card" className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header Badge & Title */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 text-white mb-3 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h1 id="admin-login-title" className="text-2xl font-bold tracking-tight text-gray-900">
            Tabl Staff Portal
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Sign in to manage live inventory, 86 statuses, and the Kitchen Display System.
          </p>
        </div>

        {/* Authentication Mode Switcher */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authMode === 'password'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('pin');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authMode === 'pin'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quick POS PIN
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          {authMode === 'password' ? (
            <>
              <div>
                <label htmlFor="staff-email" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    id="staff-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@tabl.local"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="staff-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    id="staff-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="staff-pin" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Staff 4-Digit Access PIN
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
                <input
                  type="password"
                  id="staff-pin"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  className="w-full text-center tracking-widest font-mono text-lg rounded-lg border border-gray-300 pl-10 pr-3.5 py-2 text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1 text-center">Default terminal PIN is <span className="font-mono font-bold text-gray-700">1234</span></p>
            </div>
          )}

          <button
            type="submit"
            id="staff-login-button"
            disabled={loading}
            className="w-full mt-3 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Sign In to Admin Dashboard
              </>
            )}
          </button>
        </form>

        {/* Demo Quick-Fill Helper */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <button
            type="button"
            id="fill-demo-credentials-btn"
            onClick={authMode === 'password' ? handleFillDemo : handleFillDemoPin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {authMode === 'password' ? 'Auto-Fill Demo Credentials (admin@tabl.local / admin123)' : 'Auto-Fill Demo PIN (1234)'}
          </button>
        </div>
      </div>
    </div>
  );
}
