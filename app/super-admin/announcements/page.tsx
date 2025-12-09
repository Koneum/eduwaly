import { requireSuperAdmin } from '@/lib/auth-utils'
import AnnouncementsManager from '@/components/announcements/AnnouncementsManager'
import { Megaphone } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminAnnouncementsPage() {
  await requireSuperAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Megaphone className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Annonces Globales</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">Communiquez avec toutes les écoles</p>
            </div>
          </div>
        </div>
      </div>

      <AnnouncementsManager isSuperAdmin={true} />
    </div>
  )
}
