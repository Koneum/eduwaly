'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import GradeInputDialog from './grade-input-dialog'

interface Evaluation {
  id: string
  type: string
  subject: string
  date: Date
  coefficient: number
  classId: string
  className: string
  averageGrade?: number
}

interface GradesManagerProps {
  evaluations: Evaluation[]
  stats: {
    totalGrades: number
    classAverage: number
    attendanceRate: number
  }
  classes: Array<{ id: string; name: string }>
  isHighSchool?: boolean
}

export default function GradesManager({ evaluations, stats, classes, isHighSchool = false }: GradesManagerProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewAllOpen, setIsViewAllOpen] = useState(false)
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null)
  const [assignmentType, setAssignmentType] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL')
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    coefficient: '',
    classId: '',
    date: new Date().toISOString().split('T')[0],
    maxPoints: '20' // Barème par défaut /20
  })

  const baremeOptions = [
    { value: '5', label: '/5' },
    { value: '8', label: '/8' },
    { value: '10', label: '/10' },
    { value: '12', label: '/12' },
    { value: '15', label: '/15' },
    { value: '20', label: '/20' },
    { value: '40', label: '/40' },
    { value: '100', label: '/100' },
  ]

  const handleCreateEvaluation = async () => {
    if (!formData.type || !formData.subject || !formData.classId) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const response = await fetch('/api/teacher/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          subject: formData.subject,
          coefficient: formData.coefficient || '1',
          classId: formData.classId,
          date: formData.date,
          maxPoints: formData.maxPoints || '20'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
        return
      }

      const data = await response.json()
      toast.success(data.message || 'Évaluation créée avec succès')
      setIsAddDialogOpen(false)
      
      // Réinitialiser le formulaire
      setFormData({
        type: '',
        subject: '',
        coefficient: '',
        classId: '',
        date: new Date().toISOString().split('T')[0],
        maxPoints: '20'
      })
      
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création de l\'évaluation')
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div>
          <h1 className="heading-responsive-h1">Notes & Absences</h1>
          <p className="text-responsive-sm text-muted-foreground mt-2">Gérez les notes et les présences de vos étudiants</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Créer une évaluation
        </Button>  
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-sm font-medium text-muted-foreground">Notes saisies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-responsive-3xl font-bold text-foreground">{stats.totalGrades}</p> 
            <p className="text-responsive-sm text-muted-foreground mt-1">Ce trimestre</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-sm font-medium text-muted-foreground">Moyenne Classe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-responsive-3xl font-bold text-success">{stats.classAverage.toFixed(1)}/20</p>
            <p className="text-responsive-sm text-muted-foreground mt-1">
              {stats.totalGrades > 0 ? 'Toutes évaluations' : 'Aucune note'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-responsive-sm font-medium text-muted-foreground">Taux de présence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-responsive-3xl font-bold text-link">{stats.attendanceRate}%</p>
            <p className="text-responsive-sm text-muted-foreground mt-1">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Évaluations Récentes</CardTitle>
          <CardDescription className="text-responsive-sm">Dernières notes saisies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {evaluations.length === 0 ? (
              <p className="text-center text-responsive-sm text-muted-foreground py-6 sm:py-8">Aucune évaluation pour le moment</p>
            ) : (
              evaluations.slice(0, 3).map((evaluation) => (
                <div 
                  key={evaluation.id} 
                  className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedEvaluation(evaluation)
                    setIsGradeDialogOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{evaluation.className} - {evaluation.subject}</h3>
                        <Badge variant="outline">{evaluation.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evaluation.date).toLocaleDateString('fr-FR')} • Coef. {evaluation.coefficient}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {evaluation.averageGrade ? `${evaluation.averageGrade.toFixed(1)}/20` : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">Moyenne</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setIsViewAllOpen(true)}
          >
            Voir toutes les évaluations
          </Button>
        </CardContent>
      </Card>

      {/* Dialog Saisir des notes */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Créer une évaluation</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Créez une nouvelle évaluation pour saisir les notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label className="text-responsive-sm">Type d&apos;assignation *</Label>
              <Select value={assignmentType} onValueChange={(value: 'INDIVIDUAL' | 'GROUP') => setAssignmentType(value)}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL" className="text-responsive-sm">Individuel</SelectItem>
                  <SelectItem value="GROUP" className="text-responsive-sm">Par groupe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class" className="text-responsive-sm">{isHighSchool ? 'Classe' : 'Filière'} *</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({...formData, classId: value})}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue placeholder={isHighSchool ? 'Sélectionner une classe' : 'Sélectionner une filière'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id} className="text-responsive-sm">
                        {cls.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-responsive-sm">
                      Aucune {isHighSchool ? 'classe' : 'filière'} disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-responsive-sm">Type d&apos;évaluation *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrôle" className="text-responsive-sm">Contrôle</SelectItem>
                  <SelectItem value="Devoir" className="text-responsive-sm">Devoir</SelectItem>
                  <SelectItem value="Examen" className="text-responsive-sm">Examen</SelectItem>
                  <SelectItem value="Examen Final" className="text-responsive-sm">Examen Final</SelectItem>
                  <SelectItem value="Quiz" className="text-responsive-sm">Quiz</SelectItem>
                  <SelectItem value="TP" className="text-responsive-sm">Travaux Pratiques</SelectItem>
                  <SelectItem value="Projet" className="text-responsive-sm">Projet</SelectItem>
                  <SelectItem value="Présentation" className="text-responsive-sm">Présentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-responsive-sm">Titre/Sujet *</Label>
              <Input
                id="subject"
                placeholder="Ex: Contrôle Chapitre 3, Examen Semestriel..."
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPoints" className="text-responsive-sm">Barème *</Label>
                <Select value={formData.maxPoints} onValueChange={(value) => setFormData({...formData, maxPoints: value})}>
                  <SelectTrigger className="text-responsive-sm">
                    <SelectValue placeholder="/20" />
                  </SelectTrigger>
                  <SelectContent>
                    {baremeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-responsive-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coefficient" className="text-responsive-sm">Coefficient</Label>
                <Input
                  id="coefficient"
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  placeholder="1"
                  value={formData.coefficient}
                  onChange={(e) => setFormData({...formData, coefficient: e.target.value})}
                  className="text-responsive-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-responsive-sm">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="text-responsive-sm"
                />
              </div>
            </div>

            {assignmentType === 'GROUP' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-responsive-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Mode Groupe:</strong> Les notes seront attribuées par groupe de travail.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleCreateEvaluation} className="w-full sm:w-auto">
              Créer 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Voir toutes les évaluations */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Toutes les évaluations</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Liste complète de vos évaluations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 sm:space-y-3 max-h-[500px] overflow-y-auto">
            {evaluations.length === 0 ? (
              <p className="text-center text-responsive-sm text-muted-foreground py-6 sm:py-8">Aucune évaluation</p>
            ) : (
              evaluations.map((evaluation) => (
                <div 
                  key={evaluation.id} 
                  className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedEvaluation(evaluation)
                    setIsGradeDialogOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{evaluation.className} - {evaluation.subject}</h3>
                        <Badge variant="outline">{evaluation.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evaluation.date).toLocaleDateString('fr-FR')} • Coef. {evaluation.coefficient}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {evaluation.averageGrade ? `${evaluation.averageGrade.toFixed(1)}/20` : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">Moyenne</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Saisir les notes */}
      <GradeInputDialog
        open={isGradeDialogOpen}
        onOpenChange={setIsGradeDialogOpen}
        evaluation={selectedEvaluation}
      />
    </>
  )
}
