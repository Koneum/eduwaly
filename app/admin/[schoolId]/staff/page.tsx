import StaffManager from "@/components/school-admin/staff-manager"
import { requireSchoolAccess } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export default async function StaffPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  // Récupérer le type d'école
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { schoolType: true }
  })
  const schoolType = school?.schoolType || 'UNIVERSITY'

  // Récupérer tous les membres du staff de l'école
  const staffMembersData = await prisma.user.findMany({
    where: {
      schoolId,
      role: {
        in: ['MANAGER', 'PERSONNEL', 'ASSISTANT', 'SECRETARY']
      }
    },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Mapper les données au format attendu par le composant
  // @ts-ignore - Prisma types will be regenerated
  const staffMembers = staffMembersData.map((member: any) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role as string,
    isActive: member.isActive,
    createdAt: member.createdAt,
    permissions: member.permissions.map((up: any) => ({
      id: up.id,
      permission: {
        id: up.permission.id,
        name: up.permission.name,
        description: up.permission.description,
        category: up.permission.category
      },
      canView: up.canView,
      canCreate: up.canCreate,
      canEdit: up.canEdit,
      canDelete: up.canDelete
    }))
  }))

  // Récupérer toutes les permissions disponibles
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-xl font-bold">Gestion du Personnel</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
          Gérez les membres du personnel et leurs permissions
        </p>
      </div>

      <StaffManager 
        staffMembers={staffMembers} 
        permissions={permissions}
        schoolId={schoolId}
        schoolType={schoolType as 'UNIVERSITY' | 'HIGH_SCHOOL'}
      />
    </div>
  )
}
