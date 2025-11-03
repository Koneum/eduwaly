import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Download } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function StudentCoursesPage({ 
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
      user: true,
      filiere: true,
      school: true
    }
  })

  if (!student) redirect('/auth/login')

  // Cours mockup
  const courses = [
    { id: 1, name: "Mathématiques", teacher: "Prof. Dupont", average: 16.5, progress: 75, resources: 12, color: "bg-blue-500" },
    { id: 2, name: "Français", teacher: "Prof. Martin", average: 15.2, progress: 80, resources: 10, color: "bg-green-500" },
    { id: 3, name: "Anglais", teacher: "Prof. Smith", average: 17.0, progress: 70, resources: 8, color: "bg-purple-500" },
    { id: 4, name: "Histoire", teacher: "Prof. Bernard", average: 14.8, progress: 65, resources: 15, color: "bg-orange-500" },
    { id: 5, name: "Physique", teacher: "Prof. Dubois", average: 15.5, progress: 72, resources: 11, color: "bg-cyan-500" },
    { id: 6, name: "SVT", teacher: "Prof. Leroy", average: 16.0, progress: 78, resources: 9, color: "bg-teal-500" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Cours</h1>
        <p className="text-muted-foreground mt-2">Consultez vos matières et ressources</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-1 h-12 ${course.color} rounded-full mb-3`} />
              <CardTitle className="text-lg">{course.name}</CardTitle>
              <CardDescription>{course.teacher}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Moyenne</span>
                  <span className="text-2xl font-bold text-foreground">{course.average}/20</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium text-foreground">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{course.resources} ressources</span>
                </div>
                <Button variant="ghost" size="sm">
                  Voir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ressources Récentes</CardTitle>
          <CardDescription>Documents et supports de cours disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: "Cours Chapitre 5 - Algèbre", subject: "Mathématiques", date: "Il y a 2j", size: "2.3 MB" },
              { title: "Fiche de révision - Grammaire", subject: "Français", date: "Il y a 3j", size: "1.8 MB" },
              { title: "Exercices - Past Simple", subject: "Anglais", date: "Il y a 5j", size: "1.2 MB" },
            ].map((resource, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{resource.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{resource.subject}</Badge>
                      <span className="text-xs text-muted-foreground">{resource.date}</span>
                      <span className="text-xs text-muted-foreground">• {resource.size}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
