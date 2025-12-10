'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye } from 'lucide-react'

export interface BulletinListItem {
  id: string
  createdAt: string
  generalAverage: string
  gradingPeriodId: string
  gradingPeriodName: string
  academicYear: string
  filiereId: string | null
  filiereName: string | null
  studentId: string | null
  studentName: string | null
  studentNumber: string | null
}

interface BulletinFilterOption {
  id: string
  label: string
}

interface BulletinsListProps {
  bulletins: BulletinListItem[]
  periods: BulletinFilterOption[]
  filieres: BulletinFilterOption[]
  students: BulletinFilterOption[]
  academicYears: BulletinFilterOption[]
}

export default function BulletinsList({
  bulletins,
  periods,
  filieres,
  students,
  academicYears,
}: BulletinsListProps) {
  const [academicYearId, setAcademicYearId] = useState<string>('all')
  const [periodId, setPeriodId] = useState<string>('all')
  const [filiereId, setFiliereId] = useState<string>('all')
  const [studentId, setStudentId] = useState<string>('all')

  const filtered = useMemo(() => {
    return bulletins.filter((b) => {
      if (academicYearId !== 'all' && b.academicYear !== academicYearId) return false
      if (periodId !== 'all' && b.gradingPeriodId !== periodId) return false
      if (filiereId !== 'all' && b.filiereId !== filiereId) return false
      if (studentId !== 'all' && b.studentId !== studentId) return false
      return true
    })
  }, [bulletins, academicYearId, periodId, filiereId, studentId])

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-responsive-base sm:text-responsive-lg">
          Historique des Bulletins
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-responsive-xs sm:text-responsive-sm">Année scolaire</Label>
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger className="bg-card text-responsive-sm">
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all" className="text-responsive-sm">
                  Toutes les années
                </SelectItem>
                {academicYears.map((y) => (
                  <SelectItem
                    key={y.id}
                    value={y.id}
                    className="text-responsive-sm"
                  >
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-responsive-xs sm:text-responsive-sm">Période</Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger className="bg-card text-responsive-sm">
                <SelectValue placeholder="Toutes les périodes" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all" className="text-responsive-sm">
                  Toutes les périodes
                </SelectItem>
                {periods.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-responsive-sm"
                  >
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-responsive-xs sm:text-responsive-sm">
              Filière / Classe
            </Label>
            <Select value={filiereId} onValueChange={setFiliereId}>
              <SelectTrigger className="bg-card text-responsive-sm">
                <SelectValue placeholder="Toutes les filières" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all" className="text-responsive-sm">
                  Toutes les filières
                </SelectItem>
                {filieres.map((f) => (
                  <SelectItem
                    key={f.id}
                    value={f.id}
                    className="text-responsive-sm"
                  >
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-responsive-xs sm:text-responsive-sm">
              Étudiant
            </Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="bg-card text-responsive-sm">
                <SelectValue placeholder="Tous les étudiants" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all" className="text-responsive-sm">
                  Tous les étudiants
                </SelectItem>
                {students.map((s) => (
                  <SelectItem
                    key={s.id}
                    value={s.id}
                    className="text-responsive-sm"
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tableau */}
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Date</TableHead>
                <TableHead className="text-xs sm:text-sm">Période</TableHead>
                <TableHead className="text-xs sm:text-sm">Filière</TableHead>
                <TableHead className="text-xs sm:text-sm">Étudiant</TableHead>
                <TableHead className="text-xs sm:text-sm text-right">
                  Moyenne
                </TableHead>
                <TableHead className="text-xs sm:text-sm text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground text-xs sm:text-sm py-6"
                  >
                    Aucun bulletin généré pour ces filtres.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs sm:text-sm">
                      {new Date(b.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {b.gradingPeriodName}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {b.filiereName || '—'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {b.studentName
                        ? `${b.studentName} (${b.studentNumber ?? '—'})`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-right">
                      {b.generalAverage}/20
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs sm:text-sm"
                        onClick={() => {
                          window.open(`/api/admin/bulletins/${b.id}/html`, '_blank')
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
