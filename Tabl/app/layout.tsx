import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tabl | Smart Menu Kiosk',
  description: 'Smart menu kiosk and contactless ordering application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header id="main-header" className="border-b border-gray-200 bg-white px-6 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link id="nav-brand" href="/" className="text-xl font-bold tracking-tight text-gray-900 hover:text-gray-700 transition-colors">
                Tabl
              </Link>
              <nav id="main-nav" className="flex items-center space-x-6">
                <Link id="nav-link-menu" href="/menu" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Menu
                </Link>
                <Link id="nav-link-cart" href="/cart" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Cart
                </Link>
                <Link id="nav-link-admin" href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Admin
                </Link>
                <Link id="nav-link-health" href="/health" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Health
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
