import { requireSchoolAdmin } from '@/lib/auth-utils'
import PollsManager from '@/components/admin/polls-manager'

export const dynamic = 'force-dynamic'

export default async function PollsPage() {
  await requireSchoolAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sondages</h1>
        <p className="text-muted-foreground mt-2">
          Créez et gérez des sondages pour votre communauté scolaire
        </p>
      </div>
      <PollsManager />
    </div>
  )
}
