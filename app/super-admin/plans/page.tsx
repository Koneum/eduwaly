import prisma from "@/lib/prisma"
import PlansClientWrapper from "@/components/super-admin/plans-client-wrapper"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, CheckCircle, Building2, GraduationCap } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  await requireSuperAdmin()
  
  const plansData = await prisma.plan.findMany({
    orderBy: { price: 'asc' }
  })

  // Stats
  const totalPlans = plansData.length
  const activePlans = plansData.filter(p => p.isActive).length
  const universityPlans = plansData.filter(p => p.schoolType === 'UNIVERSITY').length
  const highSchoolPlans = plansData.filter(p => p.schoolType === 'HIGH_SCHOOL').length

  // Convertir les Decimal en number pour les composants client
  const plans = plansData.map(plan => ({
    ...plan,
    price: Number(plan.price),
    description: plan.description ?? null,
    features: typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features),
    modulesIncluded: plan.modulesIncluded ?? null
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
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Plans & Tarifs</h1>
                <p className="text-white/80 mt-1 text-sm md:text-base">Gérez les abonnements et le tableau comparatif</p>
              </div>
            </div>
          </div>
          
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <Package className="h-3.5 w-3.5" />
                Total
              </div>
              <p className="text-2xl font-bold">{totalPlans}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Actifs
              </div>
              <p className="text-2xl font-bold">{activePlans}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <Building2 className="h-3.5 w-3.5" />
                Universités
              </div>
              <p className="text-2xl font-bold">{universityPlans}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <GraduationCap className="h-3.5 w-3.5" />
                Lycées
              </div>
              <p className="text-2xl font-bold">{highSchoolPlans}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid bg-muted/50 w-full max-w-md grid-cols-2 p-1 rounded-xl">
          <TabsTrigger value="plans" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
            Plans & Tarifs
          </TabsTrigger>
          <TabsTrigger value="comparison" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm">
            Tableau Comparatif
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          <PlansClientWrapper initialPlans={plans} simplePlans={simplePlans} activeTab="plans" />
        </TabsContent>
        
        <TabsContent value="comparison" className="mt-6">
          <PlansClientWrapper initialPlans={plans} simplePlans={simplePlans} activeTab="comparison" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
