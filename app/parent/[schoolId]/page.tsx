import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, AlertCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function ParentDashboard() {
  const user = await getAuthUser()
  if (!user || user.role !== 'PARENT') redirect('/auth/login')

  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: true,
          filiere: true,
          payments: {
            include: { feeStructure: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  })

  if (!parent) redirect('/auth/login')

  const allPayments = parent.students.flatMap(s => s.payments)
  const totalDue = allPayments.reduce((sum, p) => sum + Number(p.amountDue), 0)
  // totalPaid not used currently; leave calculation out to satisfy lint
  const paidCount = allPayments.filter(p => p.status === 'PAID').length
  const overdueCount = allPayments.filter(p => p.status === 'OVERDUE').length

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-responsive-xl font-bold text-foreground">Espace Parent</h1>
          <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">{user.name}</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-responsive-xs font-medium">Mes enfants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-responsive-lg sm:text-responsive-xl font-bold">{parent.students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Total à payer</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-responsive-lg sm:text-responsive-xl font-bold">{totalDue.toLocaleString()} FCFA</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-responsive-xs font-medium">Paiements à jour</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-responsive-lg sm:text-responsive-xl font-bold text-green-600">{paidCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-responsive-xs font-medium">En retard</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-responsive-lg sm:text-responsive-xl font-bold text-red-600">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Enfants */}
        {parent.students.map((student) => {
          const studentTotal = student.payments.reduce((sum, p) => sum + Number(p.amountDue), 0)
          const studentPaid = student.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
          const studentBalance = studentTotal - studentPaid

          return (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{student.user?.name ?? student.studentNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {student.studentNumber} • {student.filiere?.nom} • {student.niveau}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Reste à payer</div>
                    <div className="text-xl font-bold text-orange-600">
                      {studentBalance.toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.payments.map((payment) => (
                  <div key={payment.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{payment.feeStructure.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Échéance: {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            Payé: <span className="font-medium">{Number(payment.amountPaid).toLocaleString()} FCFA</span>
                          </span>
                          <span className="text-sm">
                            Total: <span className="font-medium">{Number(payment.amountDue).toLocaleString()} FCFA</span>
                          </span>
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
                        {payment.status !== 'PAID' && (
                          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                            Payer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
