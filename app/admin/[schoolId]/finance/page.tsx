import prisma from "@/lib/prisma"

type PaymentRow = {
  id: string
  amountDue: unknown
  amountPaid: unknown
  status: string
  dueDate: Date
  paidAt?: Date | null
  paymentMethod?: string | null
  student: {
    id: string
    user?: { name?: string } | null
    niveau: string
    filiere?: { nom?: string } | null
  }
  feeStructure?: {
    type: string
  } | null
}
import FinanceManager from "@/components/school-admin/finance-manager"

export default async function FinancePage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params

  // Récupérer tous les paiements de l'école
  const paymentsData: PaymentRow[] = await prisma.studentPayment.findMany({
    where: {
      student: {
        schoolId
      }
    },
    include: {
      student: {
        include: {
          user: true,
          filiere: true
        }
      },
      feeStructure: {
        select: {
          type: true
        }
      }
    },
    orderBy: {
      dueDate: 'desc'
    }
  })

  // Convertir les Decimal en number et formater les données
  const payments = paymentsData.map(payment => ({
    id: payment.id,
    amount: Number(payment.amountDue),
    amountPaid: Number(payment.amountPaid),
    status: payment.status,
    dueDate: payment.dueDate,
    paidAt: payment.paidAt ?? null,
    paymentMethod: payment.paymentMethod ?? null,
    feeStructure: payment.feeStructure ?? null,
    student: {
      id: payment.student.id,
      firstName: payment.student.user?.name?.split(' ')[0] || 'Prénom',
      lastName: payment.student.user?.name?.split(' ').slice(1).join(' ') || 'Nom',
      classe: {
        name: payment.student.niveau + (payment.student.filiere ? ` - ${payment.student.filiere.nom}` : '')
      }
    }
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Gestion Financière</h1>
        <p className="text-muted-foreground mt-2">Suivez les revenus et les paiements de votre école</p>
      </div>
      <FinanceManager payments={payments} schoolId={schoolId} />
    </div>
  )
}
