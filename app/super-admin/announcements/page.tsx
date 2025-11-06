import { requireSuperAdmin } from '@/lib/auth-utils'
import AnnouncementsManager from '@/components/announcements/AnnouncementsManager'

export const dynamic = 'force-dynamic'

export default async function SuperAdminAnnouncementsPage() {
  await requireSuperAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <AnnouncementsManager isSuperAdmin={true} />
    </div>
  )
}
