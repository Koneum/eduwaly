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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scolarité & Paiements</h1>
        <p className="text-muted-foreground mt-2">Gérez vos frais de scolarité et paiements</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total à payer</p>
                <p className="text-2xl font-bold text-foreground mt-2">{totalDue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">FCFA</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Déjà payé</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">FCFA</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reste à payer</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{balance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">FCFA</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progression</p>
                <p className="text-2xl font-bold text-foreground mt-2">
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
            <CardTitle>Mes Bourses</CardTitle>
            <CardDescription>Bourses et aides financières actives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {student.scholarships.map((scholarship) => (
                <div key={scholarship.id} className="p-4 border border-border rounded-lg bg-green-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{scholarship.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{scholarship.reason}</p>
                    </div>
                    <Badge variant="default" className="bg-green-600">
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
          <CardTitle>Historique des Paiements</CardTitle>
          <CardDescription>Tous vos paiements et échéances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {student.payments.map((payment) => {
              const Icon = 
                payment.status === 'PAID' ? CheckCircle :
                payment.status === 'OVERDUE' ? AlertCircle : Clock

              const iconColor =
                payment.status === 'PAID' ? 'text-green-600' :
                payment.status === 'OVERDUE' ? 'text-red-600' : 'text-orange-600'

              return (
                <div key={payment.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{payment.feeStructure.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Échéance: {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            Payé: <span className="font-medium">{Number(payment.amountPaid).toLocaleString()} FCFA</span>
                          </span>
                          <span className="text-sm">
                            Total: <span className="font-medium">{Number(payment.amountDue).toLocaleString()} FCFA</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        payment.status === 'PAID' ? 'default' :
                        payment.status === 'OVERDUE' ? 'destructive' : 'secondary'
                      }>
                        {payment.status === 'PAID' ? 'Payé' :
                         payment.status === 'OVERDUE' ? 'En retard' :
                         payment.status === 'PARTIAL' ? 'Partiel' : 'En attente'}
                      </Badge>
                      {payment.status === 'PAID' && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Reçu
                        </Button>
                      )}
                      {payment.status !== 'PAID' && (
                        <Button size="sm">
                          Payer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
