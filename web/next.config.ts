import type { NextConfig } from "next";

const appRoot = __dirname;

const nextConfig: NextConfig = {
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
  async redirects() {
    return [
      {
        // The FAQ Report is retired (rebranded to Support Ticket Deflection).
        // Its orphaned intake permanently redirects to the canonical deflection
        // intake so any old links/bookmarks still resolve.
        source: '/systems/ai-content-ops/intake',
        destination: '/systems/support-ticket-deflection/intake',
        permanent: true,
      },
      {
        // Legacy FAQ-deflection result links should land on the canonical
        // Support Ticket Deflection result route instead of a 404.
        source: '/services/faq-deflection/results/:requestId',
        destination: '/systems/support-ticket-deflection/results/:requestId',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
