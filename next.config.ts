import type { NextConfig } from "next";

// Headers de sécurité (OWASP + Next.js recommandations)
const securityHeaders = [
  // Prévention du clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prévention du MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Contrôle du referrer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions des APIs du navigateur
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // DNS Prefetch
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig: NextConfig = {
  // Externaliser Prisma pour Next.js 16 + Turbopack + Prisma 7
  serverExternalPackages: ['@prisma/client', 'prisma', '@prisma/adapter-pg', 'pg'],
  
  // Configuration Turbopack
  turbopack: {
    root: process.cwd(),
  },
  
  // Headers de sécurité + CORS pour API
  headers: async () => [
    // Headers de sécurité globaux
    {
      source: '/:path*',
      headers: securityHeaders,
    },
    // CORS pour les routes API
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        // En production, remplacer * par les domaines autorisés
        { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'production' 
          ? 'https://eduwaly.vercel.app' 
          : '*' 
        },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
      ],
    },
  ],
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'eduwaly.s3.us-east-1.amazonaws.com',
      },
    ],
    unoptimized: true,
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
