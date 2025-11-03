import IssuesManager from "@/components/super-admin/issues-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"

export default async function IssuesPage() {
  await requireSuperAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Signalements & Support</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les signalements et problèmes reportés par les écoles
        </p>
      </div>

      <IssuesManager />
    </div>
  )
}
