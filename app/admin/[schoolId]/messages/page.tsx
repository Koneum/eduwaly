import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-utils'
import MessagingInterface from '@/components/messages/MessagingInterface'
import { checkFeatureAccess } from '@/lib/check-plan-limit'
import { PlanUpgradeBanner } from '@/components/plan-upgrade-banner'
import prisma from '@/lib/prisma'

export default async function AdminMessagesPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  
  if (!user || user.role !== 'SCHOOL_ADMIN') {
    redirect('/auth/login')
  }

  if (user.schoolId !== schoolId) {
    redirect(`/admin/${user.schoolId}`)
  }

  // Vérifier si la messagerie est disponible
  const featureCheck = await checkFeatureAccess(schoolId, 'messaging')
  
  if (!featureCheck.allowed) {
    // Récupérer le plan actuel
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    })

    const currentPlan = school?.subscription?.plan?.displayName || 'Essai Gratuit'

    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-responsive-xl font-bold text-foreground">Messagerie</h1>
          <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
            Communiquez avec les enseignants, étudiants et parents
          </p>
        </div>

        <PlanUpgradeBanner
          feature="Messagerie interne"
          currentPlan={currentPlan}
          requiredPlan="Basic"
        />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Messagerie</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
          Communiquez avec les enseignants, étudiants et parents
        </p>
      </div>

      <MessagingInterface currentUserId={user.id} schoolId={schoolId} />
    </div>
  )
}
