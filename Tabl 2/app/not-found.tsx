import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black text-gray-900">404</h1>
        <h2 className="mt-4 text-xl font-bold text-gray-800">Page Not Found</h2>
        <p className="mt-2 text-sm text-gray-600">
          The menu page or table session you are looking for could not be found.
        </p>
        <div className="mt-6">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-black transition-colors"
          >
            Go to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
