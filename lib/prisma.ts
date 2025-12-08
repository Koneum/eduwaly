import 'server-only'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Protection contre l'exécution côté client (double sécurité avec server-only)
if (typeof window !== 'undefined') {
  throw new Error('PrismaClient should not be imported on the client side')
}

// Prisma 7: Utilisation du driver adapter PostgreSQL
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
})

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 
