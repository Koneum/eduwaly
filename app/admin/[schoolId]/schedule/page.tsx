import prisma from "@/lib/prisma"
import { requireSchoolAccess } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { SchedulePageClient } from "@/components/admin/schedule-page-client"


type EmploiModel = {
  id: string
  module: { nom: string }
  enseignant: { nom: string; prenom: string }
  filiere?: { id: string; nom?: string } | null
  vh: number
  joursCours?: string | null
  heureDebut: string
  heureFin: string
  salle: string
  niveau: string
}

export default async function ScheduleManagementPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  const school = await prisma.school.findUnique({
    where: { id: schoolId }
  })

  if (!school) {
    redirect('/admin')
  }

  // Récupérer les emplois du temps
  const emplois = (await prisma.emploiDuTemps.findMany({
    where: { schoolId: schoolId },
    include: {
      module: true,
      enseignant: true,
      filiere: true
    },
    orderBy: { heureDebut: 'asc' },
    take: 50
  })) as unknown as EmploiModel[]

  // Récupérer les enseignants, modules et filières pour le formulaire
  const enseignants = await prisma.enseignant.findMany({
    where: { schoolId: schoolId },
    select: {
      id: true,
      nom: true,
      prenom: true
    }
  })

  const modules = await prisma.module.findMany({
    where: { schoolId: schoolId },
    include: {
      filiere: true
    }
  })

  const filieres = await prisma.filiere.findMany({
    where: { schoolId: schoolId },
    select: {
      id: true,
      nom: true
    }
  })

  return (
    <SchedulePageClient
      emplois={emplois}
      modules={modules}
      enseignants={enseignants}
      filieres={filieres}
      schoolId={schoolId}
      schoolType={school.schoolType}
    />
  )
}
