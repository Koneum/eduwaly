import { requireSchoolAdmin } from '@/lib/auth-utils'
import AnnouncementsManager from '@/components/announcements/AnnouncementsManager'

export default async function AdminAnnouncementsPage() {
  await requireSchoolAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <AnnouncementsManager isSuperAdmin={false} />
    </div>
  )
}
