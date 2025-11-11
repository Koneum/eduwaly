import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { requireSchoolAccess } from '@/lib/auth-utils'
import { UpgradeManager } from '@/components/school-admin/upgrade-manager'

export default async function UpgradePage({
  params
}: {
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  const user = await requireSchoolAccess(schoolId)

  if (!user) {
    redirect('/login')
  }

  // Récupérer l'école avec son abonnement actuel
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      subscription: {
        include: {
          plan: true
        }
      }
    }
  })

  if (!school) {
    redirect('/admin')
  }

  // Récupérer tous les plans disponibles
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  // Convertir Decimal en number
  const plansData = plans.map(plan => ({
    ...plan,
    price: Number(plan.price),
    features: typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features)
  }))

  const currentPlanName = school.subscription?.plan?.name || 'STARTER'

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mettre à Niveau Votre Plan</h1>
        <p className="text-muted-foreground mt-2">
          Choisissez le plan qui correspond le mieux à vos besoins
        </p>
      </div>

      <UpgradeManager 
        plans={plansData}
        currentPlan={currentPlanName}
        schoolId={schoolId}
      />
    </div>
  )
}
