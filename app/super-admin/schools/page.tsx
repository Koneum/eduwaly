import prisma from "@/lib/prisma"
import SchoolsManager from "@/components/super-admin/schools-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export default async function SchoolsPage() {
  await requireSuperAdmin()
  
  const schools = await prisma.school.findMany({
    include: {
      subscription: {
        include: { plan: true }
      },
      _count: {
        select: { 
          students: true,
          users: true,
          enseignants: true
        }
      }
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

  const schoolsData = schools.map(school => ({
    ...school,
    subscription: school.subscription ? {
      ...school.subscription,
      plan: {
        ...school.subscription.plan,
        price: Number(school.subscription.plan.price)
      }
    } : null
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion des Écoles</h1>
        <p className="text-muted-foreground mt-2">Liste de toutes les écoles inscrites</p>
      </div>
      <SchoolsManager initialSchools={schoolsData} plans={plans} />
    </div>
  )
}
