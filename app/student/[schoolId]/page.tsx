import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, FileText, TrendingUp, CheckCircle2, DollarSign, Megaphone } from "lucide-react"
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
  const currentDate = new Date()
  const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1))
  const endOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7))
  
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

  // Récupérer les annonces récentes
  const now = new Date()
  const announcements = await prisma.announcement.findMany({
    where: {
      schoolId: student.schoolId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } }
      ]
    },
    orderBy: {
      publishedAt: 'desc'
    },
    take: 3
  }).then(announcements => 
    announcements.filter(a => {
      const audience = a.targetAudience as string[]
      return audience.includes('ALL') || audience.includes('STUDENT')
    })
  )

  // Si le compte étudiant n'est pas encore activé par le paiement de la scolarité
  if (!student.isEnrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-responsive-lg">Compte en attente d&apos;activation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-responsive-sm text-muted-foreground">
              Veuillez payer vos frais de scolarite pour activer votre compte et accéder à votre espace étudiant.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Stats
  const stats = [
    { label: "Moyenne Générale", value: `${generalAverage}/20`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    { label: "Cours cette semaine", value: weekSchedule.toString(), icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Devoirs à rendre", value: pendingHomework.toString(), icon: FileText, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Taux de présence", value: `${attendanceRate}%`, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-100" },
  ]

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Dashboard Étudiant</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
          Bienvenue, {student.user?.name || 'Étudiant'} - {student.filiere?.nom || 'Non assigné'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-responsive-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-2 sm:p-3 rounded-xl`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Annonces */}
      {announcements.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="icon-responsive text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-responsive-lg text-blue-900 dark:text-blue-100">Annonces</CardTitle>
            </div>
            <CardDescription className="text-responsive-sm">Dernières informations importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 sm:p-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">{announcement.title}</h3>
                      <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-responsive-xs text-muted-foreground mt-2">
                        {new Date(announcement.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {announcement.priority === 'HIGH' && (
                      <Badge variant="destructive" className="text-responsive-xs">Urgent</Badge>
                    )}
                    {announcement.priority === 'NORMAL' && (
                      <Badge className="bg-blue-600 dark:bg-blue-700 text-responsive-xs">Normal</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Scolarité */}
          <Card>
            <CardHeader>
              <CardTitle className="text-responsive-lg">Scolarité</CardTitle>
              <CardDescription className="text-responsive-sm">Vos paiements et frais scolaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 sm:p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-responsive-xs text-muted-foreground mb-1">Total</p>
                    <p className="text-responsive-sm sm:text-responsive-base md:text-responsive-lg font-bold text-blue-600 dark:text-blue-400">{totalDue.toLocaleString()}</p>
                    <p className="text-responsive-xs text-muted-foreground">FCFA</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-2 sm:p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-responsive-xs text-muted-foreground mb-1">Payé</p>
                    <p className="text-responsive-sm sm:text-responsive-base md:text-responsive-lg font-bold text-green-600 dark:text-green-400">{totalPaid.toLocaleString()}</p>
                    <p className="text-responsive-xs text-muted-foreground">FCFA</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-2 sm:p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-responsive-xs text-muted-foreground mb-1">Reste</p>
                    <p className="text-responsive-sm sm:text-responsive-base md:text-responsive-lg font-bold text-orange-600 dark:text-orange-400">{balance.toLocaleString()}</p>
                    <p className="text-responsive-xs text-muted-foreground">FCFA</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-responsive-xs">
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
              <CardTitle className="text-responsive-lg">Paiements Récents</CardTitle>
              <CardDescription className="text-responsive-sm">Vos dernières transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {student.payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-responsive-sm text-muted-foreground">Aucun paiement enregistré</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {student.payments.map((payment) => (
                      <div key={payment.id} className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                          <div className="flex-1">
                            <p className="text-responsive-sm sm:text-responsive-base font-medium text-foreground">{payment.feeStructure.name}</p>
                            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1">
                              Échéance: {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                            <p className="text-responsive-base sm:text-responsive-lg font-bold text-primary">{Number(payment.amountPaid).toLocaleString()} FCFA</p>
                            <Badge 
                              variant={
                                payment.status === 'PAID' ? 'default' :
                                payment.status === 'OVERDUE' ? 'destructive' : 'secondary'
                              }
                              className="text-responsive-xs"
                            >
                              {payment.status === 'PAID' ? 'Payé' :
                               payment.status === 'OVERDUE' ? 'En retard' : 
                               payment.status === 'PARTIAL' ? 'Partiel' : 'En attente'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 text-responsive-sm" asChild>
                    <Link href={`/student/${schoolId}/payments`}>
                      Voir tous les paiements
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bourses */}
          {student.scholarships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-responsive-lg">Mes Bourses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.scholarships.map((scholarship) => (
                  <div key={scholarship.id} className="p-3 border border-border rounded-lg bg-green-50 dark:bg-green-950/30">
                    <div className="text-responsive-sm font-medium text-foreground">{scholarship.name}</div>
                    <div className="text-responsive-xs text-muted-foreground mt-1">{scholarship.reason}</div>
                    <Badge variant="default" className="mt-2 bg-green-600 dark:bg-green-700 text-responsive-xs">
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
              <CardTitle className="text-responsive-lg">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start text-responsive-sm" variant="outline" asChild>
                <Link href={`/student/${schoolId}/schedule`}>
                  <Calendar className="icon-responsive mr-2" />
                  Voir emploi du temps
                </Link>
              </Button>
              <Button className="w-full justify-start text-responsive-sm" variant="outline" asChild>
                <Link href={`/student/${schoolId}/homework`}>
                  <FileText className="icon-responsive mr-2" />
                  Mes devoirs
                </Link>
              </Button>
              <Button className="w-full justify-start text-responsive-sm" variant="outline" asChild>
                <Link href={`/student/${schoolId}/courses`}>
                  <BookOpen className="icon-responsive mr-2" />
                  Ressources de cours
                </Link>
              </Button>
              <Button className="w-full justify-start text-responsive-sm" variant="outline" asChild>
                <Link href={`/student/${schoolId}/payments`}>
                  <DollarSign className="icon-responsive mr-2" />
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
