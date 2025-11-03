import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function ParentPaymentsPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
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
  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
  const paidCount = allPayments.filter(p => p.status === 'PAID').length
  const overdueCount = allPayments.filter(p => p.status === 'OVERDUE').length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scolarité & Paiements</h1>
        <p className="text-muted-foreground mt-2">Gérez les frais de scolarité de vos enfants</p>
      </div>

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
                <p className="text-sm font-medium text-muted-foreground">Paiements à jour</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{paidCount}</p>
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
                <p className="text-sm font-medium text-muted-foreground">En retard</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{overdueCount}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {parent.students.map((student) => {
        const studentTotal = student.payments.reduce((sum, p) => sum + Number(p.amountDue), 0)
        const studentPaid = student.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
        const studentBalance = studentTotal - studentPaid

        return (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{student.user?.name || 'Étudiant'}</CardTitle>
                  <CardDescription>{student.studentNumber} • {student.filiere?.nom}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="text-xl font-bold text-orange-600">{studentBalance.toLocaleString()} FCFA</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {student.payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{payment.feeStructure.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Échéance: {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        payment.status === 'PAID' ? 'default' :
                        payment.status === 'OVERDUE' ? 'destructive' : 'secondary'
                      }>
                        {payment.status === 'PAID' ? 'Payé' :
                         payment.status === 'OVERDUE' ? 'En retard' : 'En attente'}
                      </Badge>
                      {payment.status !== 'PAID' && (
                        <Button size="sm">Payer</Button>
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
  )
}
