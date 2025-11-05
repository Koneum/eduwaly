import { StatCard } from "@/components/stat-card"
import { Users, UserCheck, UserX, Clock } from "lucide-react"
import StudentsManager from "@/components/school-admin/students-manager"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"

type FeeStructureRow = {
  id: string
  name: string
  amount: unknown
  type: string
  niveau?: string | null
  filiereId?: string | null
  filiere?: { id?: string; nom?: string } | null
}
type PaymentRow = { status: string; amountDue: unknown; amountPaid: unknown; dueDate: Date }
type ScholarshipRow = { id?: string; name?: string; amount?: unknown | null; percentage?: number | null; isActive?: boolean }
type StudentRow = {
  id: string
  studentNumber: string
  enrollmentId?: string | null
  phone?: string | null
  isEnrolled?: boolean
  niveau: string
  user?: { name?: string; email?: string | null } | null
  filiere?: { id?: string; nom?: string } | null
  payments: PaymentRow[]
  scholarships: ScholarshipRow[]
}

export default async function StudentsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params
  
  // Debug: vérifier l'utilisateur connecté
  const currentUser = await getAuthUser()
  console.log('StudentsPage - Current user:', currentUser?.email, 'schoolId:', currentUser?.schoolId)
  console.log('StudentsPage - schoolId from params:', schoolId)

  // Récupérer les informations de l'école
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { schoolType: true, name: true }
  })

  console.log('StudentsPage - school found:', school)

  if (!school) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">École non trouvée</h1>
        <p className="text-muted-foreground mt-2">ID: {schoolId}</p>
      </div>
    )
  }

  // Récupérer les filières de l'école
  const filieres = await prisma.filiere.findMany({
    where: { schoolId },
    select: { id: true, nom: true },
    orderBy: { nom: 'asc' }
  })

  // Récupérer les structures de frais de l'école
  const feeStructuresData: FeeStructureRow[] = await prisma.feeStructure.findMany({
    where: { schoolId },
    include: {
      filiere: {
        select: { nom: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Convertir les Decimal en number pour feeStructures
  const feeStructures = feeStructuresData.map((fee: FeeStructureRow) => ({
    ...fee,
    amount: Number(fee.amount),
    niveau: fee.niveau ?? null,
    filiereId: fee.filiereId ?? null
  }))

  // Récupérer tous les étudiants de l'école
  const studentsData: StudentRow[] = await prisma.student.findMany({
    where: { schoolId },
    include: {
      user: true,
      filiere: true,
      payments: {
        orderBy: { dueDate: 'desc' },
        take: 1
      },
      scholarships: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { studentNumber: 'asc' }
  })

  console.log('StudentsPage - students found:', studentsData.length)

  // Convertir les Decimal en number
  const students = studentsData.map((student: StudentRow) => ({
    ...student,
    payments: student.payments.map((payment: PaymentRow) => ({
      status: payment.status,
      amountDue: Number(payment.amountDue),
      amountPaid: Number(payment.amountPaid),
      dueDate: payment.dueDate
    })),
    scholarships: student.scholarships.map((scholarship: ScholarshipRow) => ({
      id: scholarship.id ?? '',
      type: scholarship.name ?? 'DISCOUNT',
      name: scholarship.name ?? '',
      isActive: scholarship.isActive ?? false,
      amount: scholarship.amount ? Number(scholarship.amount) : null,
      percentage: scholarship.percentage ?? null
    }))
  })).map(s => ({
    ...s,
    enrollmentId: s.enrollmentId ?? '',
    phone: s.phone ?? null,
    isEnrolled: Boolean(s.isEnrolled),
  }))
  .map(s => ({
    ...s,
    user: s.user ? { name: s.user.name ?? 'Non inscrit', email: s.user.email ?? null } : null
  }))
  // Normalize filiere object on fee structures to match FeeStructure type
  const finalFeeStructures = feeStructures.map(f => ({
    ...f,
    filiere: f.filiere ? { nom: f.filiere.nom ?? '' } : null
  }))

  // Ensure student.filiere has required fields
  const finalStudents = students.map(s => ({
    ...s,
    filiere: s.filiere ? { id: s.filiere.id ?? '', nom: s.filiere.nom ?? '' } : null
  }))

  // Calculer les statistiques
  const totalStudents = students.length
  const paidCount = students.filter(s => 
    s.payments[0]?.status === 'PAID'
  ).length
  const pendingCount = students.filter(s => 
    s.payments[0]?.status === 'PENDING' || !s.payments[0]
  ).length
  const lateCount = students.filter(s => 
    s.payments[0]?.status === 'OVERDUE'
  ).length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Gestion des Étudiants</h1>
        <p className="text-muted-foreground mt-2">
          {school.name} - Liste complète des étudiants et leur statut de paiement
        </p>
      </div>

      {/* Debug Info */}
      {students.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800">Aucun étudiant trouvé</h3>
          <p className="text-sm text-yellow-700 mt-1">
            School ID: {schoolId}
          </p>
          <p className="text-sm text-yellow-700">
            Vérifiez que des étudiants ont été créés pour cette école dans la base de données.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Étudiants" value={totalStudents} icon={Users} />
        <StatCard title="Paiements à jour" value={paidCount} icon={UserCheck} className="border-green-200" />
        <StatCard title="En attente" value={pendingCount} icon={Clock} className="border-orange-200" />
        <StatCard title="En retard" value={lateCount} icon={UserX} className="border-red-200" />
      </div>

      {/* Students Table */}
      <StudentsManager 
        students={finalStudents} 
        schoolId={schoolId} 
        schoolType={school.schoolType} 
        filieres={filieres}
        feeStructures={finalFeeStructures}
      />
    </div>
  )
}
