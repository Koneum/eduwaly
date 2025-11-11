"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Save, Image as ImageIcon } from 'lucide-react'

interface School {
  id: string
  name: string
  logo: string | null
}

interface PDFTemplateEditorProps {
  school: School
}

interface TemplateConfig {
  showLogo: boolean
  logoPosition: 'left' | 'center' | 'right'
  headerColor: string
  schoolNameSize: number
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  showStamp: boolean
  footerText: string
  gradeTableStyle: 'simple' | 'detailed'
  showSignatures: boolean
}

export default function PDFTemplateEditor({ school }: PDFTemplateEditorProps) {
  const [config, setConfig] = useState<TemplateConfig>({
    showLogo: true,
    logoPosition: 'left',
    headerColor: '#4F46E5',
    schoolNameSize: 24,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showStamp: true,
    footerText: 'Ce document est officiel et certifié conforme.',
    gradeTableStyle: 'detailed',
    showSignatures: true
  })
  const [isSaving, setIsSaving] = useState(false)

  // Charger la configuration existante
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/admin/pdf-templates?schoolId=${school.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.config) {
            setConfig(data.config)
          }
        }
      } catch (error) {
        console.error('Erreur chargement config:', error)
      }
    }
    loadConfig()
  }, [school.id])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/pdf-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          config
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la sauvegarde')
        return
      }

      toast.success('Template sauvegardé')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
      {/* En-tête */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-responsive-base">En-tête du Bulletin</h3>

          {/* Logo */}
          <div className="flex items-center justify-between">
            <Label className="text-responsive-sm">Afficher le logo</Label>
            <Switch
              checked={config.showLogo}
              onCheckedChange={(checked: boolean) => setConfig({ ...config, showLogo: checked })}
            />
          </div>

          {config.showLogo && (
            <>
              <div>
                <Label className="text-responsive-sm">Position du logo</Label>
                <div className="flex gap-2 mt-2">
                  {(['left', 'center', 'right'] as const).map((pos) => (
                    <Button
                      key={pos}
                      variant={config.logoPosition === pos ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConfig({ ...config, logoPosition: pos })}
                      className="text-responsive-xs"
                    >
                      {pos === 'left' ? 'Gauche' : pos === 'center' ? 'Centre' : 'Droite'}
                    </Button>
                  ))}
                </div>
              </div>

              {!school.logo && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-responsive-xs text-yellow-900 dark:text-yellow-100">
                    <ImageIcon className="h-4 w-4 inline mr-1" />
                    Aucun logo configuré. Ajoutez-en un dans les paramètres de l&apos;école.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Couleur en-tête */}
          <div>
            <Label className="text-responsive-sm">Couleur de l&apos;en-tête</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={config.headerColor}
                onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={config.headerColor}
                onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                className="flex-1 text-responsive-sm"
              />
            </div>
          </div>

          {/* Taille nom école */}
          <div>
            <Label className="text-responsive-sm">Taille du nom de l&apos;école (px)</Label>
            <Input
              type="number"
              value={config.schoolNameSize}
              onChange={(e) => setConfig({ ...config, schoolNameSize: parseInt(e.target.value) })}
              className="text-responsive-sm"
            />
          </div>

          {/* Infos à afficher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-responsive-sm">Afficher l&apos;adresse</Label>
              <Switch
                checked={config.showAddress}
                onCheckedChange={(checked: boolean) => setConfig({ ...config, showAddress: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-responsive-sm">Afficher le téléphone</Label>
              <Switch
                checked={config.showPhone}
                onCheckedChange={(checked: boolean) => setConfig({ ...config, showPhone: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-responsive-sm">Afficher l&apos;email</Label>
              <Switch
                checked={config.showEmail}
                onCheckedChange={(checked: boolean) => setConfig({ ...config, showEmail: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-responsive-sm">Afficher le tampon/cachet</Label>
              <Switch
                checked={config.showStamp}
                onCheckedChange={(checked: boolean) => setConfig({ ...config, showStamp: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des notes */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-responsive-base">Tableau des Notes</h3>

          <div>
            <Label className="text-responsive-sm">Style du tableau</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={config.gradeTableStyle === 'simple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig({ ...config, gradeTableStyle: 'simple' })}
                className="text-responsive-xs"
              >
                Simple
              </Button>
              <Button
                variant={config.gradeTableStyle === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig({ ...config, gradeTableStyle: 'detailed' })}
                className="text-responsive-xs"
              >
                Détaillé
              </Button>
            </div>
            <p className="text-[10px] sm:text-responsive-xs text-muted-foreground mt-1">
              Simple: Matière, Note finale | Détaillé: + Devoirs, Examens, Coefficient
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pied de page */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-responsive-base">Pied de Page</h3>

          <div>
            <Label className="text-responsive-sm">Texte du pied de page</Label>
            <Textarea
              value={config.footerText}
              onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
              rows={2}
              className="text-responsive-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-responsive-sm">Afficher les signatures</Label>
            <Switch
              checked={config.showSignatures}
              onCheckedChange={(checked: boolean) => setConfig({ ...config, showSignatures: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton Sauvegarder */}
      <div className="flex justify-end sticky bottom-0 bg-card pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="text-responsive-sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder le Template'}
        </Button>
      </div>
    </div>
  )
}
