/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, MessageCircle, Clock, User } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Link from "next/link"
import { NewCorrespondenceDialog } from "@/components/correspondence/NewCorrespondenceDialog"

export default async function ParentCorrespondencePage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'PARENT') redirect('/auth/login')

  // Récupérer le parent et ses enfants
  const parent = await prisma.parent.findFirst({
    where: { 
      userId: user.id,
      students: {
        some: { schoolId }
      }
    },
    include: {
      students: {
        where: { schoolId },
        include: {
          user: true,
          filiere: true,
          school: true
        }
      }
    }
  })

  if (!parent || parent.students.length === 0) redirect('/auth/login')

  // Récupérer les enseignants des enfants via les emplois du temps
  const filiereIds = parent.students.map(s => s.filiereId).filter(Boolean)
  const niveaux = [...new Set(parent.students.map(s => s.niveau))]

  const emploisDuTemps = await prisma.emploiDuTemps.findMany({
    where: {
      schoolId,
      niveau: { in: niveaux },
      OR: [
        { filiereId: { in: filiereIds as string[] } },
        { ueCommune: true }
      ]
    },
    include: {
      enseignant: {
        include: { user: true }
      },
      module: true
    }
  })

  // Créer un map des enseignants avec leurs modules
  const teacherMap = new Map<string, {
    teacher: any
    modules: string[]
  }>()

  emploisDuTemps.forEach(emploi => {
    if (emploi.enseignant && emploi.module) {
      const existing = teacherMap.get(emploi.enseignant.id)
      if (existing) {
        if (!existing.modules.includes(emploi.module.nom)) {
          existing.modules.push(emploi.module.nom)
        }
      } else {
        teacherMap.set(emploi.enseignant.id, {
          teacher: emploi.enseignant,
          modules: [emploi.module.nom]
        })
      }
    }
  })

  const teachers = Array.from(teacherMap.values())

  // Récupérer les conversations existantes avec des enseignants
  const conversations: any[] = await prisma.conversation.findMany({
    where: {
      schoolId,
      type: 'DIRECT',
      participants: {
        some: { userId: user.id }
      }
    },
    include: {
      participants: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  // Filtrer les conversations avec des enseignants
  const teacherUserIds = new Set(teachers.map(t => t.teacher.userId).filter(Boolean))
  const correspondences = conversations.filter((c: any) => 
    c.participants.some((p: any) => teacherUserIds.has(p.userId))
  )

  // Statistiques
  const unreadCount = correspondences.filter((c: any) => 
    c.messages[0] && !c.messages[0].readBy.includes(user.id)
  ).length

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-foreground">Carnet de Correspondance</h1>
          <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
            Échangez avec les enseignants de vos enfants
          </p>
        </div>
        <NewCorrespondenceDialog 
          teachers={teachers}
          students={parent.students}
          schoolId={schoolId}
        />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-primary">{correspondences.length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Conversations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-orange-600">{unreadCount}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Non lus</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{teachers.length}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Enseignants</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversations récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Conversations Récentes</CardTitle>
          <CardDescription className="text-responsive-sm">
            Vos échanges avec les enseignants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {correspondences.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground mb-2">
                Aucune conversation
              </h3>
              <p className="text-responsive-sm text-muted-foreground">
                Créez une nouvelle conversation pour échanger avec un enseignant
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {correspondences.map((conv: any) => {
                const lastMessage = conv.messages[0]
                const isUnread = lastMessage && !lastMessage.readBy.includes(user.id)
                
                return (
                  <Link
                    key={conv.id}
                    href={`/parent/${schoolId}/messages/${conv.id}`}
                    className={`block p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                      isUnread ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {conv.subject?.[0] || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground truncate">
                            {conv.subject || 'Conversation'}
                          </h3>
                          {isUnread && (
                            <Badge variant="default" className="text-[10px]">Nouveau</Badge>
                          )}
                        </div>
                        {lastMessage && (
                          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground truncate mt-1">
                            {lastMessage.senderRole === 'PARENT' ? 'Vous: ' : ''}{lastMessage.content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-responsive-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {lastMessage && new Date(lastMessage.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enseignants disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Enseignants de vos Enfants</CardTitle>
          <CardDescription className="text-responsive-sm">
            Contactez directement un enseignant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-responsive-sm text-muted-foreground">
                Aucun enseignant assigné pour le moment
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teachers.slice(0, 6).map(({ teacher, modules }) => {
                const initials = `${teacher.prenom?.[0] || ''}${teacher.nom?.[0] || ''}`.toUpperCase()
                const fullName = `${teacher.titre || ''} ${teacher.prenom} ${teacher.nom}`.trim()
                
                return (
                  <div 
                    key={teacher.id}
                    className="flex gap-3 p-3 border border-border rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={teacher.user?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-responsive-sm font-medium text-foreground truncate">
                        {fullName}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {modules.slice(0, 2).map((m, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px]">
                            <BookOpen className="h-2.5 w-2.5 mr-1" />
                            {m}
                          </Badge>
                        ))}
                        {modules.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">+{modules.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
