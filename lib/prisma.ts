import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

// Protection contre l'exécution côté client
if (typeof window !== 'undefined') {
  throw new Error('PrismaClient should not be imported on the client side')
}

// Type pour accepter le client étendu avec Accelerate
type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

const createPrismaClient = () => new PrismaClient().$extends(withAccelerate())

const globalForPrisma = global as unknown as { 
    prisma: ExtendedPrismaClient | undefined
}

const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma 
