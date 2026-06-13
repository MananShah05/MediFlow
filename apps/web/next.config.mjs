/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    // ── Security headers for all routes ───────────────────────────────
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
    // ── Immutable cache for hashed Next.js static chunks ──────────────
    // These files contain a content hash in the filename, so they can be
    // cached forever — the hash changes when the content changes.
    {
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    // ── Long-lived cache for fonts, images, and other media ───────────
    {
      source: "/(.*\\.(?:ico|png|jpg|jpeg|svg|webp|avif|woff2|woff|ttf|otf|eot)$)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
      ],
    },
  ],
};

export default nextConfig;

