import prisma from "@/lib/prisma"
import SubscriptionsManager from "@/components/super-admin/subscriptions-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  await requireSuperAdmin()
  
  const subscriptionsData = await prisma.subscription.findMany({
    include: {
      school: true,
      plan: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const plansData = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  // Convertir les Decimal en number pour les composants client
  const plans = plansData.map(plan => ({
    ...plan,
    price: Number(plan.price)
  }))

  const subscriptions = subscriptionsData.map(sub => ({
    ...sub,
    plan: {
      ...sub.plan,
      price: Number(sub.plan.price)
    }
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion des Abonnements</h1>
        <p className="text-muted-foreground mt-2">Suivi de tous les abonnements des écoles</p>
      </div>
      <SubscriptionsManager initialSubscriptions={subscriptions} plans={plans} />
    </div>
  )
}
