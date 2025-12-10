'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface FinancialStats {
  totalExpected: number
  totalCollected: number
  totalPending: number
  totalOverdue: number
  studentsCount: number
  paidStudents: number
  pendingStudents: number
  overdueStudents: number
  collectionRate: number
  feeStructuresCount?: number // Nombre de frais configurés
}

interface FinancialDashboardProps {
  stats: FinancialStats
}

export default function FinancialDashboard({ stats }: FinancialDashboardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount)
  }

  const collectionPercentage = stats.totalExpected > 0 
    ? (stats.totalCollected / stats.totalExpected) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">Total Attendu</CardTitle>
            <DollarSign className="icon-responsive text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold">{formatAmount(stats.totalExpected)} FCFA</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">
              Montant total des frais de scolarité
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">Total Collecté</CardTitle>
            <TrendingUp className="icon-responsive text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-success">
              {formatAmount(stats.totalCollected)} FCFA
            </div>
            <p className="text-responsive-xs text-muted-foreground mt-1">
              Paiements reçus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">En Attente</CardTitle>
            <AlertCircle className="icon-responsive text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-chart-5">
              {formatAmount(stats.totalPending)} FCFA
            </div>
            <p className="text-responsive-xs text-muted-foreground mt-1">
              Paiements en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">En Retard</CardTitle>
            <TrendingDown className="icon-responsive text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-red-600">
              {formatAmount(stats.totalOverdue)} FCFA
            </div>
            <p className="text-responsive-xs text-muted-foreground mt-1">
              Paiements en retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Taux de collecte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Taux de Collecte</CardTitle>
          <CardDescription className="text-responsive-sm">
            Pourcentage des frais de scolarité collectés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-responsive-2xl font-bold">{collectionPercentage.toFixed(1)}%</span>
            <Badge variant={collectionPercentage >= 80 ? "default" : collectionPercentage >= 50 ? "secondary" : "destructive"}>
              {collectionPercentage >= 80 ? "Excellent" : collectionPercentage >= 50 ? "Moyen" : "Faible"}
            </Badge>
          </div>
          <Progress value={collectionPercentage} className="h-2" />
          <div className="flex justify-between text-responsive-sm text-muted-foreground">
            <span>{formatAmount(stats.totalCollected)} FCFA collectés</span>
            <span>{formatAmount(stats.totalExpected)} FCFA attendus</span>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques étudiants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">Total Étudiants</CardTitle>
            <Users className="icon-responsive text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold">{stats.studentsCount}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">
              Étudiants inscrits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">À Jour</CardTitle>
            <CheckCircle className="icon-responsive text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-success">{stats.paidStudents}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">
              {stats.studentsCount > 0 
                ? `${((stats.paidStudents / stats.studentsCount) * 100).toFixed(0)}% des étudiants`
                : '0% des étudiants'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-responsive-xs font-medium">En Retard</CardTitle>
            <AlertCircle className="icon-responsive text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-red-600">{stats.overdueStudents}</div>
            <p className="text-responsive-xs text-muted-foreground mt-1">
              {stats.studentsCount > 0 
                ? `${((stats.overdueStudents / stats.studentsCount) * 100).toFixed(0)}% des étudiants`
                : '0% des étudiants'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informations sur les frais configurés */}
      {stats.feeStructuresCount !== undefined && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-responsive-base text-blue-800 flex items-center gap-2">
              <CheckCircle className="icon-responsive" />
              Frais de Scolarité Configurés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-responsive-sm text-link">
              {stats.feeStructuresCount > 0 ? (
                <>
                  Vous avez configuré <strong>{stats.feeStructuresCount}</strong> structure{stats.feeStructuresCount > 1 ? 's' : ''} de frais 
                  pour {stats.studentsCount} étudiant{stats.studentsCount > 1 ? 's' : ''}.
                  {stats.feeStructuresCount === 0 && ' Commencez par configurer vos frais de scolarité.'}
                </>
              ) : (
                <>
                  Aucun frais configuré. Cliquez sur <strong>Configuration</strong> pour définir vos frais de scolarité.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alertes */}
      {stats.overdueStudents > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-responsive-base text-red-800 flex items-center gap-2">
              <AlertCircle className="icon-responsive" />
              Attention : Paiements en Retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-responsive-sm text-red-700">
              {stats.overdueStudents} étudiant{stats.overdueStudents > 1 ? 's ont' : ' a'} des paiements en retard 
              pour un total de {formatAmount(stats.totalOverdue)} FCFA. 
              Pensez à envoyer des rappels de paiement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
