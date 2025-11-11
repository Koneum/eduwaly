import prisma from "@/lib/prisma"
import PlansManager from "@/components/super-admin/plans-manager"
import ComparisonTableManager from "@/components/super-admin/comparison-table-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  await requireSuperAdmin()
  
  const plansData = await prisma.plan.findMany({
    orderBy: { price: 'asc' }
  })

  // Convertir les Decimal en number pour les composants client
  const plans = plansData.map(plan => ({
    ...plan,
    price: Number(plan.price),
    description: plan.description ?? null,
    features: typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features)
  }))

  // Plans pour le tableau comparatif (avec prix et interval)
  const simplePlans = plans.map(p => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    price: p.price,
    interval: p.interval
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion des Plans & Tarifs</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les plans d&apos;abonnement, tarifs, fonctionnalités et tableau comparatif
        </p>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid bg-card w-full max-w-md grid-cols-2">
          
          <TabsTrigger value="plans">Plans & Tarifs</TabsTrigger>
          <TabsTrigger value="comparison">Tableau Comparatif</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          <PlansManager initialPlans={plans} />
        </TabsContent>
        
        <TabsContent value="comparison" className="mt-6">
          <ComparisonTableManager plans={simplePlans} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
