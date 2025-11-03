import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import { HomeworkManagerV2 } from "@/components/teacher/homework-manager-v2"

export default async function HomeworkManagementPage({ 
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

  const modules = allModules
    .filter(m => m.filiere !== null) // Filtrer les modules sans filière
    .map(m => ({
      id: m.id,
      nom: m.nom,
      filiere: {
        id: m.filiere!.id,
        nom: m.filiere!.nom
      }
    }))

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <HomeworkManagerV2 
        modules={modules} 
        schoolType={teacher.school.schoolType}
      />
    </div>
  )
}
