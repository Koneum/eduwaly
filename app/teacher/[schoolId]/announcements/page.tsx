import { requireSchoolAccess } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Calendar, User } from "lucide-react"

export default async function TeacherAnnouncementsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  const user = await requireSchoolAccess(schoolId)

  // Récupérer les annonces de l'école
  const announcements = await prisma.announcement.findMany({
    where: {
      schoolId: schoolId,
      isActive: true
    },
    orderBy: {
      publishedAt: 'desc'
    },
    take: 50
  }).then(announcements => 
    announcements.filter(a => {
      const audience = a.targetAudience as string[]
      return audience.includes('ALL') || audience.includes('TEACHER')
    })
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgent'
      case 'HIGH':
        return 'Important'
      case 'NORMAL':
        return 'Normal'
      default:
        return priority
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Annonces</h1>
          <p className="text-muted-foreground mt-2">
            Consultez les annonces et informations importantes
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune annonce pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {announcement.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(announcement.publishedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
