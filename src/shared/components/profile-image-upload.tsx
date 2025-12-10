"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, Loader2, X, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  userName: string
  onImageChange?: (newUrl: string | null) => void
}

export function ProfileImageUpload({ 
  currentImageUrl, 
  userName,
  onImageChange 
}: ProfileImageUploadProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(currentImageUrl)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'upload')
      }

      const data = await response.json()
      setImageUrl(data.imageUrl)
      onImageChange?.(data.imageUrl)
      toast.success('Image de profil mise à jour')
      router.refresh()
    } catch (error) {
      console.error('Erreur upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    setUploading(true)

    try {
      const response = await fetch('/api/user/profile-image', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      setImageUrl(null)
      onImageChange?.(null)
      toast.success('Image de profil supprimée')
      router.refresh()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setUploading(false)
    }
  }

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32">
          <AvatarImage src={imageUrl || undefined} alt={userName} />
          <AvatarFallback className="text-responsive-xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <label htmlFor="profile-image-input" className="cursor-pointer">
            <Camera className="h-8 w-8 text-white" />
          </label>
        </div>

        <input
          id="profile-image-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => document.getElementById('profile-image-input')?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Upload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Changer
            </>
          )}
        </Button>

        {imageUrl && (
          <Button
            size="sm"
            variant="ghost"
            disabled={uploading}
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        )}
      </div>

      <p className="text-responsive-xs text-muted-foreground text-center">
        JPG, PNG ou WEBP. Max 5 MB.
      </p>
    </div>
  )
}
