/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/components/revenue-chart"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, School, Users, DollarSign } from "lucide-react"
import prisma from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  await requireSuperAdmin()
  // Statistiques globales
  const totalSchools = await prisma.school.count()
  const activeSchools = await prisma.school.count({ where: { isActive: true } })
  const totalStudents = await prisma.student.count()
  const totalTeachers = await prisma.enseignant.count()

  // Abonnements par statut
  const subscriptionsByStatus: any = await prisma.subscription.groupBy({
    by: ['status'],
    _count: { id: true }
  })

  // Revenus mensuels (derniers 12 mois)
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  
  const subscriptions: any = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: twelveMonthsAgo },
      status: { in: ['ACTIVE', 'TRIAL'] }
    },
    include: { plan: true }
  })

  // Top 5 écoles par nombre d'étudiants
  const topSchools: any = await prisma.school.findMany({
    take: 5,
    include: {
      subscription: { include: { plan: true } },
      _count: {
        select: { 
          students: true,
          enseignants: true
        }
      }
    },
    orderBy: {
      students: { _count: 'desc' }
    }
  })

  // Plans les plus populaires
  const planStats: any = await prisma.subscription.groupBy({
    by: ['planId'],
    _count: { id: true },
    where: { status: 'ACTIVE' }
  })

  const plansWithDetails = await Promise.all(
    planStats.map(async (stat: any) => {
      const plan = await prisma.plan.findUnique({
        where: { id: stat.planId }
      })
      return {
        ...plan,
        count: stat._count.id
      }
    })
  )

  // Calcul du taux de croissance
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

  // Revenus totaux
  const totalRevenue = subscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)

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

  // Calcul de la croissance des enseignants
  const lastMonthTeachers: any = await prisma.enseignant.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
  })

  const currentMonthTeachers: any = await prisma.enseignant.count({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
  })

  const teacherGrowthRate = lastMonthTeachers > 0 
    ? ((currentMonthTeachers - lastMonthTeachers) / lastMonthTeachers * 100).toFixed(1)
    : 0

  // Calcul de la croissance des revenus
  const lastMonthRevenue: any = await prisma.subscription.findMany({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        lt: new Date(now.getFullYear(), now.getMonth(), 1)
      },
      status: { in: ['ACTIVE', 'TRIAL'] }
    },
    include: { plan: true }
  })

  const currentMonthRevenueData: any = await prisma.subscription.findMany({
    where: {
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      },
      status: { in: ['ACTIVE', 'TRIAL'] }
    },
    include: { plan: true }
  })

  const lastMonthRevenueTotal = lastMonthRevenue.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)
  const currentMonthRevenueTotal = currentMonthRevenueData.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)

  const revenueGrowthRate = lastMonthRevenueTotal > 0 
    ? ((currentMonthRevenueTotal - lastMonthRevenueTotal) / lastMonthRevenueTotal * 100).toFixed(1)
    : 0

  // Données pour le graphique des revenus (12 derniers mois)
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
  
  const revenueData = await Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - 11 + i + 1, 0)
      
      const monthSubscriptions: any = await prisma.subscription.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['ACTIVE', 'TRIAL'] }
        },
        include: { plan: true }
      })

      const revenue = monthSubscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0)
      
      return {
        month: monthNames[monthStart.getMonth()],
        revenue
      }
    })
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Analytics & Statistiques</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">Analyse détaillée des performances et tendances</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats principales */}
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
          description="Tous les étudiants"
          icon={Users}
          variant="primary"
          trend={{ value: Number(studentGrowthRate), isPositive: Number(studentGrowthRate) > 0 }}
        />
        <StatCard
          title="Revenus Mensuels"
          value={`${totalRevenue.toLocaleString()} F`}
          description="Abonnements actifs"
          icon={DollarSign}
          variant="success"
          trend={{ value: Number(revenueGrowthRate), isPositive: Number(revenueGrowthRate) > 0 }}
        />
        <StatCard
          title="Enseignants"
          value={totalTeachers}
          description="Total enseignants"
          icon={Users}
          variant="warning"
          trend={{ value: Number(teacherGrowthRate), isPositive: Number(teacherGrowthRate) > 0 }}
        />
      </div>

      {/* Graphique des revenus */}
      <RevenueChart data={revenueData} />

      {/* Abonnements par statut */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Abonnements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionsByStatus.map((stat: any) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      stat.status === 'ACTIVE' ? 'default' :
                      stat.status === 'TRIAL' ? 'secondary' :
                      stat.status === 'PAST_DUE' ? 'destructive' : 'outline'
                    }>
                      {stat.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stat.status === 'ACTIVE' ? 'Actifs' :
                       stat.status === 'TRIAL' ? 'Essai' :
                       stat.status === 'PAST_DUE' ? 'En retard' :
                       stat.status === 'CANCELED' ? 'Annulés' : 'Impayés'}
                    </span>
                  </div>
                  <span className="text-2xl font-bold">{stat._count.id}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plans Populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plansWithDetails.map((plan) => (
                <div key={plan?.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{plan?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {Number(plan?.price).toLocaleString()} FCFA / {plan?.interval === 'monthly' ? 'mois' : 'an'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{plan?.count}</div>
                    <div className="text-xs text-muted-foreground">écoles</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top écoles */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Écoles par Nombre d&apos;Étudiants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>École</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Étudiants</TableHead>
                  <TableHead className="text-right">Enseignants</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSchools.map((school: any, index: number) => (
                  <TableRow key={school.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-muted-foreground">{school.subdomain}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {school.subscription?.plan.name || 'Aucun'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {school._count.students}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {school._count.enseignants}
                    </TableCell>
                    <TableCell>
                      <Badge variant={school.isActive ? 'default' : 'destructive'}>
                        {school.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de Croissance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">{growthRate}%</div>
              {Number(growthRate) > 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {currentMonthSchools} nouvelles écoles ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ratio Étudiants/Enseignants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : 0}:1
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Moyenne globale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux d&apos;Activation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalSchools > 0 ? ((activeSchools / totalSchools) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {activeSchools} écoles sur {totalSchools}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
