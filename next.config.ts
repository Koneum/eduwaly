import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  
  // Externaliser Prisma pour Next.js 16 + Turbopack
  // Doc Prisma 6.18: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-monorepo
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  // Configuration Turbopack (optionnel, mais silences les warnings)
  turbopack: {},
  
  headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
      { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
    ]
  }
],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
