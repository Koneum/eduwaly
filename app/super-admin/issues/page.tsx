import IssuesManager from "@/components/super-admin/issues-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function IssuesPage() {
  await requireSuperAdmin()

  // Stats
  const issues = await prisma.issueReport.findMany()
  const totalIssues = issues.length
  const openIssues = issues.filter(i => i.status === 'OPEN').length
  const inProgressIssues = issues.filter(i => i.status === 'IN_PROGRESS').length
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Signalements & Support</h1>
                <p className="text-white/80 mt-1 text-sm md:text-base">Gérez les problèmes reportés par les écoles</p>
              </div>
            </div>
          </div>
          
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Total
              </div>
              <p className="text-2xl font-bold">{totalIssues}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Ouverts
              </div>
              <p className="text-2xl font-bold">{openIssues}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                En cours
              </div>
              <p className="text-2xl font-bold">{inProgressIssues}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <CheckCircle className="h-3.5 w-3.5" />
                Résolus
              </div>
              <p className="text-2xl font-bold">{resolvedIssues}</p>
            </div>
          </div>
        </div>
      </div>

      <IssuesManager />
    </div>
  )
}
