/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatCard } from "@/components/stat-card"
import { RecentActivity } from "@/components/recent-activity"
import { RevenueChart } from "@/components/revenue-chart"
import { School, Users, DollarSign, TrendingUp } from "lucide-react"
import prisma from "@/lib/prisma"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { requireSuperAdmin } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboard() {
  await requireSuperAdmin()
  // Statistiques globales
  const totalSchools = await prisma.school.count()
  const activeSchools = await prisma.school.count({ where: { isActive: true } })
  const totalStudents = await prisma.student.count()
  
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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Tableau de Bord Super Admin</h1>
        <p className="text-muted-foreground mt-2">Vue d&apos;ensemble de toutes les écoles et abonnements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Écoles"
          value={totalSchools}
          description={`${activeSchools} actives`}
          icon={School}
          trend={{ value: Number(growthRate), isPositive: Number(growthRate) > 0 }}
        />
        <StatCard
          title="Total Étudiants"
          value={totalStudents.toLocaleString()}
          description="Tous les étudiants"
          icon={Users}
          trend={{ value: Number(studentGrowthRate), isPositive: Number(studentGrowthRate) > 0 }}
        />
        <StatCard
          title="Revenus Mensuels"
          value={`${totalRevenue.toLocaleString()} FCFA`}
          description={`${activeSubscriptions.length} abonnements actifs`}
          icon={DollarSign}
          trend={{ value: Number(revenueGrowthRate), isPositive: Number(revenueGrowthRate) > 0 }}
        />
        <StatCard
          title="Taux de Croissance"
          value={`${growthRate}%`}
          description="Croissance mensuelle"
          icon={TrendingUp}
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
    </div>
  )
}
