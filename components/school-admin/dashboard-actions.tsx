'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardActionsProps {
  schoolId: string
}

export default function DashboardActions({ schoolId }: DashboardActionsProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-responsive-lg">Actions Rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        <button 
          onClick={() => router.push(`/admin/${schoolId}/students?action=add`)}
          className="w-full p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <div className="font-medium text-responsive-sm text-foreground">Ajouter un étudiant</div>
          <div className="text-responsive-xs text-muted-foreground mt-1">Inscrire un nouvel étudiant</div>
        </button>
        <button 
          onClick={() => router.push(`/admin/${schoolId}/finance?action=add-payment`)}
          className="w-full p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <div className="font-medium text-responsive-sm text-foreground">Enregistrer un paiement</div>
          <div className="text-responsive-xs text-muted-foreground mt-1">Saisir un nouveau paiement</div>
        </button>
        <button 
          onClick={() => router.push(`/admin/${schoolId}/finance?action=send-reminders`)}
          className="w-full p-3 sm:p-4 text-left rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <div className="font-medium text-responsive-sm text-foreground">Envoyer des rappels</div>
          <div className="text-responsive-xs text-muted-foreground mt-1">Rappeler les paiements en retard</div>
        </button>
      </CardContent>
    </Card>
  )
}
