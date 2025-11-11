import { PrismaClient } from '@prisma/client'

// Protection contre l'exécution côté client
if (typeof window !== 'undefined') {
  throw new Error('PrismaClient should not be imported on the client side')
}

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 
