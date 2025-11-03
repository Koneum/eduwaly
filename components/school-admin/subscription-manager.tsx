'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Calendar, ArrowRight } from "lucide-react"
import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  interval: string
  maxStudents: number
  maxTeachers: number
  features: string
}

interface Subscription {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  plan: Plan
}

interface SubscriptionManagerProps {
  subscription: Subscription | null
  availablePlans: Plan[]
  schoolId: string
}

export default function SubscriptionManager({ subscription, availablePlans, schoolId }: SubscriptionManagerProps) {
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChangePlan = async () => {
    if (!selectedPlanId) {
      toast.error('Veuillez sélectionner un plan')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/school-admin/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          schoolId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de plan')
      }

      toast.success('Plan changé avec succès')
      setIsChangePlanOpen(false)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Aucun abonnement actif</p>
        </CardContent>
      </Card>
    )
  }

  const features = subscription.plan.features ? JSON.parse(subscription.plan.features) : []

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnement Actuel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-foreground">{subscription.plan.name}</h3>
                <Badge variant={
                  subscription.status === 'ACTIVE' ? 'default' :
                  subscription.status === 'TRIAL' ? 'secondary' : 'destructive'
                }>
                  {subscription.status}
                </Badge>
              </div>
              {subscription.plan.description && (
                <p className="text-muted-foreground">{subscription.plan.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-foreground">Jusqu&apos;à {subscription.plan.maxStudents} étudiants</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-foreground">Jusqu&apos;à {subscription.plan.maxTeachers} enseignants</span>
                </div>
                {features.slice(0, 2).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl font-bold text-foreground">
                {Number(subscription.plan.price).toLocaleString()} FCFA
              </div>
              <div className="text-sm text-muted-foreground">par {subscription.plan.interval}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-medium text-foreground">Date de début</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-medium text-foreground">Date d&apos;expiration</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatDistance(new Date(subscription.currentPeriodEnd), new Date(), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1"
              onClick={() => setIsChangePlanOpen(true)}
            >
              Changer de plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Changer de plan d&apos;abonnement</DialogTitle>
            <DialogDescription>
              Sélectionnez un nouveau plan pour votre école
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans.map((plan) => {
              const planFeatures = plan.features ? JSON.parse(plan.features) : []
              const isCurrentPlan = plan.id === subscription.plan.id
              const isSelected = selectedPlanId === plan.id

              return (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary' : 
                    isCurrentPlan ? 'opacity-50' : 'hover:shadow-lg'
                  }`}
                  onClick={() => !isCurrentPlan && setSelectedPlanId(plan.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge variant="secondary">Actuel</Badge>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-foreground">
                        {Number(plan.price).toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-muted-foreground">par {plan.interval}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>{plan.maxStudents} étudiants max</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>{plan.maxTeachers} enseignants max</span>
                      </div>
                      {planFeatures.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {!isCurrentPlan && (
                      <Button 
                        className="w-full"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPlanId(plan.id)
                        }}
                      >
                        {isSelected ? 'Sélectionné' : 'Sélectionner'}
                        {isSelected && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangePlanOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleChangePlan}
              disabled={isLoading || !selectedPlanId}
            >
              {isLoading ? 'Changement...' : 'Confirmer le changement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
