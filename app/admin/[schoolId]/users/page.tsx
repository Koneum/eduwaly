import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Users, UserCheck, Key } from "lucide-react"
import prisma from "@/lib/prisma"
import { requireSchoolAccess } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

// Local typed shapes to avoid implicit `any` in map callbacks
type UserRow = {
  id: string
  name: string
  email: string | null
  role: string
  isActive: boolean
}

type FiliereLite = { id: string; nom: string }

type StudentRow = {
  id: string
  studentNumber: string
  enrollmentId: string
  user?: { name?: string } | null
  niveau: string
  filiere?: FiliereLite | null
  isEnrolled: boolean
}

type TeacherRow = {
  id: string
  titre?: string | null
  nom: string
  prenom: string
  email?: string | null
  grade?: string | null
  type?: string | null
  userId?: string | null
}

export default async function UsersManagementPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      users: {
        orderBy: { createdAt: 'desc' }
      },
      students: {
        include: {
          user: true,
          filiere: true
        }
      },
      enseignants: {
        include: {
          user: true
        }
      }
    }
  })

  if (!school) {
    redirect('/admin')
  }

  // Statistiques
  const users = school.users as UserRow[]
  const totalUsers = users.length
  const adminUsers = users.filter(u => u.role === 'SCHOOL_ADMIN').length
  const teacherUsers = users.filter(u => u.role === 'TEACHER').length
  const studentUsers = users.filter(u => u.role === 'STUDENT').length
  const parentUsers = users.filter(u => u.role === 'PARENT').length

  const students = school.students as StudentRow[]
  const enrolledStudents = students.filter(s => s.isEnrolled).length
  const pendingStudents = students.filter(s => !s.isEnrolled).length

  const teachers = school.enseignants as TeacherRow[]

  const roleColors = {
    SCHOOL_ADMIN: "bg-purple-100 text-purple-700",
    TEACHER: "bg-blue-100 text-blue-700",
    STUDENT: "bg-green-100 text-green-700",
    PARENT: "bg-orange-100 text-orange-700",
  }

  const roleLabels = {
    SCHOOL_ADMIN: "Administrateur",
    TEACHER: "Enseignant",
    STUDENT: "Étudiant",
    PARENT: "Parent",
    SUPER_ADMIN: "Super Admin"
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground mt-2">Créez et gérez les comptes utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Key className="h-4 w-4 mr-2" />
            Générer Identifiants
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Utilisateur
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{adminUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enseignants</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{teacherUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Étudiants</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{studentUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Parents</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{parentUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Tous ({totalUsers})</TabsTrigger>
          <TabsTrigger value="students">Étudiants ({studentUsers})</TabsTrigger>
          <TabsTrigger value="teachers">Enseignants ({teacherUsers})</TabsTrigger>
          <TabsTrigger value="parents">Parents ({parentUsers})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({pendingStudents})</TabsTrigger>
        </TabsList>

        {/* Tous les utilisateurs */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tous les Utilisateurs</CardTitle>
                  <CardDescription>{totalUsers} comptes actifs</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user: UserRow) => (
                  <div key={user.id} className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 text-primary font-bold text-lg w-12 h-12 rounded-full flex items-center justify-center">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                          {roleLabels[user.role as keyof typeof roleLabels]}
                        </Badge>
                        <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-600" : ""}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        <Button variant="outline" size="sm">Modifier</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Étudiants */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Étudiants Inscrits</CardTitle>
                  <CardDescription>{enrolledStudents} enrôlés / {students.length} total</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Inscrire Étudiant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((student: StudentRow) => (
                  <div key={student.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">
                            {student.user?.name || "Non enrôlé"}
                          </h3>
                          {student.isEnrolled ? (
                            <Badge className="bg-green-100 text-green-700">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Enrôlé
                            </Badge>
                          ) : (
                            <Badge variant="secondary">En attente</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-muted-foreground">N°: {student.studentNumber}</p>
                          <Badge variant="outline">{student.niveau}</Badge>
                          {student.filiere && (
                            <Badge variant="outline">{student.filiere.nom}</Badge>
                          )}
                        </div>
                        {!student.isEnrolled && (
                          <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                            <p className="text-xs text-amber-700">
                              <Key className="h-3 w-3 inline mr-1" />
                              ID d&apos;enrôlement: <code className="font-mono font-bold">{student.enrollmentId}</code>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Voir détails</Button>
                        {!student.isEnrolled && (
                          <Button size="sm">Envoyer ID</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enseignants */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Enseignants</CardTitle>
                  <CardDescription>{teachers.length} enseignants</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Enseignant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teachers.map((teacher: TeacherRow) => (
                  <div key={teacher.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {teacher.titre} {teacher.nom} {teacher.prenom}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          <Badge variant="outline">{teacher.grade}</Badge>
                          <Badge className="bg-blue-100 text-blue-700">{teacher.type}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Modifier</Button>
                        {!teacher.userId && (
                          <Button size="sm">Créer compte</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parents */}
        <TabsContent value="parents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parents</CardTitle>
              <CardDescription>Comptes parents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Les parents s&apos;enrôlent avec l&apos;ID de leur enfant</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* En attente */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inscriptions en Attente</CardTitle>
              <CardDescription>{pendingStudents} étudiants en attente d&apos;enrôlement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.filter((s: StudentRow) => !s.isEnrolled).map((student: StudentRow) => (
                  <div key={student.id} className="p-4 border-2 border-dashed border-amber-300 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">Étudiant N° {student.studentNumber}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline">{student.niveau}</Badge>
                          {student.filiere && (
                            <Badge variant="outline">{student.filiere.nom}</Badge>
                          )}
                        </div>
                        <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                          <p className="text-sm font-medium text-foreground mb-1">ID d&apos;enrôlement</p>
                          <code className="text-lg font-mono font-bold text-primary">{student.enrollmentId}</code>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm">
                          <Key className="h-4 w-4 mr-2" />
                          Copier ID
                        </Button>
                        <Button variant="outline" size="sm">Envoyer par email</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
