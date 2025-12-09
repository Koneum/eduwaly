import prisma from "@/lib/prisma"
import SchoolsManager from "@/components/super-admin/schools-manager"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { School, GraduationCap, Building2, Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function SchoolsPage() {
  await requireSuperAdmin()
  
  const schools = await prisma.school.findMany({
    include: {
      subscription: {
        include: { plan: true }
      },
      _count: {
        select: { 
          students: true,
          users: true,
          enseignants: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const plansData = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  // Stats
  const totalSchools = schools.length
  const activeSchools = schools.filter(s => s.isActive).length
  const universities = schools.filter(s => s.schoolType === 'UNIVERSITY').length
  const highSchools = schools.filter(s => s.schoolType === 'HIGH_SCHOOL').length
  const totalStudents = schools.reduce((acc, s) => acc + s._count.students, 0)

  // Convertir les Decimal en number pour les composants client
  const plans = plansData.map(plan => ({
    ...plan,
    price: Number(plan.price)
  }))

  const schoolsData = schools.map(school => ({
    ...school,
    subscription: school.subscription ? {
      ...school.subscription,
      plan: {
        ...school.subscription.plan,
        price: Number(school.subscription.plan.price)
      }
    } : null
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <School className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Gestion des Écoles</h1>
                <p className="text-white/80 mt-1 text-sm md:text-base">Gérez tous les établissements inscrits</p>
              </div>
            </div>
          </div>
          
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <School className="h-3.5 w-3.5" />
                Total
              </div>
              <p className="text-2xl font-bold">{totalSchools}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <Building2 className="h-3.5 w-3.5" />
                Universités
              </div>
              <p className="text-2xl font-bold">{universities}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <GraduationCap className="h-3.5 w-3.5" />
                Lycées
              </div>
              <p className="text-2xl font-bold">{highSchools}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-white/70 text-xs mb-1">
                <Users className="h-3.5 w-3.5" />
                Étudiants
              </div>
              <p className="text-2xl font-bold">{totalStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <SchoolsManager initialSchools={schoolsData} plans={plans} />
    </div>
  )
}
