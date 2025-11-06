import prisma from "@/lib/prisma"
import NotificationsManager from "@/components/super-admin/notifications-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notifications & Signalements</h1>
        <p className="text-muted-foreground mt-2">Gestion de tous les signalements des écoles</p>
      </div>
      <NotificationsManager initialIssues={issues} />
    </div>
  )
}
