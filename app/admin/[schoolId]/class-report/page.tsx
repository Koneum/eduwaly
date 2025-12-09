import { requireSchoolAdmin } from '@/lib/auth-utils'
import ClassReportManager from '@/components/admin/class-report-manager'

export const dynamic = 'force-dynamic'

export default async function ClassReportPage() {
  await requireSchoolAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bulletin de Classe</h1>
        <p className="text-muted-foreground mt-2">
          Vue agrégée des notes et performances par classe, niveau ou filière
        </p>
      </div>
      <ClassReportManager />
    </div>
  )
}
