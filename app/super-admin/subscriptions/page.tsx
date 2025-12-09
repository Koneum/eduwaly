import prisma from "@/lib/prisma"
import SubscriptionsManager from "@/components/super-admin/subscriptions-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { CreditCard, CheckCircle, Clock, AlertTriangle, DollarSign } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  await requireSuperAdmin()
  
  const subscriptionsData = await prisma.subscription.findMany({
    include: {
      school: true,
      plan: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const plansData = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  // Stats
  const now = new Date()
  const totalSubs = subscriptionsData.length
  const activeSubs = subscriptionsData.filter(s => s.status === 'ACTIVE').length
  const trialSubs = subscriptionsData.filter(s => s.status === 'TRIAL').length
  const expiringSoon = subscriptionsData.filter(s => {
    const daysLeft = Math.ceil((s.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 7 && daysLeft > 0
  }).length
  const totalRevenue = subscriptionsData
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + Number(s.plan.price), 0)

  // Convertir les Decimal en number pour les composants client
  const plans = plansData.map(plan => ({
    ...plan,
    price: Number(plan.price)
  }))

  const subscriptions = subscriptionsData.map(sub => ({
    ...sub,
    plan: {
      ...sub.plan,
      price: Number(sub.plan.price)
    }
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CreditCard className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Gestion des Abonnements</h1>
                <p className="text-white/80 mt-1 text-sm md:text-base">Suivi et gestion des souscriptions</p>
              </div>
            </div>
          </div>
          
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <CreditCard className="h-3.5 w-3.5" />
                Total
              </div>
              <p className="text-2xl font-bold">{totalSubs}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Actifs
              </div>
              <p className="text-2xl font-bold">{activeSubs}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                Essai
              </div>
              <p className="text-2xl font-bold">{trialSubs}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Expirent
              </div>
              <p className="text-2xl font-bold">{expiringSoon}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center col-span-2 md:col-span-1">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                Revenus
              </div>
              <p className="text-lg font-bold">{totalRevenue.toLocaleString()} F</p>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionsManager initialSubscriptions={subscriptions} plans={plans} />
    </div>
  )
}
