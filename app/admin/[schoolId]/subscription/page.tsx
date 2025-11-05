import prisma from "@/lib/prisma"
import SubscriptionManager from "@/components/school-admin/subscription-manager"

type PlanRow = {
  id: string
  name: string
  price: unknown
  isActive: boolean
  description?: string | null
  interval?: string
  maxStudents?: number
  maxTeachers?: number
  features?: string
}

export default async function SubscriptionPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params

  // Récupérer l'abonnement actuel
  const subscriptionData = await prisma.subscription.findFirst({
    where: { schoolId },
    include: {
      plan: true
    }
  })

  // Récupérer tous les plans disponibles
  const plansData: PlanRow[] = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  // Convertir les Decimal en number
  const subscription = subscriptionData ? {
    ...subscriptionData,
    plan: {
      ...subscriptionData.plan,
      price: Number(subscriptionData.plan.price)
    }
  } : null

  const plans = plansData.map((plan: PlanRow) => ({
    ...plan,
    price: Number(plan.price),
    description: plan.description ?? null,
    interval: plan.interval ?? 'month',
    maxStudents: plan.maxStudents ?? 0,
    maxTeachers: plan.maxTeachers ?? 0,
    features: plan.features ?? '[]'
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Gestion de l&apos;Abonnement</h1>
        <p className="text-muted-foreground mt-2">Gérez votre plan d&apos;abonnement</p>
      </div>
      <SubscriptionManager 
        subscription={subscription} 
        availablePlans={plans}
        schoolId={schoolId}
      />
    </div>
  )
}
