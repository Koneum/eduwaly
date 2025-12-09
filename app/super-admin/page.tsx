/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatCard } from "@/components/stat-card"
import { RecentActivity } from "@/components/recent-activity"
import { RevenueChart } from "@/components/revenue-chart"
import { School, Users, DollarSign, TrendingUp, Package, CreditCard, ArrowRight } from "lucide-react"
import prisma from "@/lib/prisma"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboard() {
  await requireSuperAdmin()
  // Statistiques globales
  const totalSchools = await prisma.school.count()
  const activeSchools = await prisma.school.count({ where: { isActive: true } })
  const totalStudents = await prisma.student.count()
  
  // Stats par type d'école
  const universityCount = await prisma.school.count({ where: { schoolType: 'UNIVERSITY' } })
  const highSchoolCount = await prisma.school.count({ where: { schoolType: 'HIGH_SCHOOL' } })
  
  // Calcul des revenus réels
  const activeSubscriptions: any = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true }
  })
  const totalRevenue = activeSubscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)

  // Calcul du taux de croissance
  const now = new Date()
  const lastMonthSchools: any = await prisma.school.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
  })

  const currentMonthSchools: any = await prisma.school.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
  })

  const growthRate = lastMonthSchools > 0 
    ? ((currentMonthSchools - lastMonthSchools) / lastMonthSchools * 100).toFixed(1)
    : 0

  // Calcul de la croissance des étudiants
  const lastMonthStudents: any = await prisma.student.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
  })

  const currentMonthStudents: any = await prisma.student.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
  })

  const studentGrowthRate = lastMonthStudents > 0 
    ? ((currentMonthStudents - lastMonthStudents) / lastMonthStudents * 100).toFixed(1)
    : 0

  // Calcul de la croissance des revenus
  const lastMonthRevenue: any = await prisma.subscription.findMany({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1)
      },
      status: 'ACTIVE'
    },
    include: { plan: true }
  })

  const currentMonthRevenue: any = await prisma.subscription.findMany({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      },
      status: 'ACTIVE'
    },
    include: { plan: true }
  })

  const lastMonthRevenueTotal = lastMonthRevenue.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)
  const currentMonthRevenueTotal = currentMonthRevenue.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)

  const revenueGrowthRate = lastMonthRevenueTotal > 0 
    ? ((currentMonthRevenueTotal - lastMonthRevenueTotal) / lastMonthRevenueTotal * 100).toFixed(1)
    : 0

  // Données pour le graphique des revenus (12 derniers mois)
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
  
  const revenueData = await Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - 11 + i + 1, 0)
      
      const subscriptions: any = await prisma.subscription.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['ACTIVE', 'TRIAL'] }
        },
        include: { plan: true }
      })

      const revenue = subscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)
      
      return {
        month: monthNames[monthStart.getMonth()],
        revenue
      }
    })
  )

  // Activités récentes (écoles et abonnements récents)
  const recentSchools: any = await prisma.school.findMany({
    take: 2,
    orderBy: { createdAt: 'desc' },
    include: { subscription: { include: { plan: true } } }
  })

  const recentSubscriptions: any = await prisma.subscription.findMany({
    take: 2,
    orderBy: { createdAt: 'desc' },
    include: { school: true, plan: true }
  })

  const activities = [
    ...recentSchools.map((school: any) => ({
      id: school.id,
      schoolName: school.name,
      action: `Nouvelle école inscrite`,
      time: formatDistance(school.createdAt, now, { addSuffix: true, locale: fr }),
      type: "subscription" as const
    })),
    ...recentSubscriptions.map((sub: any) => ({
      id: sub.id,
      schoolName: sub.school.name,
      action: `Abonnement ${sub.plan.name} - ${Number(sub.plan.price).toLocaleString()} FCFA`,
      time: formatDistance(sub.createdAt, now, { addSuffix: true, locale: fr }),
      type: sub.status === 'ACTIVE' ? "payment" as const : "subscription" as const
    }))
  ].slice(0, 4)

  // Statistiques des plans
  const totalPlans = await prisma.plan.count()
  const activePlans = await prisma.plan.count({ where: { isActive: true } })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tableau de Bord Super Admin</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">Vue d&apos;ensemble de toutes les écoles et abonnements</p>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs text-white/70">Universités</p>
                <p className="text-xl font-bold">{universityCount}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs text-white/70">Lycées</p>
                <p className="text-xl font-bold">{highSchoolCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Écoles"
          value={totalSchools}
          description={`${activeSchools} actives`}
          icon={School}
          variant="info"
          trend={{ value: Number(growthRate), isPositive: Number(growthRate) > 0 }}
        />
        <StatCard
          title="Total Étudiants"
          value={totalStudents.toLocaleString()}
          description="Tous établissements"
          icon={Users}
          variant="primary"
          trend={{ value: Number(studentGrowthRate), isPositive: Number(studentGrowthRate) > 0 }}
        />
        <StatCard
          title="Revenus Mensuels"
          value={`${totalRevenue.toLocaleString()} F`}
          description={`${activeSubscriptions.length} abonnements`}
          icon={DollarSign}
          variant="success"
          trend={{ value: Number(revenueGrowthRate), isPositive: Number(revenueGrowthRate) > 0 }}
        />
        <StatCard
          title="Croissance"
          value={`${growthRate}%`}
          description="Ce mois-ci"
          icon={TrendingUp}
          variant="warning"
          trend={{ value: Number(growthRate), isPositive: Number(growthRate) > 0 }}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RevenueChart data={revenueData} />
        </div>
        <div className="lg:col-span-3">
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* Liens Rapides - Design amélioré */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-violet-500 dark:border-l-violet-400">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Plans & Tarifs</CardTitle>
                <CardDescription className="text-xs">
                  Gérez les abonnements
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">{totalPlans} plans</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{activePlans} actifs</span>
              </div>
            </div>
            <Link href="/super-admin/plans">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                Gérer les Plans
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Abonnements</CardTitle>
                <CardDescription className="text-xs">
                  Suivi des souscriptions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">{activeSubscriptions.length} actifs</span>
                <span className="text-muted-foreground">{totalRevenue.toLocaleString()} FCFA</span>
              </div>
            </div>
            <Link href="/super-admin/subscriptions">
              <Button className="w-full" variant="outline">
                Voir les Abonnements
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 dark:border-l-blue-400">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <School className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Écoles</CardTitle>
                <CardDescription className="text-xs">
                  Gestion des établissements
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">{totalSchools} écoles</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{activeSchools} actives</span>
              </div>
            </div>
            <Link href="/super-admin/schools">
              <Button className="w-full" variant="outline">
                Voir les Écoles
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
