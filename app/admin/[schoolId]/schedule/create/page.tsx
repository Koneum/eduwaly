'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ScheduleCreatorV2 } from '@/components/admin/schedule-creator-v2'
import { Loader2 } from 'lucide-react'

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

interface InitialData {
  id?: string
  moduleId: string
  enseignantId: string
  filiereId: string
  niveau: string
  semestre: string
  salle: string
  heureDebut: string
  heureFin: string
  joursCours: string
  vh: number
  schoolId?: string
}

export default function CreateSchedulePage({ params }: { params: { schoolId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  const [initialData, setInitialData] = useState<InitialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [modules, setModules] = useState<Module[]>([])
  const [enseignants, setEnseignants] = useState<Enseignant[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [schoolType, setSchoolType] = useState<'UNIVERSITY' | 'HIGH_SCHOOL'>('UNIVERSITY')

  useEffect(() => {
    if (isEditMode) {
      const data = localStorage.getItem('editingSchedule')
      if (data) {
        setInitialData(JSON.parse(data))
      }
      // Nettoyer le localStorage après utilisation
      return () => {
        localStorage.removeItem('editingSchedule')
      }
    }
    setLoading(false)
  }, [isEditMode])

  useEffect(() => {
    // Charger les données nécessaires
    const fetchData = async () => {
      try {
        const schoolId = params.schoolId
        
        // Récupérer les informations de l'école
        const schoolResponse = await fetch(`/api/admin/schools/${schoolId}`)
        if (schoolResponse.ok) {
          const schoolData = await schoolResponse.json()
          setSchoolType(schoolData.schoolType)
        }

        // Récupérer les modules
        const modulesResponse = await fetch(`/api/admin/modules?schoolId=${schoolId}`)
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json()
          setModules(modulesData)
        }

        // Récupérer les enseignants
        const enseignantsResponse = await fetch(`/api/admin/enseignants?schoolId=${schoolId}`)
        if (enseignantsResponse.ok) {
          const enseignantsData = await enseignantsResponse.json()
          setEnseignants(enseignantsData)
        }

        // Récupérer les filières
        const filieresResponse = await fetch(`/api/admin/filieres?schoolId=${schoolId}`)
        if (filieresResponse.ok) {
          const filieresData = await filieresResponse.json()
          setFilieres(filieresData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchData()
  }, [params.schoolId])

  const handleSuccess = () => {
    router.push(`/admin/${params.schoolId}/schedule`)
  }

  const handleCancel = () => {
    router.push(`/admin/${params.schoolId}/schedule`)
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <ScheduleCreatorV2
        schoolId={params.schoolId}
        schoolType={schoolType}
        initialData={initialData || undefined}
        isEditing={isEditMode}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        modules={modules}
        enseignants={enseignants}
        filieres={filieres}
      />
    </div>
  )
}
