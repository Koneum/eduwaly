'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, Sparkles, ArrowUpRight, AlertTriangle } from "lucide-react"
import { useRouter } from 'next/navigation'

interface ResourceUsage {
  current: number
  max: number | 'Illimité'
  percentage: number
}

interface PlanUsage {
  planName: string
  planDisplayName: string
  status: string
  students: ResourceUsage
  teachers: ResourceUsage
  documents: ResourceUsage
}

export function PlanUsageCard() {
  const router = useRouter()
  const [usage, setUsage] = useState<PlanUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/school-admin/subscription/usage')
        if (response.ok) {
          const data = await response.json()
          setUsage(data)
        }
      } catch (error) {
        console.error('Erreur chargement usage:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Utilisation du Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'TRIAL': return 'bg-blue-500'
      case 'EXPIRED': return 'bg-red-500'
      case 'CANCELLED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif'
      case 'TRIAL': return 'Essai'
      case 'EXPIRED': return 'Expiré'
      case 'CANCELLED': return 'Annulé'
      default: return status
    }
  }

  const isNearLimit = (percentage: number) => percentage >= 80 && percentage < 100
  const isAtLimit = (percentage: number) => percentage >= 100

  const getProgressColor = (percentage: number) => {
    if (isAtLimit(percentage)) return 'bg-red-500'
    if (isNearLimit(percentage)) return 'bg-amber-500'
    return 'bg-primary'
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Plan & Utilisation</CardTitle>
          </div>
          <Badge className={getStatusColor(usage.status)}>
            {getStatusLabel(usage.status)}
          </Badge>
        </div>
        <CardDescription>
          {usage.planDisplayName} - Suivez votre utilisation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Étudiants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Étudiants</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {usage.students.current} / {usage.students.max}
              </span>
              {isAtLimit(usage.students.percentage) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {usage.students.max !== 'Illimité' && (
            <>
              <div className="relative">
                <Progress 
                  value={usage.students.percentage} 
                  className="h-2"
                />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(usage.students.percentage)}`}
                  style={{ width: `${Math.min(usage.students.percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {usage.students.percentage}% utilisé
              </p>
            </>
          )}
        </div>

        {/* Enseignants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Enseignants</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {usage.teachers.current} / {usage.teachers.max}
              </span>
              {isAtLimit(usage.teachers.percentage) && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {usage.teachers.max !== 'Illimité' && (
            <>
              <div className="relative">
                <Progress 
                  value={usage.teachers.percentage} 
                  className="h-2"
                />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(usage.teachers.percentage)}`}
                  style={{ width: `${Math.min(usage.teachers.percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {usage.teachers.percentage}% utilisé
              </p>
            </>
          )}
        </div>

        {/* Alerte si proche de la limite */}
        {(isNearLimit(usage.students.percentage) || isNearLimit(usage.teachers.percentage)) && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              ⚠️ Vous approchez de vos limites
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Pensez à mettre à niveau votre plan
            </p>
          </div>
        )}

        {/* Alerte si limite atteinte */}
        {(isAtLimit(usage.students.percentage) || isAtLimit(usage.teachers.percentage)) && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              🚫 Limite atteinte
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Vous ne pouvez plus ajouter de ressources
            </p>
          </div>
        )}

        {/* Bouton upgrade */}
        {usage.planName !== 'BUSINESS' && usage.planName !== 'ENTERPRISE' && (
          <Button 
            onClick={() => router.push('/admin/subscription/upgrade')}
            className="w-full"
            variant="outline"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Mettre à niveau
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
