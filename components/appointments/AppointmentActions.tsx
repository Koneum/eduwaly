'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AppointmentActionsProps {
  appointmentId: string
}

export function AppointmentActions({ appointmentId }: AppointmentActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleAction = async (status: 'CONFIRMED' | 'CANCELLED') => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })

        if (response.ok) {
          toast.success(status === 'CONFIRMED' ? 'Rendez-vous confirmé' : 'Rendez-vous annulé')
          router.refresh()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Erreur')
        }
      } catch (error) {
        console.error('Erreur:', error)
        toast.error('Une erreur est survenue')
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        onClick={() => handleAction('CONFIRMED')}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => handleAction('CANCELLED')}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    </div>
  )
}
