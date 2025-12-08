/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, BookOpen, GraduationCap } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function StudentTeachersPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'STUDENT') redirect('/auth/login')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      filiere: true,
      school: true
    }
  })

  if (!student) redirect('/auth/login')

  // Récupérer les enseignants via les emplois du temps de la filière de l'étudiant
  const emploisDuTemps = await prisma.emploiDuTemps.findMany({
    where: {
      schoolId: student.schoolId,
      niveau: student.niveau,
      OR: [
        { filiereId: student.filiereId },
        { ueCommune: true }
      ]
    },
    include: {
      enseignant: {
        include: {
          user: true
        }
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
  
  // Récupérer le nombre total de modules de la filière
  const modules = await prisma.module.findMany({
    where: {
      schoolId: student.schoolId,
      OR: [
        { filiereId: student.filiereId },
        { isUeCommune: true }
      ]
    }
  })

  // Statistiques
  const totalTeachers = teachers.length
  const totalModules = modules.length
  const uniqueSpecialities = new Set(
    teachers
      .map(t => t.teacher.specialite)
      .filter(Boolean)
  ).size

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Équipe Pédagogique</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
          Vos enseignants pour l&apos;année {student.filiere?.nom || 'en cours'}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-primary">{totalTeachers}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Enseignants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{totalModules}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-responsive-xl sm:text-responsive-2xl font-bold text-foreground">{uniqueSpecialities}</p>
            <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground">Spécialités</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des enseignants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Vos Enseignants</CardTitle>
          <CardDescription className="text-responsive-sm">
            Les professeurs qui interviennent dans votre formation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-responsive-base sm:text-responsive-lg font-semibold text-foreground mb-2">
                Aucun enseignant assigné
              </h3>
              <p className="text-responsive-sm text-muted-foreground">
                Les enseignants seront affichés une fois les modules attribués
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {teachers.map(({ teacher, modules }) => {
                const initials = `${teacher.prenom?.[0] || ''}${teacher.nom?.[0] || ''}`.toUpperCase()
                const fullName = `${teacher.titre || ''} ${teacher.prenom} ${teacher.nom}`.trim()
                
                return (
                  <div 
                    key={teacher.id}
                    className="flex gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarImage src={teacher.user?.avatar || undefined} alt={fullName} />
                      <AvatarFallback className="text-responsive-base bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-foreground">
                        {fullName}
                      </h3>
                      
                      {teacher.specialite && (
                        <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground mt-0.5">
                          {teacher.specialite}
                        </p>
                      )}
                      
                      {/* Modules enseignés */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {modules.slice(0, 3).map((moduleName, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-[10px] sm:text-responsive-xs"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {moduleName}
                          </Badge>
                        ))}
                        {modules.length > 3 && (
                          <Badge variant="outline" className="text-[10px] sm:text-responsive-xs">
                            +{modules.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Contact (si disponible et autorisé) */}
                      <div className="flex flex-wrap gap-3 mt-3">
                        {teacher.user?.email && (
                          <a 
                            href={`mailto:${teacher.user.email}`}
                            className="flex items-center gap-1 text-responsive-xs text-primary hover:underline"
                          >
                            <Mail className="h-3 w-3" />
                            <span className="hidden sm:inline">{teacher.user.email}</span>
                            <span className="sm:hidden">Email</span>
                          </a>
                        )}
                        {teacher.telephone && (
                          <a 
                            href={`tel:${teacher.telephone}`}
                            className="flex items-center gap-1 text-responsive-xs text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{teacher.telephone}</span>
                          </a>
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
