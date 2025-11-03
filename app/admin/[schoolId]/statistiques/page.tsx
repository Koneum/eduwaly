'use client'

import { Card } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FiEye } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Enseignant {
  id: string
  nom: string
  prenom: string
  titre: string
  grade: string
  type: 'PERMANENT' | 'VACATAIRE'
  emplois: Array<{
    id: string
    dateDebut: string
    dateFin: string
    vh: number
    module: {
      id: string
      nom: string
      type: string
      filiere: {
        nom: string
      } | null
    }
  }>
}

// Données pour le graphique des heures de cours par mois
const data = [
  { month: 'Jan', value: 120 },
  { month: 'Fév', value: 140 },
  { month: 'Mar', value: 160 },
  { month: 'Avr', value: 150 },
  { month: 'Mai', value: 180 },
  { month: 'Juin', value: 130 },
  { month: 'Juil', value: 100 },
  { month: 'Aoû', value: 90 },
  { month: 'Sep', value: 170 },
  { month: 'Oct', value: 190 },
  { month: 'Nov', value: 160 },
  { month: 'Déc', value: 140 }
]

export default function StatistiquesPage({ params }: { params: { schoolId: string } }) {
  const schoolId = params.schoolId
  const [enseignants, setEnseignants] = useState<Enseignant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PERMANENT' | 'VACATAIRE'>('all')

  useEffect(() => {
    const fetchEnseignants = async () => {
      try {
        const response = await fetch('/api/enseignants')
        if (!response.ok) throw new Error('Erreur lors du chargement des données')
        const data = await response.json()
        setEnseignants(data)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Erreur lors du chargement des enseignants')
      } finally {
        setLoading(false)
      }
    }

    fetchEnseignants()
  }, [])

  // Filtrer les enseignants
  const filteredEnseignants = enseignants.filter(enseignant => {
    const matchesSearch = (
      enseignant.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enseignant.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enseignant.titre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const matchesStatus = statusFilter === 'all' || enseignant.type === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculer les métriques sur les enseignants filtrés
  const totalEnseignants = filteredEnseignants.length
  const totalHeures = filteredEnseignants.reduce((total, enseignant) => 
    total + enseignant.emplois.reduce((sum, emploi) => sum + emploi.vh, 0)
  , 0)
  const totalModules = new Set(
    filteredEnseignants.flatMap(e => e.emplois.map(em => em.module.id))
  ).size

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 ">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Statistiques des Enseignants</h1>
        <div className="flex gap-2  text-indigo-700">
          <Button variant="outline" className="bg-indigo-50" size="sm" onClick={() => setStatusFilter('all')}>
            Tous
          </Button>
          <Button variant="outline" className="bg-indigo-50" size="sm" onClick={() => setStatusFilter('PERMANENT')}>
            Permanents
          </Button>
          <Button variant="outline" className="bg-indigo-50" size="sm" onClick={() => setStatusFilter('VACATAIRE')}>
            Vacataires
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Total Enseignants</h3>
          <p className="text-2xl">{totalEnseignants}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Total Heures</h3>
          <p className="text-2xl">{totalHeures}h</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Total Modules</h3>
          <p className="text-2xl">{totalModules}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Heures de cours par mois</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#2563eb" fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Liste des Enseignants</h2>
          <input
            type="text"
            placeholder="Rechercher un enseignant..."
            className="px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEnseignants.map(enseignant => (
            <Card key={enseignant.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{enseignant.nom[0]}{enseignant.prenom[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {enseignant.titre} {enseignant.nom} {enseignant.prenom}
                    </h3>
                    <p className="text-sm ">{enseignant.grade}</p>
                  </div>
                </div>
                <Badge variant={enseignant.type === 'PERMANENT' ? 'default' : 'secondary'}>
                  {enseignant.type}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm ">
                  {enseignant.emplois.length} module(s) assigné(s)
                </p>
                <p className="text-sm ">
                  {enseignant.emplois.reduce((sum, emploi) => sum + emploi.vh, 0)}h au total
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Link href={`/admin/${schoolId}/statistiques/${enseignant.id}`}>
                  <Button className="bg-indigo-50" size="sm">
                    <FiEye className="mr-2" />
                    Voir détails
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
