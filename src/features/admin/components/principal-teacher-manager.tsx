'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Crown, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Class {
  id: string
  name: string
  code: string
  niveau: string
}

interface PrincipalTeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacherId: string
  teacherName: string
  currentClassId?: string | null
  isPrincipal: boolean
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
  onSuccess: () => void
}

export function PrincipalTeacherDialog({
  open,
  onOpenChange,
  teacherId,
  teacherName,
  currentClassId,
  isPrincipal,
  schoolType,
  onSuccess
}: PrincipalTeacherDialogProps) {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClassId || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const fetchClasses = useCallback(async () => {
    setIsFetching(true)
    try {
      const response = await fetch('/api/admin/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Erreur chargement classes:', error)
    } finally {
      setIsFetching(false)
    }
  }, [])

  // Charger les classes disponibles quand le dialog s'ouvre (lycée uniquement)
  useEffect(() => {
    if (open && schoolType === 'HIGH_SCHOOL') {
      fetchClasses()
    }
  }, [open, schoolType, fetchClasses])

  // Ne pas afficher pour les universités
  if (schoolType !== 'HIGH_SCHOOL') {
    return null
  }

  const handleAssign = async () => {
    if (!selectedClassId) {
      toast.error('Veuillez sélectionner une classe')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/principal-teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          classId: selectedClassId,
          isPrincipal: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur')
      }

      toast.success(data.message || 'Prof principal assigné')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/principal-teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          isPrincipal: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur')
      }

      toast.success(data.message || 'Statut retiré')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-responsive-lg">
            <Crown className="h-5 w-5 text-yellow-500" />
            Prof Principal
          </DialogTitle>
          <DialogDescription className="text-responsive-sm">
            {isPrincipal 
              ? `${teacherName} est actuellement prof principal`
              : `Assigner ${teacherName} comme prof principal d'une classe`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPrincipal ? (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-responsive-sm">Classe assignée</span>
              </div>
              <p className="text-responsive-sm text-muted-foreground">
                {classes.find(c => c.id === currentClassId)?.name || currentClassId || 'Classe non spécifiée'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="class" className="text-responsive-sm">
                Sélectionner une classe *
              </Label>
              {isFetching ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-responsive-sm">Chargement des classes...</span>
                </div>
              ) : (
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="text-responsive-sm">
                    <SelectValue placeholder="Choisir une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="none" disabled className="text-responsive-sm">
                        Aucune classe disponible
                      </SelectItem>
                    ) : (
                      classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id} className="text-responsive-sm">
                          {cls.name} ({cls.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <p className="text-responsive-xs text-muted-foreground">
                Le prof principal est responsable du suivi de cette classe
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          {isPrincipal ? (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrait...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Retirer le statut
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleAssign}
              disabled={isLoading || !selectedClassId}
              className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assignation...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Assigner
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Badge pour afficher le statut prof principal
export function PrincipalTeacherBadge({ 
  isPrincipal, 
  className 
}: { 
  isPrincipal: boolean
  className?: string 
}) {
  if (!isPrincipal) return null

  return (
    <Badge 
      className={`bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ${className}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      Prof Principal
    </Badge>
  )
}
