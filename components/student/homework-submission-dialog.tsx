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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload, UploadedFile } from '@/components/ui/file-upload'
import { useToast } from '@/components/ui/use-toast'
import { FileText } from 'lucide-react'

interface HomeworkSubmissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  homeworkId: string
  homeworkTitle: string
  onSuccess?: () => void
}

export function HomeworkSubmissionDialog({
  open,
  onOpenChange,
  homeworkId,
  homeworkTitle,
  onSuccess,
}: HomeworkSubmissionDialogProps) {
  const [content, setContent] = useState('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0])
    }
  }

  const handleSubmit = async () => {
    if (!content && !uploadedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter un commentaire ou un fichier',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/homework/${homeworkId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          fileUrl: uploadedFile?.url,
          fileName: uploadedFile?.name,
          fileSize: uploadedFile?.size,
          fileType: uploadedFile?.type,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission')
      }

      toast({
        title: 'Devoir soumis',
        description: 'Votre devoir a été soumis avec succès',
      })

      // Réinitialiser le formulaire
      setContent('')
      setUploadedFile(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la soumission',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card text-black">
        <DialogHeader>
          <DialogTitle>Soumettre le devoir</DialogTitle>
          <DialogDescription>
            {homeworkTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Commentaire</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ajoutez un commentaire à votre soumission..."
              rows={4}
              className="bg-card"
            />
          </div>

          <div>
            <Label>Fichier (optionnel)</Label>
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
              folder="homework-submissions"
              multiple={false}
            />
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <FileText className="h-5 w-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                <p className="text-xs text-success">
                  {(uploadedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content && !uploadedFile)}
            className="bg-primary hover:bg-primary hover:bg-[#E6B000]"
          >
            {isSubmitting ? 'Soumission en cours...' : 'Soumettre le devoir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
