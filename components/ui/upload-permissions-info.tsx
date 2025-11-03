'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, FileText, Image, FileSpreadsheet, Presentation, Video, Music } from 'lucide-react'
import { useUploadPermissions } from '@/hooks/useUploadPermissions'
import type { UploadCategory } from '@/lib/upload-permissions'

const CATEGORY_ICONS: Record<UploadCategory, any> = {
  image: Image,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  video: Video,
  audio: Music,
  any: FileText,
}

const CATEGORY_LABELS: Record<UploadCategory, string> = {
  image: 'Images',
  document: 'Documents',
  spreadsheet: 'Tableurs',
  presentation: 'Présentations',
  video: 'Vidéos',
  audio: 'Audio',
  any: 'Tous types',
}

interface UploadPermissionsInfoProps {
  className?: string
}

export function UploadPermissionsInfo({ className }: UploadPermissionsInfoProps) {
  const { allowedCategories, getMaxSize, userRole } = useUploadPermissions()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          Types de fichiers autorisés
        </CardTitle>
        <CardDescription>
          En tant que <Badge variant="outline" className="ml-1">{userRole}</Badge>, vous pouvez uploader:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {allowedCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category]
            const maxSize = getMaxSize(category)
            return (
              <Badge key={category} variant="secondary" className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {CATEGORY_LABELS[category]}
                <span className="text-xs text-muted-foreground">
                  (max {maxSize}MB)
                </span>
              </Badge>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
