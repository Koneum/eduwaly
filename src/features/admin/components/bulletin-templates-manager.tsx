'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Eye, Check } from 'lucide-react'
import { toast } from 'sonner'

interface BulletinTemplate {
  id: string
  schoolId: string
  name: string
  showLogo: boolean
  logoPosition: string
  headerColor: string
  schoolNameSize: number
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  showStamp: boolean
  gradeTableStyle: string
  footerText: string
  showSignatures: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface BulletinTemplatesManagerProps {
  templates: BulletinTemplate[]
  schoolId: string
  schoolName: string
  schoolLogo: string | null
  maxTemplates: number
}

export default function BulletinTemplatesManager({
  templates: initialTemplates,
  schoolId,
  schoolName,
  schoolLogo,
  maxTemplates,
}: BulletinTemplatesManagerProps) {
  const [templates, setTemplates] = useState<BulletinTemplate[]>(initialTemplates)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<BulletinTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    showLogo: true,
    logoPosition: 'left',
    headerColor: '#4F46E5',
    schoolNameSize: 24,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showStamp: true,
    gradeTableStyle: 'detailed' as 'simple' | 'detailed',
    footerText: 'Ce document est officiel et certifié conforme.',
    showSignatures: true,
    isActive: false,
  })
  const [livePreviewHtml, setLivePreviewHtml] = useState('')

  const canCreateMore = templates.length < maxTemplates

  const openCreateDialog = () => {
    setSelectedTemplate(null)
    setFormData({
      name: '',
      showLogo: true,
      logoPosition: 'left',
      headerColor: '#4F46E5',
      schoolNameSize: 24,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showStamp: true,
      gradeTableStyle: 'detailed',
      footerText: 'Ce document est officiel et certifié conforme.',
      showSignatures: true,
      isActive: templates.length === 0,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (template: BulletinTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      showLogo: template.showLogo,
      logoPosition: template.logoPosition as 'left' | 'center' | 'right',
      headerColor: template.headerColor,
      schoolNameSize: template.schoolNameSize,
      showAddress: template.showAddress,
      showPhone: template.showPhone,
      showEmail: template.showEmail,
      showStamp: template.showStamp,
      gradeTableStyle: template.gradeTableStyle as 'simple' | 'detailed',
      footerText: template.footerText,
      showSignatures: template.showSignatures,
      isActive: template.isActive,
    })
    setIsDialogOpen(true)
  }

  const generatePreviewHTML = () => {
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

    const logoHTML = formData.showLogo && schoolLogo
      ? `<div style="text-align: ${formData.logoPosition}; margin-bottom: 10px;">
          <img src="${schoolLogo}" alt="Logo" style="max-width: 140px; max-height: 70px; object-fit: contain;" />
        </div>`
      : ''

    const tableHeader = formData.gradeTableStyle === 'simple'
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

    const tableRows = sampleData.modules.map((m) => {
      if (formData.gradeTableStyle === 'simple') {
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

    const averageColspan = formData.gradeTableStyle === 'simple' ? 1 : 3

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Aperçu Bulletin</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #0f172a; }
            .page { background: #ffffff; margin: 0 auto; max-width: 800px; min-height: 1120px; box-shadow: 0 10px 25px rgba(15,23,42,0.35); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
            .header { position: relative; padding: 24px 32px 16px; border-bottom: 3px solid ${formData.headerColor}; }
            .title { font-size: ${formData.schoolNameSize}px; font-weight: 800; color: ${formData.headerColor}; margin: 0; text-transform: uppercase; }
            .school-info { margin-top: 8px; font-size: 12px; color: #4b5563; }
            .bulletin-title { text-align: center; font-size: 20px; font-weight: 700; margin: 18px 0 10px; letter-spacing: 0.08em; color: ${formData.headerColor}; }
            .student-info { margin: 0 32px 16px; padding: 12px 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 13px; }
            .student-info-row { display: flex; gap: 24px; flex-wrap: wrap; }
            .student-info p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin: 0 32px 24px; font-size: 13px; }
            th, td { padding: 8px 10px; border: 1px solid #e5e7eb; }
            th { background: ${formData.headerColor}; color: #ffffff; text-align: left; }
            td.numeric { text-align: center; }
            .average-row { background: #f3f4f6; font-weight: 600; }
            .footer { margin: auto 32px 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              ${logoHTML}
              <h1 class="title">${schoolName}</h1>
              <div class="school-info">
                ${formData.showAddress ? `<div>📍 Adresse de l'école</div>` : ''}
                ${formData.showPhone ? `<div>📞 +226 70 00 00 00</div>` : ''}
                ${formData.showEmail ? `<div>📧 contact@ecole.com</div>` : ''}
              </div>
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
              <div>${formData.footerText}</div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  useEffect(() => {
    setLivePreviewHtml(generatePreviewHTML())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(formData), schoolLogo, schoolName])

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom du template est requis")
      return
    }

    try {
      const method = selectedTemplate ? 'PUT' : 'POST'
      const url = selectedTemplate
        ? `/api/admin/bulletin-templates/${selectedTemplate.id}`
        : '/api/admin/bulletin-templates'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      toast.success(data.message || 'Template enregistré avec succès')

      // Mettre à jour la liste locale sans recharger la page
      if (selectedTemplate) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === data.template.id ? data.template : t)),
        )
      } else {
        setTemplates((prev) => [data.template, ...prev])
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement",
      )
    }
  }

  const handleDelete = async (template: BulletinTemplate) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return

    try {
      const response = await fetch(`/api/admin/bulletin-templates/${template.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success('Template supprimé avec succès')
      setTemplates((prev) => prev.filter((t) => t.id !== template.id))
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression',
      )
    }
  }

  const handleActivate = async (template: BulletinTemplate) => {
    try {
      const response = await fetch(`/api/admin/bulletin-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, isActive: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'activation")
      }

      toast.success('Template activé avec succès')
      setTemplates((prev) =>
        prev.map((t) => ({ ...t, isActive: t.id === template.id })),
      )
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'activation",
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {templates.length} template
            {templates.length > 1 ? 's' : ''} de bulletins configuré
            {templates.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Limite de votre plan : {maxTemplates} template
            {maxTemplates > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={!canCreateMore}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un template
        </Button>
      </div>

      {!canCreateMore && (
        <div className="p-3 rounded-md bg-amber-50 text-amber-900 text-xs border border-amber-200">
          Vous avez atteint la limite de templates autorisés par votre plan. Passez à un plan supérieur pour en créer davantage.
        </div>
      )}

      {/* Liste des templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={template.isActive ? 'border-primary border-2' : ''}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.name}
                    {template.isActive && (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Aperçu des paramètres */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: template.headerColor }}
                  />
                  <span className="text-muted-foreground">Couleur de l'en-tête</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Style du tableau :{' '}
                  {template.gradeTableStyle === 'simple' ? 'Simple' : 'Détaillé'}
                </p>
                {template.showLogo && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Check className="h-4 w-4 text-green-600" />
                    Logo affiché
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(template)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {!template.isActive && (
                <Button
                  className="w-full mt-2"
                  size="sm"
                  onClick={() => handleActivate(template)}
                >
                  Activer ce template
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Eye className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center text-sm">
                Aucun template de bulletin configuré.
                <br />
                Créez votre premier template pour personnaliser vos bulletins.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Créer/Modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[98vw] md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate
                ? 'Modifier le template de bulletin'
                : 'Créer un nouveau template de bulletin'}
            </DialogTitle>
            <DialogDescription>
              Personnalisez l'apparence de vos bulletins PDF
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] h-[70vh]">
            {/* Panneau gauche : formulaire */}
            <div className="space-y-4 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du template *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Bulletin standard"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerColor">Couleur de l'en-tête</Label>
                <div className="flex gap-2">
                  <Input
                    id="headerColor"
                    type="color"
                    value={formData.headerColor}
                    onChange={(e) =>
                      setFormData({ ...formData, headerColor: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.headerColor}
                    onChange={(e) =>
                      setFormData({ ...formData, headerColor: e.target.value })
                    }
                    placeholder="#4F46E5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolNameSize">
                  Taille du nom de l'école (px)
                </Label>
                <Input
                  id="schoolNameSize"
                  type="number"
                  value={formData.schoolNameSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      schoolNameSize: parseInt(e.target.value || '24', 10),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Style du tableau</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      formData.gradeTableStyle === 'simple' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, gradeTableStyle: 'simple' })
                    }
                  >
                    Simple
                  </Button>
                  <Button
                    variant={
                      formData.gradeTableStyle === 'detailed' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setFormData({ ...formData, gradeTableStyle: 'detailed' })
                    }
                  >
                    Détaillé
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Texte de pied de page</Label>
                <Textarea
                  id="footerText"
                  placeholder="Ce document est officiel et certifié conforme."
                  value={formData.footerText}
                  onChange={(e) =>
                    setFormData({ ...formData, footerText: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Options d'affichage</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Afficher l'adresse</span>
                    <Switch
                      checked={formData.showAddress}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, showAddress: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Afficher le téléphone</span>
                    <Switch
                      checked={formData.showPhone}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, showPhone: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Afficher l'email</span>
                    <Switch
                      checked={formData.showEmail}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, showEmail: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Afficher les signatures</span>
                    <Switch
                      checked={formData.showSignatures}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, showSignatures: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="isActive">Template actif</Label>
                  <p className="text-xs text-muted-foreground">
                    Ce template sera utilisé pour la génération des bulletins
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            {/* Panneau droit : aperçu live */}
            <Card className="hidden lg:flex flex-col overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="px-4 pt-4 pb-2 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Aperçu en direct</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Les modifications sont prévisualisées automatiquement
                  </p>
                </div>
                <div className="flex-1 bg-slate-900/80 flex items-center justify-center p-3">
                  <div className="w-full h-full max-w-[840px] max-h-[1120px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                    {livePreviewHtml && (
                      <iframe
                        title="Prévisualisation bulletin"
                        srcDoc={livePreviewHtml}
                        className="w-full h-full bg-white"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {selectedTemplate ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
