import { StatCard } from "@/components/stat-card"
import { PaymentStatusChart } from "@/components/payment-status-chart"
import { Users, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardActions from "@/components/school-admin/dashboard-actions"
import SubscriptionButton from "@/components/school-admin/subscription-button"
import { PlanUsageCard } from "@/components/school-admin/plan-usage-card"
import prisma from "@/lib/prisma"

type PaymentRow = { status: string; amountPaid: unknown; student?: { id: string } }

export default async function AdminSchoolDashboard({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { subscription: { include: { plan: true } } }
  })

  const totalStudents = await prisma.student.count({
    where: { schoolId: schoolId }
  })

  const payments: PaymentRow[] = await prisma.studentPayment.findMany({
    where: { student: { schoolId: schoolId } }
  })

  const paidCount = payments.filter(p => p.status === 'PAID').length
  const overdueCount = payments.filter(p => p.status === 'OVERDUE').length
  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const totalRevenue = payments
    .filter((p) => p.status === 'PAID')
    .reduce<number>((sum, p) => sum + Number(p.amountPaid), 0)

  // Données pour le graphique des paiements
  const paymentStatusData = {
    paid: paidCount,
    overdue: overdueCount,
    pending: pendingCount,
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Tableau de Bord École</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Vue d&apos;ensemble de votre établissement</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Étudiants"
          value={totalStudents}
          description="Étudiants actifs"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Paiements à jour"
          value={paidCount}
          description={payments.length > 0 ? `${Math.round((paidCount / payments.length) * 100)}% des paiements` : 'Aucun paiement'}
          icon={CheckCircle}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Paiements en retard"
          value={overdueCount}
          description={payments.length > 0 ? `${Math.round((overdueCount / payments.length) * 100)}% des paiements` : 'Aucun paiement'}
          icon={AlertCircle}
          trend={{ value: -2, isPositive: true }}
        />
        <StatCard
          title="Revenus ce mois"
          value={`${totalRevenue.toLocaleString()} FCFA`}
          description="Collectés"
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Charts, Quick Actions and Plan Usage */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <PaymentStatusChart data={paymentStatusData} />
        </div>
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <PlanUsageCard />
          <DashboardActions schoolId={schoolId} />
        </div>
      </div>

      {/* Subscription Status */}
      {school?.subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Statut de l&apos;Abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Plan actuel:</span>
                  <Badge variant="default" className="text-sm">
                    {school.subscription.plan.name}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Date d&apos;expiration:</span>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(school.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <Badge variant={school.subscription.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-sm">
                    {school.subscription.status}
                  </Badge>
                </div>
              </div>
              <SubscriptionButton schoolId={schoolId} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
