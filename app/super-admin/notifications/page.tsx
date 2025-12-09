import prisma from "@/lib/prisma"
import NotificationsManager from "@/components/super-admin/notifications-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { Bell } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  await requireSuperAdmin()
  
  const issuesData = await prisma.issueReport.findMany({
    include: {
      school: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Formater les données pour le composant
  const issues = issuesData.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    priority: issue.priority,
    status: issue.status,
    category: issue.category,
    reporterName: issue.reporterName,
    reporterEmail: issue.reporterEmail,
    createdAt: issue.createdAt,
    resolvedAt: issue.resolvedAt,
    resolution: issue.resolution,
    school: issue.school
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Bell className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Notifications & Signalements</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">Gestion de tous les signalements des écoles</p>
            </div>
          </div>
        </div>
      </div>

      <NotificationsManager initialIssues={issues} />
    </div>
  )
}
