interface OrderStatusPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { orderId } = await params;

  return (
    <div id="order-status-page" className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8 text-center sm:text-left">
        <h1 id="order-status-title" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Order Status
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Tracking updates for order ID: <span id="order-id-display" className="font-mono font-semibold text-gray-900">{orderId}</span>
        </p>
      </div>

      {/* Real-time Tracker Placeholder */}
      <div
        id="order-tracker-placeholder"
        className="rounded-xl border border-gray-200 bg-white p-8 shadow-xs"
      >
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Live Progress Tracker</h2>
          <p className="text-sm text-gray-500">Real-time status updates will be displayed here.</p>
        </div>

        <div className="space-y-6 py-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
              1
            </div>
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="mt-1 h-3 w-48 rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-400">
              2
            </div>
            <div className="flex-1">
              <div className="h-4 w-28 rounded bg-gray-100" />
              <div className="mt-1 h-3 w-40 rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-400">
              3
            </div>
            <div className="flex-1">
              <div className="h-4 w-24 rounded bg-gray-100" />
              <div className="mt-1 h-3 w-36 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
