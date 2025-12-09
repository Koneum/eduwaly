'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Eye, Users, Clock, GraduationCap, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useEffect, useState, use } from 'react'
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

export default function StatistiquesPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = use(params)
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

  // Calculer les heures supplémentaires totales
  const totalHeuresSupp = filteredEnseignants.reduce((total, ens) => {
    const heuresDues = ens.type === 'PERMANENT' ? 192 : 96
    const heuresEffectuees = ens.emplois.reduce((sum, emploi) => sum + emploi.vh, 0)
    return total + Math.max(0, heuresEffectuees - heuresDues)
  }, 0)

  // Permanents vs Vacataires count
  const permanentsCount = enseignants.filter(e => e.type === 'PERMANENT').length
  const vacatairesCount = enseignants.filter(e => e.type === 'VACATAIRE').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header moderne avec gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 dark:from-indigo-800 dark:via-purple-800 dark:to-purple-900 p-6 sm:p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Gestion des Salaires</h1>
              <p className="text-white/80 mt-1 text-sm sm:text-base">
                Statistiques et heures supplémentaires des enseignants
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-white text-indigo-700' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
            >
              Tous ({totalEnseignants})
            </Button>
            <Button 
              variant={statusFilter === 'PERMANENT' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('PERMANENT')}
              className={statusFilter === 'PERMANENT' ? 'bg-white text-indigo-700' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
            >
              Permanents ({permanentsCount})
            </Button>
            <Button 
              variant={statusFilter === 'VACATAIRE' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setStatusFilter('VACATAIRE')}
              className={statusFilter === 'VACATAIRE' ? 'bg-white text-indigo-700' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
            >
              Vacataires ({vacatairesCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards modernes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-indigo-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Enseignants</p>
                <p className="text-2xl font-bold mt-1">{totalEnseignants}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-50 dark:from-emerald-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Heures Totales</p>
                <p className="text-2xl font-bold mt-1">{totalHeures}h</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-amber-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-50 dark:from-amber-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Heures Supp.</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{totalHeuresSupp}h</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-50 dark:from-purple-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Modules</p>
                <p className="text-2xl font-bold mt-1">{totalModules}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Évolution des heures de cours</CardTitle>
              <CardDescription>Répartition mensuelle des heures dispensées</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#colorGradient)" strokeWidth={2} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Liste des Enseignants */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Liste des Enseignants</CardTitle>
                <CardDescription>{filteredEnseignants.length} enseignant(s) trouvé(s)</CardDescription>
              </div>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher..."
                className="pl-9 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEnseignants.map(enseignant => {
              const heuresDues = enseignant.type === 'PERMANENT' ? 192 : 96
              const heuresEffectuees = enseignant.emplois.reduce((sum, emploi) => sum + emploi.vh, 0)
              const heuresSupp = Math.max(0, heuresEffectuees - heuresDues)
              
              return (
                <Card 
                  key={enseignant.id} 
                  className="group relative overflow-hidden border-l-4 border-l-indigo-500 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/20 to-transparent rounded-bl-full opacity-50" />
                  <CardContent className="p-4 relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-indigo-200 dark:border-indigo-800">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-semibold">
                            {enseignant.nom[0]}{enseignant.prenom[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {enseignant.titre} {enseignant.nom} {enseignant.prenom}
                          </h3>
                          <p className="text-xs text-muted-foreground">{enseignant.grade}</p>
                        </div>
                      </div>
                      <Badge 
                        className={enseignant.type === 'PERMANENT' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0'
                        }
                      >
                        {enseignant.type === 'PERMANENT' ? 'Permanent' : 'Vacataire'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Modules</p>
                        <p className="font-semibold">{enseignant.emplois.length}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Heures</p>
                        <p className="font-semibold">{heuresEffectuees}h</p>
                      </div>
                      <div className={`text-center p-2 rounded-lg ${heuresSupp > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-muted/50'}`}>
                        <p className="text-xs text-muted-foreground">H. Supp</p>
                        <p className={`font-semibold ${heuresSupp > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                          {heuresSupp}h
                        </p>
                      </div>
                    </div>

                    <Link href={`/admin/${schoolId}/statistiques/${enseignant.id}`}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails & Salaire
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredEnseignants.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun enseignant trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
