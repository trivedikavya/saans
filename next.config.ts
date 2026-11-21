import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Security headers, set once here (no nonce/proxy needed -- see README
 * "Known limitations" for why we chose the simpler non-nonce CSP from the
 * Next.js docs). Because the client never talks to Open-Meteo or Gemini
 * directly (everything goes through our own /api routes), `connect-src`
 * can stay limited to 'self'.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is required because Next.js embeds the RSC payload and
  // hydration bootstrap in inline <script> tags; without it the app builds
  // and serves fine but never hydrates (verified the hard way -- see
  // README "Known limitations"). A nonce-based CSP would avoid this but
  // requires proxy.ts + fully dynamic rendering (see Next's CSP guide);
  // we accept 'unsafe-inline' here as the documented non-nonce tradeoff.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'", // Tailwind-generated classes + a few inline style props (AQI colors) need this.
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation is used for "use my current location"; restricted to our own origin only.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
