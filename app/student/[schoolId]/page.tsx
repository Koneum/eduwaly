import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, FileText, TrendingUp, CheckCircle2, DollarSign } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function StudentDashboard({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'STUDENT') redirect('/auth/login')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      filiere: true,
      school: true,
      payments: {
        include: { feeStructure: true },
        orderBy: { createdAt: 'desc' },
        take: 3
      },
      scholarships: {
        where: { isActive: true }
      },
      evaluations: {
        include: { module: true }
      },
      absences: true,
      submissions: {
        include: {
          homework: {
            include: { module: true }
          }
        }
      }
    }
  })

  if (!student) redirect('/auth/login')

  const totalDue = student.payments.reduce((sum, p) => sum + Number(p.amountDue), 0)
  const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
  const balance = totalDue - totalPaid

  // Calculer la moyenne générale
  const totalWeightedSum = student.evaluations.reduce((sum, evaluation) => sum + (evaluation.note * evaluation.coefficient), 0)
  const totalCoef = student.evaluations.reduce((sum, evaluation) => sum + evaluation.coefficient, 0)
  const generalAverage = totalCoef > 0 ? (totalWeightedSum / totalCoef).toFixed(1) : '0.0'

  // Récupérer l'emploi du temps de cette semaine
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1))
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7))
  
  const weekSchedule = await prisma.emploiDuTemps.count({
    where: {
      schoolId: student.schoolId,
      niveau: student.niveau,
      OR: [
        { filiereId: student.filiereId },
        { ueCommune: true }
      ],
      dateDebut: { lte: endOfWeek },
      dateFin: { gte: startOfWeek }
    }
  })

  // Compter les devoirs non soumis
  const allHomework = await prisma.homework.findMany({
    where: {
      module: {
        OR: [
          { filiereId: student.filiereId },
          { isUeCommune: true }
        ]
      },
      dueDate: { gte: new Date() }
    },
    select: { id: true }
  })
  
  const submittedIds = student.submissions.map(s => s.homeworkId)
  const pendingHomework = allHomework.filter(h => !submittedIds.includes(h.id)).length

  // Calculer le taux de présence
  const totalAbsences = student.absences.length
  const totalSessions = await prisma.attendance.count({
    where: {
      module: {
        OR: [
          { filiereId: student.filiereId },
          { isUeCommune: true }
        ]
      }
    }
  })
  const attendanceRate = totalSessions > 0 ? Math.round(((totalSessions - totalAbsences) / totalSessions) * 100) : 100

  // Stats
  const stats = [
    { label: "Moyenne Générale", value: `${generalAverage}/20`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    { label: "Cours cette semaine", value: weekSchedule.toString(), icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Devoirs à rendre", value: pendingHomework.toString(), icon: FileText, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Taux de présence", value: `${attendanceRate}%`, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-100" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Étudiant</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue, {student.user?.name || 'Étudiant'} - {student.filiere?.nom || 'Non assigné'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Scolarité */}
          <Card>
            <CardHeader>
              <CardTitle>Scolarité</CardTitle>
              <CardDescription>Vos paiements et frais scolaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-lg font-bold text-blue-600">{totalDue.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Payé</p>
                    <p className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Reste</p>
                    <p className="text-lg font-bold text-orange-600">{balance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium text-foreground">
                      {totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={totalDue > 0 ? (totalPaid / totalDue) * 100 : 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paiements récents */}
          <Card>
            <CardHeader>
              <CardTitle>Paiements Récents</CardTitle>
              <CardDescription>Vos dernières transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.payments.map((payment) => (
                  <div key={payment.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{payment.feeStructure.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Échéance: {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{Number(payment.amountPaid).toLocaleString()} FCFA</p>
                        <Badge variant={
                          payment.status === 'PAID' ? 'default' :
                          payment.status === 'OVERDUE' ? 'destructive' : 'secondary'
                        }>
                          {payment.status === 'PAID' ? 'Payé' :
                           payment.status === 'OVERDUE' ? 'En retard' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Voir tous les paiements
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bourses */}
          {student.scholarships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mes Bourses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.scholarships.map((scholarship) => (
                  <div key={scholarship.id} className="p-3 border border-border rounded-lg bg-green-50">
                    <div className="font-medium text-foreground text-sm">{scholarship.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{scholarship.reason}</div>
                    <Badge variant="default" className="mt-2">
                      {scholarship.percentage ? `${scholarship.percentage}%` : `${Number(scholarship.amount).toLocaleString()} FCFA`}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/student/${schoolId}/schedule`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Voir emploi du temps
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/student/${schoolId}/homework`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Mes devoirs
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/student/${schoolId}/courses`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ressources de cours
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/student/${schoolId}/payments`}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Effectuer un paiement
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
