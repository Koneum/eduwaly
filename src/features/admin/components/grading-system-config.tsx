"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Save, Info } from 'lucide-react'

interface GradingSystemConfigProps {
  school: {
    id: string
    gradingSystem: string | null
    gradingFormula: string | null
  }
  isHighSchool: boolean
}

export default function GradingSystemConfig({ school, isHighSchool }: GradingSystemConfigProps) {
  const router = useRouter()
  const [gradingSystem, setGradingSystem] = useState(
    school.gradingSystem || (isHighSchool ? 'TRIMESTER' : 'SEMESTER')
  )
  const [gradingFormula, setGradingFormula] = useState(
    school.gradingFormula || (isHighSchool ? '(examens + devoirs * 2) / 3' : '(examens + devoirs + projets) / 3')
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!gradingFormula.trim()) {
      toast.error('Veuillez entrer une formule de calcul')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/grading/system`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          gradingSystem,
          gradingFormula
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la sauvegarde')
        return
      }

      toast.success('Configuration sauvegardée avec succès')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-responsive-base sm:text-responsive-lg">
          Système de Notation
        </CardTitle>
        <CardDescription className="text-responsive-xs sm:text-responsive-sm">
          Configurez le système de notation et la formule de calcul des notes finales
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
        {/* Système de notation */}
        <div>
          <Label className="text-responsive-sm">Type de système</Label>
          <Select value={gradingSystem} onValueChange={setGradingSystem}>
            <SelectTrigger className="bg-card text-responsive-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="TRIMESTER" className="text-responsive-sm">
                Trimestriel (3 périodes/an) - Recommandé pour lycées
              </SelectItem>
              <SelectItem value="SEMESTER" className="text-responsive-sm">
                Semestriel (2 périodes/an) - Recommandé pour universités
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formule actuelle sauvegardée */}
        {school.gradingFormula && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-responsive-xs font-semibold text-green-900 dark:text-green-100">
                  Formule actuellement configurée :
                </p>
                <code className="block p-2 bg-green-100 dark:bg-green-900/50 rounded text-responsive-sm font-mono text-green-900 dark:text-green-100">
                  {school.gradingFormula}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Formule de calcul */}
        <div>
          <Label className="text-responsive-sm">
            {school.gradingFormula ? 'Modifier la formule de calcul' : 'Formule de calcul des notes finales'}
          </Label>
          <Textarea
            placeholder="Ex: (examens + devoirs * 2) / 3"
            value={gradingFormula}
            onChange={(e) => setGradingFormula(e.target.value)}
            rows={3}
            className="bg-card text-responsive-sm font-mono"
          />
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-responsive-xs text-blue-900 dark:text-blue-100 space-y-1">
                <p className="font-semibold">Variables disponibles :</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">examens</code> - Moyenne des examens</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">devoirs</code> - Moyenne des devoirs</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">projets</code> - Moyenne des projets</li>
                </ul>
                <p className="mt-2">
                  <strong>Exemple lycée :</strong> <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">(examens + devoirs * 2) / 3</code>
                </p>
                <p>
                  <strong>Exemple université :</strong> <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">(examens + devoirs + projets) / 3</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Sauvegarder */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="text-responsive-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
