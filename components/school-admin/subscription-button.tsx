'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

interface SubscriptionButtonProps {
  schoolId: string
}

export default function SubscriptionButton({ schoolId }: SubscriptionButtonProps) {
  const router = useRouter()

  return (
    <Button 
      onClick={() => router.push(`/admin/${schoolId}/subscription`)}
      className="btn-responsive px-4 sm:px-6 py-2"
    >
      Gérer l&apos;abonnement
    </Button>
  )
}
