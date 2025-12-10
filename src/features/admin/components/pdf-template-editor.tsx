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
  const [previewHtml, setPreviewHtml] = useState<string>('')

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

  // Générer un HTML de prévisualisation léger côté client
  useEffect(() => {
    const sampleData = {
      student: {
        name: 'Moussa Koné',
        studentNumber: 'ETU-2024-001',
        filiere: 'Informatique',
        niveau: 'L1',
      },
      period: 'Semestre 1',
      modules: [
        { module: 'Algèbre', avgDevoirs: '14.50', avgExamens: '13.00', finalGrade: '13.75' },
        { module: 'Programmation', avgDevoirs: '15.00', avgExamens: '16.00', finalGrade: '15.50' },
      ],
      generalAverage: '14.60',
    }

    const logoHTML = config.showLogo && school.logo
      ? `<div style="text-align: ${config.logoPosition}; margin-bottom: 10px;">
          <img src="${school.logo}" alt="Logo" style="max-width: 140px; max-height: 70px; object-fit: contain;" />
        </div>`
      : ''

    const stampHTML = config.showStamp
      ? `<div style="position:absolute; top: 20px; right: 20px; opacity: 0.5; border-radius: 999px; border: 2px dashed #999; width: 80px; height: 80px;"></div>`
      : ''

    const tableHeader = config.gradeTableStyle === 'simple'
      ? `
        <tr>
          <th>Module</th>
          <th style="text-align:center;">Moyenne</th>
        </tr>
      `
      : `
        <tr>
          <th>Module</th>
          <th style="text-align:center;">Devoirs</th>
          <th style="text-align:center;">Examens</th>
          <th style="text-align:center;">Moyenne</th>
        </tr>
      `

    const tableRows = sampleData.modules.map(m => {
      if (config.gradeTableStyle === 'simple') {
        return `
          <tr>
            <td>${m.module}</td>
            <td class="numeric"><strong>${m.finalGrade}</strong></td>
          </tr>
        `
      }

      return `
        <tr>
          <td>${m.module}</td>
          <td class="numeric">${m.avgDevoirs}</td>
          <td class="numeric">${m.avgExamens}</td>
          <td class="numeric"><strong>${m.finalGrade}</strong></td>
        </tr>
      `
    }).join('')

    const averageColspan = config.gradeTableStyle === 'simple' ? 1 : 3

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Aperçu Bulletin</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #0f172a; }
            .page { background: #ffffff; margin: 0 auto; max-width: 800px; min-height: 1120px; box-shadow: 0 10px 25px rgba(15,23,42,0.35); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
            .header { position: relative; padding: 24px 32px 16px; border-bottom: 3px solid ${config.headerColor}; }
            .title { font-size: ${config.schoolNameSize}px; font-weight: 800; color: ${config.headerColor}; margin: 0; text-transform: uppercase; }
            .school-info { margin-top: 8px; font-size: 12px; color: #4b5563; }
            .bulletin-title { text-align: center; font-size: 20px; font-weight: 700; margin: 18px 0 10px; letter-spacing: 0.08em; color: ${config.headerColor}; }
            .student-info { margin: 0 32px 16px; padding: 12px 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 13px; }
            .student-info-row { display: flex; gap: 24px; flex-wrap: wrap; }
            .student-info p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin: 0 32px 24px; font-size: 13px; }
            th, td { padding: 8px 10px; border: 1px solid #e5e7eb; }
            th { background: ${config.headerColor}; color: #ffffff; text-align: left; }
            td.numeric { text-align: center; }
            .average-row { background: #f3f4f6; font-weight: 600; }
            .footer { margin: auto 32px 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
            .signatures { display: flex; justify-content: space-between; gap: 40px; margin-top: 24px; }
            .signature { flex: 1; text-align: center; }
            .signature-line { margin-top: 40px; border-top: 1px solid #111827; padding-top: 4px; font-size: 11px; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              ${logoHTML}
              <h1 class="title">${school.name}</h1>
              <div class="school-info">
                ${config.showAddress ? `<div>📍 Adresse de l'école</div>` : ''}
                ${config.showPhone ? `<div>📞 +226 70 00 00 00</div>` : ''}
                ${config.showEmail ? `<div>📧 contact@ecole.com</div>` : ''}
              </div>
              ${stampHTML}
            </div>

            <div class="bulletin-title">BULLETIN DE NOTES</div>

            <div class="student-info">
              <div class="student-info-row">
                <p><strong>Nom :</strong> ${sampleData.student.name}</p>
                <p><strong>Matricule :</strong> ${sampleData.student.studentNumber}</p>
              </div>
              <div class="student-info-row">
                <p><strong>Filière :</strong> ${sampleData.student.filiere}</p>
                <p><strong>Niveau :</strong> ${sampleData.student.niveau}</p>
                <p><strong>Période :</strong> ${sampleData.period}</p>
              </div>
            </div>

            <table>
              <thead>
                ${tableHeader}
              </thead>
              <tbody>
                ${tableRows}
                <tr class="average-row">
                  <td colspan="${averageColspan}" style="text-align:right;">Moyenne générale :</td>
                  <td class="numeric">${sampleData.generalAverage}/20</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <div>${config.footerText}</div>
              ${config.showSignatures ? `
                <div class="signatures">
                  <div class="signature">
                    <div>Le Directeur</div>
                    <div class="signature-line">Signature et cachet</div>
                  </div>
                  <div class="signature">
                    <div>Le Parent/Tuteur</div>
                    <div class="signature-line">Signature</div>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `

    setPreviewHtml(html)
  }, [config, school.logo, school.name])

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/pdf-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          config,
        }),
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] h-full">
      {/* Panneau gauche : configuration */}
      <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] pr-1">
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

                  {!school.logo && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-3">
                      <p className="text-responsive-xs text-yellow-900 dark:text-yellow-100">
                        <ImageIcon className="h-4 w-4 inline mr-1" />
                        Aucun logo configuré. Ajoutez-en un dans les paramètres de l&apos;école.
                      </p>
                    </div>
                  )}
                </div>
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

      {/* Panneau droit : aperçu live */}
      <Card className="hidden lg:flex flex-col overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="px-4 pt-4 pb-2 border-b flex items-center justify-between">
            <h3 className="font-semibold text-responsive-base">Aperçu en direct</h3>
            <p className="text-[11px] text-muted-foreground">Les modifications sont prévisualisées automatiquement</p>
          </div>
          <div className="flex-1 bg-slate-900/80 flex items-center justify-center p-3">
            <div className="w-full h-full max-w-[840px] max-h-[1120px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
              {previewHtml && (
                <iframe
                  title="Prévisualisation bulletin"
                  srcDoc={previewHtml}
                  className="w-full h-full bg-white"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
