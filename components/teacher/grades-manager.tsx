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
    date: new Date().toISOString().split('T')[0]
  })

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
          date: formData.date
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
        date: new Date().toISOString().split('T')[0]
      })
      
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création de l\'évaluation')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes & Absences</h1>
          <p className="text-muted-foreground mt-2">Gérez les notes et les présences de vos étudiants</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer une évaluation
        </Button>  
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes saisies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.totalGrades}</p> 
            <p className="text-sm text-muted-foreground mt-1">Ce trimestre</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Moyenne Classe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{stats.classAverage.toFixed(1)}/20</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalGrades > 0 ? 'Toutes évaluations' : 'Aucune note'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de présence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-link">{stats.attendanceRate}%</p>
            <p className="text-sm text-muted-foreground mt-1">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évaluations Récentes</CardTitle>
          <CardDescription>Dernières notes saisies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {evaluations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune évaluation pour le moment</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une évaluation</DialogTitle>
            <DialogDescription>
              Créez une nouvelle évaluation pour saisir les notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type d&apos;assignation *</Label>
              <Select value={assignmentType} onValueChange={(value: 'INDIVIDUAL' | 'GROUP') => setAssignmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
                  <SelectItem value="GROUP">Par groupe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">{isHighSchool ? 'Classe' : 'Filière'} *</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({...formData, classId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder={isHighSchool ? 'Sélectionner une classe' : 'Sélectionner une filière'} />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Aucune {isHighSchool ? 'classe' : 'filière'} disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type d&apos;évaluation *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrôle">Contrôle</SelectItem>
                  <SelectItem value="Devoir">Devoir</SelectItem>
                  <SelectItem value="Examen">Examen</SelectItem>
                  <SelectItem value="Examen Final">Examen Final</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="TP">Travaux Pratiques</SelectItem>
                  <SelectItem value="Projet">Projet</SelectItem>
                  <SelectItem value="Présentation">Présentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Titre/Sujet *</Label>
              <Input
                id="subject"
                placeholder="Ex: Contrôle Chapitre 3, Examen Semestriel..."
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coefficient">Coefficient</Label>
                <Input
                  id="coefficient"
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  placeholder="1"
                  value={formData.coefficient}
                  onChange={(e) => setFormData({...formData, coefficient: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            {assignmentType === 'GROUP' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Mode Groupe:</strong> Les notes seront attribuées par groupe de travail.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateEvaluation}>
              Créer 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Voir toutes les évaluations */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Toutes les évaluations</DialogTitle>
            <DialogDescription>
              Liste complète de vos évaluations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {evaluations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune évaluation</p>
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
