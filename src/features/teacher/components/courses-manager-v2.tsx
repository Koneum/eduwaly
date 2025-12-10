'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BookOpen, FileText, Trash2, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { FileUpload, UploadedFile } from "@/components/ui/file-upload"

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

interface Document {
  id: string
  title: string
  fileName: string
  fileUrl: string
  mimeType: string
  fileSize: number
  category: string
  createdAt: string
}

interface CoursesManagerProps {
  modules: Module[]
  schoolId: string
}

export default function CoursesManagerV2({ modules, schoolId }: CoursesManagerProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [modulesDocCount, setModulesDocCount] = useState<Record<string, number>>({})

  // Charger le nombre de documents pour chaque module
  useEffect(() => {
    const loadDocumentCounts = async () => {
      const counts: Record<string, number> = {}
      for (const mod of modules) {
        try {
          const response = await fetch(`/api/documents?moduleId=${mod.id}`)
          if (response.ok) {
            const data = await response.json()
            counts[mod.id] = data.length
          }
        } catch (error) {
          console.error('Erreur chargement compteur:', error)
        }
      }
      setModulesDocCount(counts)
    }
    if (modules.length > 0) {
      loadDocumentCounts()
    }
  }, [modules])

  const handleManageDocuments = async (mod: Module) => {
    setSelectedModule(mod)
    setIsManageDialogOpen(true)
    await loadDocuments(mod.id)
  }

  const loadDocuments = async (moduleId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents?moduleId=${moduleId}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = async (files: UploadedFile[]) => {
    if (!selectedModule) return

    setUploading(true)
    try {
      // Créer les documents dans la base de données
      const promises = files.map(file =>
        fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            fileName: file.name,
            fileUrl: file.url,
            mimeType: file.type,
            fileSize: file.size,
            moduleId: selectedModule.id,
            category: 'COURSE'
          })
        })
      )

      await Promise.all(promises)
      
      toast.success(`${files.length} document(s) ajouté(s) avec succès`)
      await loadDocuments(selectedModule.id)
      
      // Mettre à jour le compteur
      setModulesDocCount(prev => ({
        ...prev,
        [selectedModule.id]: (prev[selectedModule.id] || 0) + files.length
      }))
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'ajout des documents')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== docId))
        toast.success('Document supprimé')
        
        // Mettre à jour le compteur
        if (selectedModule) {
          setModulesDocCount(prev => ({
            ...prev,
            [selectedModule.id]: Math.max(0, (prev[selectedModule.id] || 0) - 1)
          }))
        }
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">Mes Cours</h1>
          <p className="text-responsive-sm text-muted-foreground mt-1 sm:mt-2">Consultez vos cours et gérez les ressources pédagogiques</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {modules.length === 0 ? (
          <div className="col-span-full text-center py-8 sm:py-12">
            <p className="text-responsive-sm text-muted-foreground">Aucun cours assigné pour le moment</p>
          </div>
        ) : (
          modules.map((mod) => (
            <Card key={mod.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-primary/10 p-2 sm:p-3 rounded-lg shrink-0">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-responsive-base sm:text-responsive-lg truncate">{mod.nom}</CardTitle>
                    <CardDescription className="text-responsive-xs sm:text-responsive-sm truncate">{mod.filiere?.nom || 'Sans filière'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-responsive-xs sm:text-responsive-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{mod.type}</span>
                </div>
                <div className="flex items-center justify-between text-responsive-xs sm:text-responsive-sm">
                  <span className="text-muted-foreground">Volume horaire</span>
                  <span className="font-medium">{mod.vh}h</span>
                </div>
                <div className="flex items-center justify-between text-responsive-xs sm:text-responsive-sm">
                  <span className="text-muted-foreground">Semestre</span>
                  <span className="font-medium">{mod.semestre}</span>
                </div>
                <div className="flex items-center justify-between text-responsive-xs sm:text-responsive-sm">
                  <span className="text-muted-foreground">Documents</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    {modulesDocCount[mod.id] || 0}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2 sm:mt-4 text-responsive-xs sm:text-responsive-sm"
                  onClick={() => handleManageDocuments(mod)}
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Gérer les documents
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Gérer Documents */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto bg-card text-black p-0 gap-0">
          <DialogHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 border-b sticky top-0 bg-card z-10">
            <DialogTitle className="text-responsive-base sm:text-responsive-lg">Gérer les documents - {selectedModule?.nom}</DialogTitle>
            <DialogDescription className="text-responsive-xs sm:text-responsive-sm">
              Ajoutez ou supprimez des documents pour ce cours
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-3 sm:p-4 md:p-6 pt-2 sm:pt-3 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            {/* Upload de fichiers */}
            <div>
              <Label className="text-responsive-sm">Ajouter des ressources pédagogiques</Label>
              <FileUpload
                onUpload={handleUploadComplete}
                onError={(error) => toast.error(error)}
                category="any"
                folder={`courses/${selectedModule?.id}`}
                multiple={true}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-responsive-sm text-muted-foreground mt-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement en cours...
                </p>
              )}
            </div>

            {/* Liste des documents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-responsive-sm">Documents existants</Label>
                {!loading && documents.length > 0 && (
                  <span className="text-responsive-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <p className="text-responsive-sm text-muted-foreground text-center py-4">
                  Aucun document pour le moment
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 gap-3 sm:gap-0"
                    >
                      <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-responsive-sm">{doc.title || doc.fileName}</p>
                          <p className="text-responsive-xs text-muted-foreground">
                            {doc.mimeType} • {formatFileSize(doc.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="flex-1 sm:flex-none"
                        >
                          Voir
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

          <DialogFooter className="p-3 sm:p-4 md:p-6 pt-2 sm:pt-3 border-t gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsManageDialogOpen(false)} className="w-full sm:w-auto text-responsive-sm">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
