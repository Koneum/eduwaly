import StaffManager from "@/components/school-admin/staff-manager"
import { requireSchoolAccess } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export default async function StaffPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  // Récupérer tous les membres du staff de l'école
  const staffMembers = await prisma.user.findMany({
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

  // Récupérer toutes les permissions disponibles
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion du Personnel</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les membres du personnel et leurs permissions
        </p>
      </div>

      <StaffManager 
        staffMembers={staffMembers} 
        permissions={permissions}
        schoolId={schoolId}
      />
    </div>
  )
}
