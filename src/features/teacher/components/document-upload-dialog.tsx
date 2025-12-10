"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import { useToast } from '@/components/ui/use-toast'

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  onSuccess?: () => void
}

const DOCUMENT_CATEGORIES = [
  { value: 'COURS', label: 'Cours' },
  { value: 'TD', label: 'TD' },
  { value: 'TP', label: 'TP' },
  { value: 'EXAMEN', label: 'Examen' },
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'AUTRE', label: 'Autre' },
]

export function DocumentUploadDialog({
  open,
  onOpenChange,
  moduleId,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('COURS')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0])
      // Utiliser le nom du fichier comme titre par défaut
      if (!title) {
        setTitle(files[0].name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async () => {
    if (!title || !uploadedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          mimeType: uploadedFile.type,
          moduleId,
          category,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du document')
      }

      toast({
        title: 'Document ajouté',
        description: 'Le document a été ajouté avec succès',
      })

      // Réinitialiser le formulaire
      setTitle('')
      setDescription('')
      setCategory('COURS')
      setUploadedFile(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'ajout du document',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-black">
        <DialogHeader>
          <DialogTitle className="text-responsive-lg">Ajouter un document</DialogTitle>
          <DialogDescription className="text-responsive-sm">
            Partagez des ressources pédagogiques avec vos étudiants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="title" className="text-responsive-sm">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cours Chapitre 1"
              className="bg-card text-responsive-sm"
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-responsive-sm">Catégorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-card text-responsive-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-responsive-sm">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-responsive-sm">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du document..."
              rows={3}
              className="bg-card text-responsive-sm"
            />
          </div>

          <div>
            <Label className="text-responsive-sm">Fichier *</Label>
            <FileUpload
              onUpload={handleUpload}
              onError={(error) => {
                toast({
                  title: 'Erreur',
                  description: error,
                  variant: 'destructive',
                })
              }}
              category="document"
              folder="documents"
              multiple={false}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !uploadedFile}
            className="bg-primary hover:bg-primary hover:bg-[#E6B000] w-full sm:w-auto"
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter le document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
