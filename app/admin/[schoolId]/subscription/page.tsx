import prisma from "@/lib/prisma"
import SubscriptionManager from "@/components/school-admin/subscription-manager"

export default async function SubscriptionPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params

  // Récupérer l'abonnement actuel
  const subscriptionData = await prisma.subscription.findFirst({
    where: { schoolId },
    include: {
      plan: true
    }
  })

  // Convertir les Decimal en number
  const subscription = subscriptionData ? {
    ...subscriptionData,
    plan: {
      ...subscriptionData.plan,
      price: Number(subscriptionData.plan.price)
    }
  } : null

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground text-balance">Gestion de l&apos;Abonnement</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Gérez votre plan d&apos;abonnement et découvrez toutes les fonctionnalités</p>
      </div>
      <SubscriptionManager 
        subscription={subscription} 
        schoolId={schoolId}
      />
    </div>
  )
}
