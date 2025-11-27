import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
        // 1. Enable SVG support
    dangerouslyAllowSVG: true,
    
    // 2. Recommended security header for SVGs to prevent scripts from running
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Added just in case you switch back to Unsplash
      },
    ],
  },
};

export default nextConfig;