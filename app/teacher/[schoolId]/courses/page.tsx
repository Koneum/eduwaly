import prisma from "@/lib/prisma"
import { getAuthUser } from '@/lib/auth-utils'
import { redirect } from "next/navigation"
import CoursesManagerV2 from "@/components/teacher/courses-manager-v2"

export default async function TeacherCoursesPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const currentUser = await getAuthUser()
  const { schoolId } = await params
  
  if (!currentUser) {
    redirect('/login')
  }

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

  // Récupérer les modules de l'école
  const modules = await prisma.module.findMany({
    where: { schoolId: schoolId },
    include: {
      filiere: true
    },
    orderBy: { nom: 'asc' }
  })

  // Formater les modules
  const formattedModules = modules.map(mod => ({
    id: mod.id,
    nom: mod.nom,
    type: mod.type,
    vh: mod.vh,
    semestre: mod.semestre,
    filiere: mod.filiere ? { nom: mod.filiere.nom } : null
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <CoursesManagerV2 
        modules={formattedModules} 
        schoolId={schoolId}
      />
    </div>
  )
}
