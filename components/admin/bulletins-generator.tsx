"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { FileText, Download, Eye, Settings, Loader2 } from 'lucide-react'
import PDFTemplateEditor from './pdf-template-editor'

interface School {
  id: string
  name: string
  logo: string | null
  address: string | null
  phone: string | null
  email: string | null
  gradingSystem: string
  gradingFormula: string | null
}

interface GradingPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface Student {
  id: string
  studentNumber: string
  niveau: string
  enrollmentYear: number | null
  user: { name: string; email: string } | null
  filiere: { nom: string } | null
}

interface BulletinsGeneratorProps {
  school: School
  gradingPeriods: GradingPeriod[]
  filieres: Array<{ id: string; nom: string }>
  students: Student[]
  isHighSchool: boolean
}

export default function BulletinsGenerator({ 
  school, 
  gradingPeriods, 
  filieres, 
  students,
  isHighSchool 
}: BulletinsGeneratorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Filtrer les étudiants par filière
  const filteredStudents = selectedFiliere === 'all' 
    ? students 
    : students.filter(s => s.filiere?.nom === filieres.find(f => f.id === selectedFiliere)?.nom)

  const handleGenerate = async (action: 'preview' | 'download') => {
    if (!selectedPeriod) {
      toast.error('Veuillez sélectionner une période')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/admin/bulletins/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          periodId: selectedPeriod,
          filiereId: selectedFiliere === 'all' ? null : selectedFiliere,
          studentId: selectedStudent === 'all' ? null : selectedStudent,
          action
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la génération')
        return
      }

      // Si c'est un seul étudiant, l'API retourne du HTML directement
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('text/html')) {
        // Ouvrir le HTML dans une nouvelle fenêtre
        const html = await response.text()
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(html)
          newWindow.document.close()
          toast.success('Bulletin généré avec succès')
        } else {
          toast.error('Veuillez autoriser les pop-ups')
        }
      } else {
        // Plusieurs étudiants - JSON
        const data = await response.json()
        toast.success(`${data.count} bulletin(s) généré(s)`)
        // TODO: Gérer le téléchargement multiple
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la génération')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="generate" className="text-responsive-sm">
            <FileText className="h-4 w-4 mr-2" />
            Générer
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-responsive-sm">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Onglet Génération */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-responsive-base sm:text-responsive-lg">
                Paramètres de Génération
              </CardTitle>
              <CardDescription className="text-responsive-xs sm:text-responsive-sm">
                Sélectionnez les critères pour générer les bulletins
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
              {/* Période */}
              <div>
                <Label className="text-responsive-sm">Période *</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="bg-card text-responsive-sm">
                    <SelectValue placeholder="Sélectionner une période">
                      {selectedPeriod && gradingPeriods.find(p => p.id === selectedPeriod)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {gradingPeriods.length === 0 ? (
                      <div className="p-2 text-center text-responsive-sm text-muted-foreground">
                        Aucune période disponible
                      </div>
                    ) : (
                      gradingPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id} className="text-responsive-sm">
                          {period.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Filière/Classe */}
              <div>
                <Label className="text-responsive-sm">{isHighSchool ? 'Classe' : 'Filière'}</Label>
                <Select value={selectedFiliere} onValueChange={(value) => {
                  setSelectedFiliere(value)
                  setSelectedStudent('all')
                }}>
                  <SelectTrigger className="bg-card text-responsive-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="all" className="text-responsive-sm">
                      Toutes les {isHighSchool ? 'classes' : 'filières'}
                    </SelectItem>
                    {filieres.map((filiere) => (
                      <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                        {filiere.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Étudiant */}
              <div>
                <Label className="text-responsive-sm">Étudiant</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="bg-card text-responsive-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="all" className="text-responsive-sm">
                      Tous les étudiants ({filteredStudents.length})
                    </SelectItem>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id} className="text-responsive-sm">
                        {student.user?.name || 'Étudiant'} - {student.studentNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-responsive-xs text-blue-900 dark:text-blue-100">
                  <strong>Résumé :</strong> {selectedStudent === 'all' ? `${filteredStudents.length} bulletin(s)` : '1 bulletin'} 
                  {' '}sera généré pour {selectedFiliere === 'all' ? 'toutes les filières' : filieres.find(f => f.id === selectedFiliere)?.nom}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={() => handleGenerate('preview')}
                  disabled={isGenerating || !selectedPeriod}
                  variant="outline"
                  className="flex-1 text-responsive-sm"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Aperçu
                </Button>
                <Button
                  onClick={() => handleGenerate('download')}
                  disabled={isGenerating || !selectedPeriod}
                  className="flex-1 text-responsive-sm"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Télécharger PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu */}
          {previewUrl && (
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-responsive-base sm:text-responsive-lg">
                  Aperçu du Bulletin
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] border rounded-lg"
                  title="Aperçu bulletin"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-responsive-base sm:text-responsive-lg">
                Templates de Bulletins
              </CardTitle>
              <CardDescription className="text-responsive-xs sm:text-responsive-sm">
                Personnalisez les templates PDF selon votre abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <Button
                onClick={() => setIsTemplateEditorOpen(true)}
                className="w-full sm:w-auto text-responsive-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Modifier le Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Éditeur de Template */}
      <Dialog open={isTemplateEditorOpen} onOpenChange={setIsTemplateEditorOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-4xl h-[90vh] bg-card">
          <DialogHeader>
            <DialogTitle className="text-responsive-base sm:text-responsive-lg">
              Éditeur de Template PDF
            </DialogTitle>
            <DialogDescription className="text-responsive-xs sm:text-responsive-sm">
              Personnalisez le design de vos bulletins
            </DialogDescription>
          </DialogHeader>
          <PDFTemplateEditor school={school} />
        </DialogContent>
      </Dialog>
    </>
  )
}
