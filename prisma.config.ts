import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Chemin vers le schéma Prisma
  schema: 'prisma/schema.prisma',
  
  // Configuration des migrations
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.mjs && npx tsx prisma/seed-permissions.ts && npx tsx prisma/seed-comparison.ts',
  },
  
  // URL de la base de données (Prisma 7)
  datasource: {
    url: env('DATABASE_URL'),
  },
})