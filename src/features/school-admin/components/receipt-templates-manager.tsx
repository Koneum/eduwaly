'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Check,
  FileText 
} from "lucide-react"
import { toast } from "sonner"

interface ReceiptTemplate {
  id: string
  schoolId: string
  name: string
  logoUrl: string | null
  headerText: string | null
  footerText: string | null
  showLogo: boolean
  showStamp: boolean
  stampUrl: string | null
  primaryColor: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface ReceiptTemplatesManagerProps {
  templates: ReceiptTemplate[]
  schoolId: string
  schoolLogo: string | null
  schoolStamp: string | null
  schoolName: string
  schoolColor: string
}

export default function ReceiptTemplatesManager({ 
  templates, 
  schoolId,
  schoolLogo,
  schoolStamp,
  schoolName,
  schoolColor
}: ReceiptTemplatesManagerProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    headerText: 'REÇU DE PAIEMENT',
    footerText: 'Merci pour votre paiement',
    showLogo: true,
    showStamp: false,
    stampUrl: '',
    primaryColor: schoolColor,
    isActive: false
  })

  const handleCreate = () => {
    setSelectedTemplate(null)
    setFormData({
      name: '',
      logoUrl: schoolLogo || '',
      headerText: 'REÇU DE PAIEMENT',
      footerText: 'Merci pour votre paiement',
      showLogo: true,
      showStamp: !!schoolStamp,
      stampUrl: schoolStamp || '',
      primaryColor: schoolColor,
      isActive: false
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (template: ReceiptTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      logoUrl: template.logoUrl || '',
      headerText: template.headerText || 'REÇU DE PAIEMENT',
      footerText: template.footerText || 'Merci pour votre paiement',
      showLogo: template.showLogo,
      showStamp: template.showStamp,
      stampUrl: template.stampUrl || '',
      primaryColor: template.primaryColor,
      isActive: template.isActive
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Le nom du template est requis')
      return
    }

    try {
      const url = selectedTemplate 
        ? `/api/school-admin/receipt-templates/${selectedTemplate.id}`
        : '/api/school-admin/receipt-templates'
      
      const method = selectedTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          schoolId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      toast.success(data.message || 'Template enregistré avec succès')
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return

    try {
      const response = await fetch(`/api/school-admin/receipt-templates/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success('Template supprimé avec succès')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  const handleActivate = async (template: ReceiptTemplate) => {
    try {
      const response = await fetch(`/api/school-admin/receipt-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          isActive: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'activation')
      }

      toast.success('Template activé avec succès')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'activation')
    }
  }

  const handlePreview = (template: ReceiptTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewOpen(true)
  }

  const generatePreviewHTML = (data: {
    name: string
    logoUrl: string | null
    headerText: string | null
    footerText: string | null
    showLogo: boolean
    showStamp: boolean
    stampUrl: string | null
    primaryColor: string
  }) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aperçu - ${data.name || 'Reçu'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              background: #f5f5f5;
            }
            .receipt {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid ${data.primaryColor};
              padding-bottom: 20px;
            }
            .logo {
              max-width: 200px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: ${data.primaryColor};
              font-size: 28px;
            }
            .info-section {
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .value {
              color: #333;
            }
            .amount-section {
              margin-top: 30px;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
              border-left: 4px solid ${data.primaryColor};
            }
            .total {
              font-size: 24px;
              font-weight: bold;
              text-align: right;
              color: ${data.primaryColor};
              margin-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 14px;
              padding-top: 20px;
              border-top: 2px solid #eee;
            }
            .stamp {
              max-width: 150px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              ${data.showLogo && data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" class="logo" />` : ''}
              <h1>${data.headerText || 'REÇU DE PAIEMENT'}</h1>
              <p style="color: #666; margin: 10px 0;">N° ${new Date().getTime()}</p>
            </div>
            
            <div class="info-section">
              <div class="info-row">
                <span class="label">École:</span>
                <span class="value">${schoolName}</span>
              </div>
              <div class="info-row">
                <span class="label">Étudiant:</span>
                <span class="value">Jean DUPONT</span>
              </div>
              <div class="info-row">
                <span class="label">Classe:</span>
                <span class="value">L1 - Informatique</span>
              </div>
              <div class="info-row">
                <span class="label">Type de frais:</span>
                <span class="value">Frais d'inscription</span>
              </div>
              <div class="info-row">
                <span class="label">Date de paiement:</span>
                <span class="value">${new Date().toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="info-row">
                <span class="label">Méthode de paiement:</span>
                <span class="value">Mobile Money</span>
              </div>
            </div>

            <div class="amount-section">
              <div class="info-row" style="border: none;">
                <span class="label">Montant payé:</span>
                <span class="value">10,000 FCFA</span>
              </div>
              <div class="total">
                Total: 10,000 FCFA
              </div>
            </div>

            <div class="footer">
              ${data.showStamp && data.stampUrl ? `<img src="${data.stampUrl}" alt="Cachet" class="stamp" />` : ''}
              <p>${data.footerText || 'Merci pour votre paiement'}</p>
              <p style="font-size: 12px; color: #999; margin-top: 10px;">
                Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const openPreview = () => {
    if (!selectedTemplate) return

    const previewWindow = window.open('', '_blank')
    if (!previewWindow) return

    previewWindow.document.write(
      generatePreviewHTML({
        name: selectedTemplate.name,
        logoUrl: selectedTemplate.logoUrl,
        headerText: selectedTemplate.headerText,
        footerText: selectedTemplate.footerText,
        showLogo: selectedTemplate.showLogo,
        showStamp: selectedTemplate.showStamp,
        stampUrl: selectedTemplate.stampUrl,
        primaryColor: selectedTemplate.primaryColor
      })
    )
    previewWindow.document.close()
  }

  const [livePreviewHtml, setLivePreviewHtml] = useState('')

  useEffect(() => {
    setLivePreviewHtml(
      generatePreviewHTML({
        name: formData.name || 'Reçu Standard',
        logoUrl: formData.logoUrl || schoolLogo,
        headerText: formData.headerText,
        footerText: formData.footerText,
        showLogo: formData.showLogo,
        showStamp: formData.showStamp,
        stampUrl: formData.stampUrl || schoolStamp,
        primaryColor: formData.primaryColor || schoolColor
      })
    )
  }, [formData, schoolLogo, schoolStamp, schoolColor])

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {templates.length} template{templates.length > 1 ? 's' : ''} configuré{templates.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un template
        </Button>
      </div>

      {/* Liste des templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className={template.isActive ? 'border-primary border-2' : ''}>
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
                    style={{ backgroundColor: template.primaryColor }}
                  />
                  <span className="text-muted-foreground">Couleur principale</span>
                </div>
                {template.showLogo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    Logo affiché
                  </div>
                )}
                {template.showStamp && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-green-600" />
                    Cachet affiché
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handlePreview(template)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Aperçu
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  disabled={template.isActive}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {!template.isActive && (
                <Button 
                  className="w-full" 
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
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Aucun template configuré.<br />
                Créez votre premier template pour personnaliser vos reçus.
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
              {selectedTemplate ? 'Modifier le template' : 'Créer un nouveau template'}
            </DialogTitle>
            <DialogDescription>
              Personnalisez l&apos;apparence de vos reçus de paiement
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] h-[70vh]">
            {/* Panneau gauche : formulaire */}
            <div className="space-y-4 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du template *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Reçu avec logo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerText">Texte d&apos;en-tête</Label>
                <Input
                  id="headerText"
                  placeholder="REÇU DE PAIEMENT"
                  value={formData.headerText}
                  onChange={(e) => setFormData({...formData, headerText: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">Texte de pied de page</Label>
                <Textarea
                  id="footerText"
                  placeholder="Merci pour votre paiement"
                  value={formData.footerText}
                  onChange={(e) => setFormData({...formData, footerText: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">Couleur principale</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                    placeholder="#4F46E5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL du logo</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://..."
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour utiliser le logo de l&apos;école
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showLogo">Afficher le logo</Label>
                <Switch
                  id="showLogo"
                  checked={formData.showLogo}
                  onCheckedChange={(checked) => setFormData({...formData, showLogo: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stampUrl">URL du cachet/tampon</Label>
                <Input
                  id="stampUrl"
                  placeholder="https://..."
                  value={formData.stampUrl}
                  onChange={(e) => setFormData({...formData, stampUrl: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showStamp">Afficher le cachet</Label>
                <Switch
                  id="showStamp"
                  checked={formData.showStamp}
                  onCheckedChange={(checked) => setFormData({...formData, showStamp: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="isActive">Template actif</Label>
                  <p className="text-xs text-muted-foreground">
                    Ce template sera utilisé pour tous les reçus
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
              </div>
            </div>

            {/* Panneau droit : aperçu live */}
            <Card className="hidden lg:flex flex-col overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="px-4 pt-4 pb-2 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Aperçu en direct</h3>
                  <p className="text-[11px] text-muted-foreground">Les modifications sont prévisualisées automatiquement</p>
                </div>
                <div className="flex-1 bg-slate-900/80 flex items-center justify-center p-3">
                  <div className="w-full h-full max-w-[840px] max-h-[1120px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                    {livePreviewHtml && (
                      <iframe
                        title="Prévisualisation reçu"
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

      {/* Dialog Aperçu */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Aperçu du template</DialogTitle>
            <DialogDescription>
              Voici à quoi ressemblera votre reçu de paiement
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={openPreview}>
              <Eye className="mr-2 h-4 w-4" />
              Ouvrir l&apos;aperçu dans une nouvelle fenêtre
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
