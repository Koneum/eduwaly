import FinancialDashboard from "@/components/school-admin/financial-dashboard"
import prisma from "@/lib/prisma"
import { requireAdminDashboardAccess } from "@/lib/auth-utils"
// Button import removed (unused)
import Link from "next/link"
import { Settings, FileText, Users } from "lucide-react"
import { PermissionButton } from '@/components/permission-button'

export default async function FinancialOverviewPage({ params }: { params: Promise<{ schoolId: string }> }) {
  await requireAdminDashboardAccess()
  const { schoolId } = await params

  // Récupérer les structures de frais configurées
  type FeeStructureRow = { amount: unknown }
  const feeStructures: FeeStructureRow[] = await prisma.feeStructure.findMany({
    where: { schoolId, isActive: true }
  })

  // Récupérer tous les étudiants
  const students = await prisma.student.findMany({
    where: { schoolId },
    select: { id: true }
  })

  // Récupérer tous les paiements
  type PaymentRow = { amountDue: unknown; amountPaid: unknown; status: string; student: { id: string } }
  const payments: PaymentRow[] = await prisma.studentPayment.findMany({
    where: {
      student: {
        schoolId
      }
    },
    select: {
      amountDue: true,
      amountPaid: true,
      status: true,
      student: {
        select: {
          id: true
        }
      }
    }
  })

  // Calculer le total attendu basé sur les frais configurés
  const totalFeeStructures = feeStructures.reduce<number>((sum, fee) => sum + Number(fee.amount), 0)
  const totalExpectedFromFees = totalFeeStructures * students.length

  // Calculer les statistiques des paiements
  const totalCollected = payments.reduce<number>((sum, p) => sum + Number(p.amountPaid), 0)
  const totalExpectedFromPayments = payments.reduce<number>((sum, p) => sum + Number(p.amountDue), 0)
  
  // Utiliser le maximum entre les frais configurés et les paiements enregistrés
  const totalExpected = Math.max(totalExpectedFromFees, totalExpectedFromPayments)
  
  const paidPayments = payments.filter(p => p.status === 'PAID')
  const pendingPayments = payments.filter(p => p.status === 'PENDING')
  const overduePayments = payments.filter(p => p.status === 'OVERDUE')
  
  const totalPending = pendingPayments.reduce<number>((sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid)), 0)
  const totalOverdue = overduePayments.reduce<number>((sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid)), 0)

  // Compter les étudiants uniques
  const uniqueStudents = new Set(payments.map(p => p.student.id))
  const paidStudents = new Set(paidPayments.map(p => p.student.id))
  const overdueStudents = new Set(overduePayments.map(p => p.student.id))

  const stats = {
    totalExpected,
    totalCollected,
    totalPending,
    totalOverdue,
    studentsCount: students.length, // Total des étudiants inscrits
    paidStudents: paidStudents.size,
    pendingStudents: uniqueStudents.size - paidStudents.size - overdueStudents.size,
    overdueStudents: overdueStudents.size,
    collectionRate: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
    feeStructuresCount: feeStructures.length // Nombre de frais configurés
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
        <div>
          <h1 className="text-responsive-xl font-bold text-foreground">Vue d&apos;ensemble Financière</h1>
          <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
            Tableau de bord des paiements et statistiques financières
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href={`/admin/${schoolId}/finance-settings`} className="w-full sm:w-auto">
            <PermissionButton category="finance" action="edit" variant="outline" className="w-full text-responsive-sm">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </PermissionButton>
          </Link>
          <Link href={`/admin/${schoolId}/finance`} className="w-full sm:w-auto">
            <PermissionButton category="finance" action="view" className="w-full text-responsive-sm">
              <FileText className="mr-2 h-4 w-4" />
              Tous les Paiements
            </PermissionButton>
          </Link>
        </div>
      </div>

      {/* Dashboard */}
      <FinancialDashboard stats={stats} />

      {/* Actions rapides */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Link href={`/admin/${schoolId}/students`}>
          <PermissionButton 
            category="students" 
            action="view" 
            variant="outline" 
            className="w-full h-16 sm:h-20 flex flex-col gap-2 text-responsive-xs"
          >
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Gérer les Étudiants</span>
          </PermissionButton>
        </Link>
        <Link href={`/admin/${schoolId}/finance?action=add-payment`}>
          <PermissionButton 
            category="finance" 
            action="create" 
            variant="outline" 
            className="w-full h-16 sm:h-20 flex flex-col gap-2 text-responsive-xs"
          >
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Enregistrer un Paiement</span>
          </PermissionButton>
        </Link>
        <Link href={`/admin/${schoolId}/finance?action=send-reminders`}>
          <PermissionButton 
            category="finance" 
            action="edit" 
            variant="outline" 
            className="w-full h-16 sm:h-20 flex flex-col gap-2 text-responsive-xs"
          >
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Envoyer des Rappels</span>
          </PermissionButton>
        </Link>
      </div>
    </div>
  )
}
