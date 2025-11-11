import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, CheckCircle, Clock, AlertCircle, Download } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function StudentPaymentsPage({ 
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
        orderBy: { createdAt: 'desc' }
      },
      scholarships: {
        where: { isActive: true }
      }
    }
  })

  if (!student) redirect('/auth/login')

  const totalDue = student.payments.reduce((sum, p) => sum + Number(p.amountDue), 0)
  const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
  const balance = totalDue - totalPaid

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Scolarité & Paiements</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">Gérez vos frais de scolarité et paiements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Total à payer</p>
                <p className="text-responsive-base sm:text-responsive-lg font-bold text-foreground mt-1 sm:mt-2">{totalDue.toLocaleString()}</p>
                <p className="text-responsive-xs text-muted-foreground mt-1">FCFA</p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-xl">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Déjà payé</p>
                <p className="text-responsive-lg sm:text-responsive-xl font-bold text-green-600 dark:text-green-400 mt-1 sm:mt-2">{totalPaid.toLocaleString()}</p>
                <p className="text-responsive-xs text-muted-foreground mt-1">FCFA</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-xl">
                <CheckCircle className="icon-responsive text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-xs font-medium text-muted-foreground">Reste à payer</p>
                <p className="text-responsive-lg sm:text-responsive-xl font-bold text-orange-600 dark:text-orange-400 mt-1 sm:mt-2">{balance.toLocaleString()}</p>
                <p className="text-responsive-xs text-muted-foreground mt-1">FCFA</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-xl">
                <AlertCircle className="icon-responsive text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-responsive-xs font-medium text-muted-foreground">Progression</p>
                <p className="text-responsive-lg sm:text-responsive-xl font-bold text-foreground mt-1 sm:mt-2">
                  {totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0}%
                </p>
                <Progress value={totalDue > 0 ? (totalPaid / totalDue) * 100 : 0} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bourses */}
      {student.scholarships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-lg">Mes Bourses</CardTitle>
            <CardDescription className="text-responsive-sm">Bourses et aides financières actives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {student.scholarships.map((scholarship) => (
                <div key={scholarship.id} className="p-3 sm:p-4 border border-border rounded-lg bg-green-50 dark:bg-green-950/30">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">{scholarship.name}</h3>
                      <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1">{scholarship.reason}</p>
                    </div>
                    <Badge variant="default" className="bg-green-600 dark:bg-green-700 text-responsive-xs self-start">
                      {scholarship.percentage ? `${scholarship.percentage}%` : `${Number(scholarship.amount).toLocaleString()} FCFA`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Historique des Paiements</CardTitle>
          <CardDescription className="text-responsive-sm">Tous vos paiements et échéances</CardDescription>
        </CardHeader>
        <CardContent>
          {student.payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground mb-2">Aucun paiement enregistré</h3>
              <p className="text-responsive-sm text-muted-foreground">Les paiements seront ajoutés par l&apos;administration</p>
            </div>
          ) : (
            <div className="space-y-3">
              {student.payments.map((payment) => {
                const Icon = 
                  payment.status === 'PAID' ? CheckCircle :
                  payment.status === 'OVERDUE' ? AlertCircle : Clock

                const iconColor =
                  payment.status === 'PAID' ? 'text-green-600 dark:text-green-400' :
                  payment.status === 'OVERDUE' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'

                return (
                  <div key={payment.id} className="p-3 sm:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className={`icon-responsive mt-0.5 shrink-0 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">{payment.feeStructure.name}</h3>
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-1">
                            Échéance: {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                            <span className="text-responsive-xs sm:text-responsive-sm">
                              Payé: <span className="font-medium">{Number(payment.amountPaid).toLocaleString()} FCFA</span>
                            </span>
                            <span className="text-responsive-xs sm:text-responsive-sm">
                              Total: <span className="font-medium">{Number(payment.amountDue).toLocaleString()} FCFA</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
                        <Badge 
                          variant={
                            payment.status === 'PAID' ? 'default' :
                            payment.status === 'OVERDUE' ? 'destructive' : 'secondary'
                          }
                          className="text-responsive-xs self-start"
                        >
                          {payment.status === 'PAID' ? 'Payé' :
                           payment.status === 'OVERDUE' ? 'En retard' :
                           payment.status === 'PARTIAL' ? 'Partiel' : 'En attente'}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {payment.status === 'PAID' && (
                            <Button variant="ghost" size="sm" className="text-responsive-xs">
                              <Download className="icon-responsive mr-2" />
                              Reçu
                            </Button>
                          )}
                          {payment.status !== 'PAID' && (
                            <Button size="sm" className="text-responsive-xs">
                              Payer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
