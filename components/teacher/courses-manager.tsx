'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BookOpen, Users, FileText, Upload, File, Trash2 } from "lucide-react"
import { toast } from 'sonner'

interface Module {
  id: string
  nom: string
  type: string
  vh: number
  semestre: string
  filiere: {
    nom: string
  } | null
}

interface CoursesManagerProps {
  modules: Module[]
}

export default function CoursesManager({ modules }: CoursesManagerProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; type: string }>>([])

  const handleManageDocuments = (mod: Module) => {
    setSelectedModule(mod)
    // Simuler des documents existants
    setDocuments([
      { id: '1', name: 'Cours_Chapitre_1.pdf', type: 'PDF' },
      { id: '2', name: 'TP_Exercices.docx', type: 'DOCX' }
    ])
    setIsManageDialogOpen(true)
  }

  const handleUploadDocument = () => {
    // Simuler l'upload
    const newDoc = {
      id: Date.now().toString(),
      name: 'Nouveau_Document.pdf',
      type: 'PDF'
    }
    setDocuments([...documents, newDoc])
    toast.success('Document ajouté avec succès')
  }

  const handleDeleteDocument = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId))
    toast.success('Document supprimé')
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="heading-responsive-h1">Mes Cours</h1>
          <p className="text-responsive-sm text-muted-foreground mt-2">Consultez vos cours et gérez les ressources pédagogiques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {modules.length === 0 ? (
          <div className="col-span-full text-center py-8 sm:py-12">
            <p className="text-responsive-sm text-muted-foreground">Aucun cours assigné pour le moment</p>
          </div>
        ) : (
          modules.map((mod) => (
            <Card key={mod.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-responsive-base">{mod.nom}</CardTitle>
                    <CardDescription className="text-responsive-sm">{mod.filiere?.nom || 'Non assigné'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-responsive-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Type: {mod.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-responsive-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{mod.vh}h - {mod.semestre}</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleManageDocuments(mod)}
                >
                  Gérer les documents
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Gérer Documents */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Gérer les documents - {selectedModule?.nom}</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Ajoutez ou supprimez des documents pour ce cours
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
              <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-responsive-sm text-muted-foreground mb-3">
                Glissez-déposez vos fichiers ici ou cliquez pour parcourir
              </p>
              <Button onClick={handleUploadDocument}>
                <Upload className="h-4 w-4 mr-2" />
                Uploader un document
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-responsive-sm">Documents existants</Label>
              {documents.length === 0 ? (
                <p className="text-responsive-sm text-muted-foreground text-center py-4">
                  Aucun document pour le moment
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-accent/50 gap-3 sm:gap-0"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <File className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-responsive-sm">{doc.name}</p>
                          <p className="text-responsive-xs text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                          Télécharger
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsManageDialogOpen(false)} className="w-full sm:w-auto">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
