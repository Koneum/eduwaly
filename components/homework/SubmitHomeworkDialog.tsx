'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, Loader2, FileText } from 'lucide-react'
import { useToast } from '../ui/use-toast'


interface SubmitHomeworkDialogProps {
  homeworkId: string
  homeworkTitle: string
  moduleName: string
  dueDate: Date
  isOverdue?: boolean
  children?: React.ReactNode
}

export function SubmitHomeworkDialog({
  homeworkId,
  homeworkTitle,
  moduleName,
  dueDate,
  isOverdue = false,
  children
}: SubmitHomeworkDialogProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir le contenu de votre devoir',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('homeworkId', homeworkId)
      formData.append('content', content)
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch('/api/student/homework/submit', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission')
      }

      toast({
        title: 'Succès',
        description: 'Votre devoir a été rendu avec succès',
        variant: 'default'
      })

      setOpen(false)
      setContent('')
      setFile(null)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la soumission',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant={isOverdue ? 'destructive' : 'default'} className="text-responsive-xs">
            <Upload className="h-4 w-4 mr-2" />
            Rendre
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-responsive-base sm:text-responsive-lg">Rendre le devoir</DialogTitle>
          <DialogDescription className="text-responsive-xs sm:text-responsive-sm">
            Soumettez votre travail pour <span className="font-semibold">{homeworkTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* Informations du devoir */}
          <div className="p-2 sm:p-3 bg-muted dark:bg-muted/50 rounded-lg space-y-1 sm:space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-responsive-xs text-muted-foreground">Module:</span>
              <span className="text-responsive-xs sm:text-responsive-sm font-medium">{moduleName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-responsive-xs text-muted-foreground">Échéance:</span>
              <span className={`text-responsive-xs sm:text-responsive-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                {new Date(dueDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
                {isOverdue && ' (En retard)'}
              </span>
            </div>
          </div>

          {/* Contenu du devoir */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-responsive-xs sm:text-responsive-sm font-medium">
              Contenu du devoir <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="Saisissez votre réponse, votre analyse, ou décrivez votre travail..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none text-responsive-xs sm:text-responsive-sm min-h-[120px] sm:min-h-[150px]"
            />
            <p className="text-responsive-xs text-muted-foreground">
              {content.length} caractères
            </p>
          </div>

          {/* Upload de fichier (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-responsive-xs sm:text-responsive-sm font-medium">
              Fichier joint (optionnel)
            </Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.zip,.rar"
              className="text-responsive-xs sm:text-responsive-sm cursor-pointer"
            />
            {file && (
              <div className="flex items-center gap-2 p-2 sm:p-3 bg-muted dark:bg-muted/50 rounded-lg border border-border">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="text-responsive-xs sm:text-responsive-sm flex-1 truncate font-medium">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-responsive-xs shrink-0 h-8"
                >
                  Retirer
                </Button>
              </div>
            )}
            <p className="text-responsive-xs text-muted-foreground">
              Formats: PDF, Word, TXT, ZIP, RAR (max 10MB)
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="text-responsive-xs sm:text-responsive-sm w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="text-responsive-xs sm:text-responsive-sm w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Soumettre
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
