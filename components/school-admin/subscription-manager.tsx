'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircle2, Calendar, CreditCard, ArrowUpCircle, X } from "lucide-react"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { PlanSelector } from "@/components/pricing/PlanSelector"

interface Subscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  plan: {
    id: string
    name: string
    description: string | null
    price: number
    interval: string
    maxStudents: number
    maxTeachers: number
    features: string
  }
}

interface SubscriptionManagerProps {
  subscription: Subscription | null
  schoolId: string
}

export default function SubscriptionManager({ subscription, schoolId }: SubscriptionManagerProps) {
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false)

  if (!subscription) {
    // Aucun abonnement - Afficher le sélecteur de plan
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Aucun abonnement actif</CardTitle>
            <CardDescription className="text-responsive-sm">
              Choisissez un plan pour commencer à utiliser Schooly
            </CardDescription>
          </CardHeader>
        </Card>
        <PlanSelector schoolId={schoolId} />
      </div>
    )
  }

  const features = subscription.plan.features ? JSON.parse(subscription.plan.features) : []

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Abonnement Actuel - Résumé */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-responsive-lg">
                <CreditCard className="h-5 w-5" />
                Abonnement Actuel
              </CardTitle>
              <CardDescription className="mt-1 text-responsive-sm">
                Détails de votre plan d&apos;abonnement
              </CardDescription>
            </div>
            <Badge 
              variant={
                subscription.status === 'ACTIVE' ? 'default' :
                subscription.status === 'TRIAL' ? 'secondary' : 'destructive'
              }
              className="text-responsive-xs w-fit"
            >
              {subscription.status === 'ACTIVE' && (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Plan Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 sm:p-6 bg-primary/5 rounded-lg border border-primary/20">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h3 className="text-responsive-xl font-bold text-foreground">{subscription.plan.name}</h3>
              </div>
              {subscription.plan.description && (
                <p className="text-responsive-sm text-muted-foreground">{subscription.plan.description}</p>
              )}
              <div className="flex flex-wrap gap-3 sm:gap-4 text-responsive-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-foreground">Jusqu&apos;à {subscription.plan.maxStudents} étudiants</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-foreground">Jusqu&apos;à {subscription.plan.maxTeachers} enseignants</span>
                </div>
                {features.slice(0, 2).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-responsive-2xl font-bold text-foreground">
                {Number(subscription.plan.price).toLocaleString()} FCFA
              </div>
              <div className="text-responsive-sm text-muted-foreground">par {subscription.plan.interval}</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-border">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="text-responsive-sm font-medium text-foreground">Date de début</div>
                <div className="text-responsive-xs text-muted-foreground mt-1">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border border-border">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <div className="text-responsive-sm font-medium text-foreground">Date d&apos;expiration</div>
                <div className="text-responsive-xs text-muted-foreground mt-1">
                  {formatDistance(new Date(subscription.currentPeriodEnd), new Date(), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsChangePlanOpen(true)}
              className="w-full sm:w-auto"
            >
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Changer de plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Modal pour changement de plan */}
      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-[95vw] w-full h-[98vh] sm:h-[95vh] p-0 gap-0">
          <DialogHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 border-b sticky top-0 bg-background z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <DialogTitle className="text-responsive-base sm:text-responsive-lg">
                  Changer de plan d&apos;abonnement
                </DialogTitle>
                <DialogDescription className="text-responsive-xs sm:text-responsive-sm mt-1">
                  Comparez les plans et choisissez celui qui convient le mieux à votre établissement
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full hover:bg-muted"
                onClick={() => setIsChangePlanOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 p-3 sm:p-4 md:p-6 pt-3 sm:pt-4">
            <PlanSelector schoolId={schoolId} currentPlan={subscription.plan.name} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
