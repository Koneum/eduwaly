import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import { AttendanceManager } from "@/components/teacher/attendance-manager"

export default async function AttendanceManagementPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const currentUser = await getAuthUser()
  const { schoolId } = await params
  
  if (!currentUser) {
    redirect('/login')
  }

  // Récupérer l'enseignant connecté
  const teacher = await prisma.enseignant.findFirst({
    where: {
      userId: currentUser.id,
      schoolId: schoolId
    },
    include: {
      school: true
    }
  })

  if (!teacher) {
    return <div className="p-8">Enseignant non trouvé</div>
  }

  // Récupérer tous les modules de l'école (pas seulement ceux de l'emploi du temps)
  const allModules = await prisma.module.findMany({
    where: {
      schoolId: schoolId
    },
    include: {
      filiere: true
    }
  })

  const modules = allModules.map(m => ({
    id: m.id,
    nom: m.nom,
    filiere: m.filiere ? {
      id: m.filiere.id,
      nom: m.filiere.nom
    } : { id: '', nom: 'Sans filière' }
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AttendanceManager modules={modules} />
    </div>
  )
}
