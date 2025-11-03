'use client'

import { useRouter } from 'next/navigation'
import { ScheduleCreatorV2 } from './schedule-creator-v2'

interface Module {
  id: string
  nom: string
  vh: number
  filiere: {
    id: string
    nom: string
  } | null
}

interface Enseignant {
  id: string
  nom: string
  prenom: string
}

interface Filiere {
  id: string
  nom: string
}

interface SchedulePageWrapperProps {
  modules: Module[]
  enseignants: Enseignant[]
  filieres: Filiere[]
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
}

export function SchedulePageWrapper({ modules, enseignants, filieres, schoolId, schoolType }: SchedulePageWrapperProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <ScheduleCreatorV2
      modules={modules}
      enseignants={enseignants}
      filieres={filieres}
      schoolId={schoolId}
      schoolType={schoolType}
      onSuccess={handleSuccess}
    />
  )
}
