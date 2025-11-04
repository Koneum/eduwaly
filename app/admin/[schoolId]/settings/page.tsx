import SchoolSettingsManager from "@/components/school-admin/school-settings-manager"
import UsersManager from "@/components/school-admin/users-manager"
import ProfileManager from "@/components/school-admin/profile-manager"
import { ReportIssueButton } from "@/components/admin/ReportIssueButton"
import prisma from "@/lib/prisma"
import { requireAdminDashboardAccess } from "@/lib/auth-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SettingsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const user = await requireAdminDashboardAccess()
  const { schoolId } = await params

  // Récupérer le type d'école
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { schoolType: true, name: true, email: true, phone: true, address: true }
  })

  if (!school) {
    return <div>École non trouvée</div>
  }

  // Récupérer les années scolaires
  const annees = await prisma.anneeUniversitaire.findMany({
    where: { schoolId },
    select: {
      id: true,
      annee: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Récupérer les bourses attribuées
  const scholarships = await prisma.scholarship.findMany({
    where: {
      student: {
        schoolId
      }
    },
    include: {
      student: {
        select: {
          studentNumber: true,
          user: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Récupérer les salles/classes selon le type d'école
  const rooms = school.schoolType === 'UNIVERSITY' 
    ? await prisma.room.findMany({
        where: { schoolId },
        select: { id: true, name: true, code: true, capacity: true, type: true },
        orderBy: { name: 'asc' }
      })
    : await prisma.class.findMany({
        where: { schoolId },
        select: { id: true, name: true, code: true, capacity: true, niveau: true },
        orderBy: { name: 'asc' }
      })

  // Récupérer tous les utilisateurs de l'école
  const users = await prisma.user.findMany({
    where: {
      schoolId: schoolId,
      role: {
        not: 'SUPER_ADMIN'
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          studentNumber: true,
          niveau: true,
          filiere: {
            select: {
              nom: true
            }
          }
        }
      },
      enseignant: {
        select: {
          id: true,
        }
      },
      parent: {
        select: {
          id: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance">Paramètres</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les paramètres de votre école et votre profil
          </p>
        </div>
        <ReportIssueButton />
      </div>

      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card">
          <TabsTrigger value="school">École</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="profile">Mon Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-6">
          <SchoolSettingsManager 
            schoolId={schoolId} 
            schoolType={school.schoolType}
            schoolData={{
              name: school.name,
              email: school.email,
              phone: school.phone,
              address: school.address
            }}
            annees={annees}
            rooms={rooms}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersManager 
            users={users.map(u => ({
              ...u,
              emailVerified: u.emailVerified ? new Date() : new Date()
            }))} 
            schoolId={schoolId} 
          />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <ProfileManager 
            user={{
              name: user.name || '',
              email: user.email || '',
              role: user.role || ''
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
