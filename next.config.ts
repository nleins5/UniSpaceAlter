import type { NextConfig } from "next";

// Supabase hostname is derived from the env var — never hardcoded.
// Set NEXT_PUBLIC_SUPABASE_URL in .env.local or your hosting dashboard.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const supabasePatterns = supabaseHostname
  ? [{ protocol: "https" as const, hostname: supabaseHostname }]
  : [];

const supabaseCSP = supabaseHostname
  ? ` https://${supabaseHostname}`
  : "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...supabasePatterns,
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: blob: https://images.unsplash.com${supabaseCSP}`,
              `connect-src 'self'${supabaseCSP}`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
