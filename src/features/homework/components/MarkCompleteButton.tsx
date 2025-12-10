'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface MarkCompleteButtonProps {
  homeworkId: string
  initialCompleted?: boolean
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function MarkCompleteButton({
  homeworkId,
  initialCompleted = false,
  className,
  size = 'sm',
}: MarkCompleteButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/homework/${homeworkId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })

      if (response.ok) {
        setIsCompleted(!isCompleted)
        startTransition(() => {
          router.refresh()
        })
      } else {
        const error = await response.json()
        console.error('Erreur:', error)
      }
    } catch (error) {
      console.error('Erreur réseau:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loading = isLoading || isPending

  return (
    <Button
      variant={isCompleted ? 'default' : 'outline'}
      size={size}
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'transition-all duration-200',
        isCompleted && 'bg-green-600 hover:bg-green-700 text-white',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Check className={cn(
          'h-4 w-4 mr-2',
          isCompleted ? 'text-white' : 'text-muted-foreground'
        )} />
      )}
      {isCompleted ? 'Terminé ✓' : "J'ai terminé"}
    </Button>
  )
}
