interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  checks: {
    database: string;
    server: string;
    renderer: string;
  };
}

async function getHealthStatus(): Promise<HealthCheckResponse> {
  // Simulate mock asynchronous health check
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: "Systems Operational",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 120),
        environment: process.env.NODE_ENV || "development",
        checks: {
          database: "Ready",
          server: "Healthy",
          renderer: "Next.js App Router (Server-side)",
        },
      });
    }, 100);
  });
}

export default async function HealthPage() {
  const healthData = await getHealthStatus();

  return (
    <div id="health-page" className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 id="health-title" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          System Health Status
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Real-time service health check and runtime diagnostic information.
        </p>
      </div>

      <div
        id="health-status-card"
        className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Overall Status
            </span>
            <div className="mt-1 flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 id="health-overall-status" className="text-2xl font-bold text-gray-900">
                {healthData.status}
              </h2>
            </div>
          </div>
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
            HTTP 200 OK
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <span className="text-xs font-medium text-gray-500">Timestamp</span>
            <p id="health-timestamp" className="mt-1 font-mono text-sm text-gray-900">
              {healthData.timestamp}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <span className="text-xs font-medium text-gray-500">Environment</span>
            <p id="health-environment" className="mt-1 font-mono text-sm text-gray-900">
              {healthData.environment}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <span className="text-xs font-medium text-gray-500">Database Connection</span>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {healthData.checks.database}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <span className="text-xs font-medium text-gray-500">Server Engine</span>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {healthData.checks.renderer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
