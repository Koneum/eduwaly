'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Award,
  Loader2,
  FileSpreadsheet,
  Download,
  BarChart3,
  GraduationCap,
  Target
} from 'lucide-react'
import { toast } from 'sonner'

interface Filiere {
  id: string
  nom: string
}

interface Module {
  id: string
  nom: string
  semestre: string
  vh: number
}

interface ModuleStat {
  id: string
  nom: string
  semestre: string
  vh: number
  studentCount: number
  average: number | null
  highest: number | null
  lowest: number | null
  passRate: number | null
}

interface StudentReport {
  id: string
  studentNumber: string
  name: string
  niveau: string
  filiere: Filiere | null
  moduleAverages: Record<string, number>
  generalAverage: number | null
  evaluationCount: number
}

interface ClassStats {
  studentCount: number
  evaluatedCount: number
  classAverage: number | null
  highestAverage: number | null
  lowestAverage: number | null
  passRate: number | null
}

interface ClassReportData {
  school: { name: string; type: string }
  filters: { niveau: string | null; filiereId: string | null; moduleId: string | null }
  classStats: ClassStats
  moduleStats: ModuleStat[]
  students: StudentReport[]
  modules: Module[]
  availableFilters: {
    filieres: Filiere[]
    niveaux: string[]
  }
}

export default function ClassReportManager() {
  const [data, setData] = useState<ClassReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    niveau: '',
    filiereId: '',
    moduleId: ''
  })

  const fetchReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.niveau) params.append('niveau', filters.niveau)
      if (filters.filiereId) params.append('filiereId', filters.filiereId)
      if (filters.moduleId) params.append('moduleId', filters.moduleId)

      const response = await fetch(`/api/admin/class-report?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error('Erreur lors du chargement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [filters.niveau, filters.filiereId, filters.moduleId])

  const exportToCSV = () => {
    if (!data) return

    const headers = ['Nom', 'Numéro', 'Niveau', 'Filière', 'Moyenne Générale']
    data.modules.forEach(m => headers.push(m.nom))

    const rows = data.students.map(student => {
      const row = [
        student.name,
        student.studentNumber,
        student.niveau,
        student.filiere?.nom || '-',
        student.generalAverage?.toString() || '-'
      ]
      data.modules.forEach(m => {
        row.push(student.moduleAverages[m.id]?.toString() || '-')
      })
      return row
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bulletin-classe-${filters.niveau || 'tous'}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Export CSV téléchargé')
  }

  const getGradeColor = (average: number | null) => {
    if (average === null) return 'text-muted-foreground'
    if (average >= 16) return 'text-green-600 dark:text-green-400'
    if (average >= 14) return 'text-blue-600 dark:text-blue-400'
    if (average >= 12) return 'text-cyan-600 dark:text-cyan-400'
    if (average >= 10) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getMention = (average: number | null): string => {
    if (average === null) return '-'
    if (average >= 16) return 'TB'
    if (average >= 14) return 'B'
    if (average >= 12) return 'AB'
    if (average >= 10) return 'P'
    return 'AJ'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée</h3>
          <p className="text-sm text-muted-foreground">
            Impossible de charger le bulletin de classe
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              <Select
                value={filters.niveau}
                onValueChange={(value) => setFilters({ ...filters, niveau: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  {data.availableFilters.niveaux.map((niveau) => (
                    <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filière</label>
              <Select
                value={filters.filiereId}
                onValueChange={(value) => setFilters({ ...filters, filiereId: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les filières" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les filières</SelectItem>
                  {data.availableFilters.filieres.map((filiere) => (
                    <SelectItem key={filiere.id} value={filiere.id}>{filiere.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <Select
                value={filters.moduleId}
                onValueChange={(value) => setFilters({ ...filters, moduleId: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {data.modules.map((mod) => (
                    <SelectItem key={mod.id} value={mod.id}>{mod.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{data.classStats.studentCount}</p>
                <p className="text-xs text-muted-foreground">Étudiants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{data.classStats.evaluatedCount}</p>
                <p className="text-xs text-muted-foreground">Évalués</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className={`text-2xl font-bold ${getGradeColor(data.classStats.classAverage)}`}>
                  {data.classStats.classAverage?.toFixed(2) || '-'}
                </p>
                <p className="text-xs text-muted-foreground">Moy. Classe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {data.classStats.highestAverage?.toFixed(2) || '-'}
                </p>
                <p className="text-xs text-muted-foreground">Plus haute</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {data.classStats.lowestAverage?.toFixed(2) || '-'}
                </p>
                <p className="text-xs text-muted-foreground">Plus basse</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {data.classStats.passRate !== null ? `${data.classStats.passRate}%` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Taux réussite</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques par module */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statistiques par Module</CardTitle>
              <CardDescription>Performance des étudiants par matière</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.moduleStats.map((mod) => (
              <Card key={mod.id} className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-sm">{mod.nom}</h4>
                      <p className="text-xs text-muted-foreground">{mod.semestre} • {mod.vh}h</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {mod.studentCount} éval.
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Moyenne</span>
                      <span className={`font-medium ${getGradeColor(mod.average)}`}>
                        {mod.average?.toFixed(2) || '-'}
                      </span>
                    </div>
                    {mod.average !== null && (
                      <Progress value={mod.average * 5} className="h-2" />
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {mod.lowest?.toFixed(1) || '-'}</span>
                      <span>Max: {mod.highest?.toFixed(1) || '-'}</span>
                      <span>Réussite: {mod.passRate ?? '-'}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des étudiants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bulletin de Classe</CardTitle>
              <CardDescription>
                Notes détaillées par étudiant
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun étudiant trouvé avec ces critères</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">Nom</TableHead>
                    <TableHead>N°</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Filière</TableHead>
                    {data.modules.slice(0, 6).map((mod) => (
                      <TableHead key={mod.id} className="text-center min-w-[80px]">
                        <span className="text-xs">{mod.nom.substring(0, 10)}</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold">Moy.</TableHead>
                    <TableHead className="text-center">Mention</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students
                    .sort((a, b) => (b.generalAverage || 0) - (a.generalAverage || 0))
                    .map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        <div className="flex items-center gap-2">
                          {index < 3 && student.generalAverage && student.generalAverage >= 10 && (
                            <Award className={`h-4 w-4 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              'text-amber-600'
                            }`} />
                          )}
                          {student.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {student.studentNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {student.niveau}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.filiere?.nom || '-'}
                      </TableCell>
                      {data.modules.slice(0, 6).map((mod) => (
                        <TableCell key={mod.id} className="text-center">
                          <span className={getGradeColor(student.moduleAverages[mod.id] ?? null)}>
                            {student.moduleAverages[mod.id]?.toFixed(1) || '-'}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <span className={`font-bold ${getGradeColor(student.generalAverage)}`}>
                          {student.generalAverage?.toFixed(2) || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          getMention(student.generalAverage) === 'TB' ? 'default' :
                          getMention(student.generalAverage) === 'B' ? 'default' :
                          getMention(student.generalAverage) === 'AB' ? 'secondary' :
                          getMention(student.generalAverage) === 'P' ? 'outline' :
                          'destructive'
                        }>
                          {getMention(student.generalAverage)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
