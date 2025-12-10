'use client'

import { useState, useRef, DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, X, File, Image, FileText, Film, Music, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void
  onError?: (error: string) => void
  category?: 'image' | 'document' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'any'
  folder?: string
  multiple?: boolean
  maxFiles?: number
  disabled?: boolean
  className?: string
}

export interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

export function FileUpload({
  onUpload,
  onError,
  category = 'any',
  folder = 'uploads',
  multiple = false,
  maxFiles = 5,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    if (disabled) return

    // Limiter le nombre de fichiers
    const filesToAdd = multiple ? files.slice(0, maxFiles - selectedFiles.length) : [files[0]]
    
    if (filesToAdd.length === 0) {
      onError?.('Nombre maximum de fichiers atteint')
      return
    }

    setSelectedFiles((prev) => (multiple ? [...prev, ...filesToAdd] : filesToAdd))
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setProgress(0)

    try {
      const uploadedFiles: UploadedFile[] = []
      const totalFiles = selectedFiles.length

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)
        formData.append('category', category)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erreur lors de l\'upload')
        }

        const data = await response.json()
        uploadedFiles.push(data.file)

        // Mettre à jour la progression
        setProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      // Appeler le callback avec les fichiers uploadés
      onUpload(uploadedFiles)

      // Réinitialiser
      setSelectedFiles([])
      setProgress(0)
    } catch (error) {
      console.error('Erreur upload:', error)
      onError?.(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-[var(--link)]" />
    if (file.type.startsWith('video/')) return <Film className="h-8 w-8 text-purple-500" />
    if (file.type.startsWith('audio/')) return <Music className="h-8 w-8 text-green-500" />
    if (file.type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) 
      return <FileSpreadsheet className="h-8 w-8 text-success" />
    return <File className="h-8 w-8 text-muted-foreground" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          Cliquez pour sélectionner ou glissez-déposez
        </p>
        <p className="text-xs text-muted-foreground">
          {multiple ? `Jusqu'à ${maxFiles} fichiers` : '1 fichier'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileSelect}
          className="hidden"
          accept={category === 'image' ? 'image/*' : category === 'document' ? '.pdf,.doc,.docx' : undefined}
        />
      </div>

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Fichiers sélectionnés ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Barre de progression */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Upload en cours... {progress}%
          </p>
        </div>
      )}

      {/* Bouton d'upload */}
      {selectedFiles.length > 0 && !uploading && (
        <Button
          onClick={uploadFiles}
          disabled={disabled || uploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Uploader {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  )
}
