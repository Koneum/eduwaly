"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Upload, Loader2, Stamp, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface SchoolStampUploaderProps {
  schoolId: string
  currentStamp: string | null
  schoolName: string
}

export default function SchoolStampUploader({ 
  schoolId, 
  currentStamp, 
  schoolName 
}: SchoolStampUploaderProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentStamp)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 MB')
      return
    }

    setSelectedFile(file)
    
    // Créer une prévisualisation
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    setIsUploading(true)

    try {
      // Créer FormData pour l'upload
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('schoolId', schoolId)
      formData.append('type', 'stamp')

      const response = await fetch('/api/admin/upload-school-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'upload')
        return
      }

      const data = await response.json()
      
      toast.success('Cachet téléchargé avec succès')
      setPreviewUrl(data.url)
      setSelectedFile(null)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!currentStamp) return

    setIsUploading(true)

    try {
      const response = await fetch('/api/admin/upload-school-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          type: 'stamp'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
        return
      }

      toast.success('Cachet supprimé')
      setPreviewUrl(null)
      setSelectedFile(null)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="text-responsive-base sm:text-responsive-lg">
          Cachet/Tampon de l&apos;Établissement
        </CardTitle>
        <CardDescription className="text-responsive-xs sm:text-responsive-sm">
          Téléchargez le cachet officiel de votre établissement (max 5 MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
        {/* Prévisualisation */}
        <div className="flex flex-col items-center gap-4">
          {previewUrl && !imageError ? (
            <div className="relative">
              <div className="w-48 h-48 relative border-2 border-border rounded-lg overflow-hidden bg-muted">
                <Image
                  src={previewUrl}
                  alt={`Cachet ${schoolName}`}
                  fill
                  className="object-contain p-2"
                  onError={() => {
                    console.error('Erreur chargement image stamp:', previewUrl)
                    setImageError(true)
                    toast.error('Impossible de charger l\'image')
                  }}
                  unoptimized
                />
              </div>
              {currentStamp && !selectedFile && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                  onClick={handleRemove}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
              <div className="text-center">
                <Stamp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-responsive-xs text-muted-foreground">
                  Aucun cachet
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="space-y-2">
          <Label htmlFor="stamp-upload" className="text-responsive-sm">
            Sélectionner une image
          </Label>
          <div className="flex gap-2">
            <Input
              id="stamp-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="text-responsive-sm"
            />
          </div>
        </div>

        {/* Boutons */}
        {selectedFile && (
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null)
                setPreviewUrl(currentStamp)
              }}
              disabled={isUploading}
            >
              Annuler
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="text-responsive-xs text-muted-foreground space-y-1">
          <p>• Formats acceptés: JPG, PNG, WebP, SVG</p>
          <p>• Taille maximale: 5 MB</p>
          <p>• Dimensions recommandées: 256x256 px</p>
          <p>• Le cachet sera utilisé sur les reçus et documents officiels</p>
        </div>
      </CardContent>
    </Card>
  )
}
