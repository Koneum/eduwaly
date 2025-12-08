import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Chemin vers le schéma Prisma
  schema: 'prisma/schema.prisma',
  
  // Configuration des migrations
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  
  // URL de la base de données (Prisma 7)
  datasource: {
    url: env('DATABASE_URL'),
  },
})