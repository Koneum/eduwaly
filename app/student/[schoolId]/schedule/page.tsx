import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function StudentSchedulePage({ 
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

  // Emploi du temps mockup
  const schedule = [
    { time: "08:00 - 09:00", subject: "Mathématiques", teacher: "Prof. Dupont", room: "Salle 201", status: "completed" },
    { time: "09:00 - 10:00", subject: "Français", teacher: "Prof. Martin", room: "Salle 105", status: "completed" },
    { time: "10:15 - 11:15", subject: "Anglais", teacher: "Prof. Smith", room: "Salle 302", status: "current" },
    { time: "11:15 - 12:15", subject: "Histoire", teacher: "Prof. Bernard", room: "Salle 108", status: "upcoming" },
    { time: "14:00 - 15:00", subject: "Physique", teacher: "Prof. Dubois", room: "Lab 1", status: "upcoming" },
    { time: "15:00 - 16:00", subject: "SVT", teacher: "Prof. Leroy", room: "Lab 2", status: "upcoming" },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mon Emploi du Temps</h1>
        <p className="text-muted-foreground mt-2">Vos cours du jour - {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aujourd&apos;hui</CardTitle>
          <CardDescription>Vos cours de la journée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schedule.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-4 p-4 border rounded-lg ${
                  item.status === "current"
                    ? "border-green-500 bg-green-50"
                    : item.status === "completed"
                      ? "border-border bg-muted opacity-60"
                      : "border-border"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      item.status === "current"
                        ? "bg-green-100"
                        : item.status === "completed"
                          ? "bg-muted"
                          : "bg-primary/10"
                    }`}
                  >
                    <Clock
                      className={`h-5 w-5 ${item.status === "current" ? "text-green-600" : "text-primary"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.subject}</h3>
                      {item.status === "current" && (
                        <Badge variant="default" className="bg-green-600">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-muted-foreground">{item.teacher}</p>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{item.room}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prochain Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground">Histoire</p>
              <p className="text-muted-foreground">Prof. Bernard</p>
              <div className="flex items-center gap-2 mt-3">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">11:15 - 12:15</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Salle 108</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Heures cette semaine</span>
              <span className="font-bold text-foreground">24h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Matières</span>
              <span className="font-bold text-foreground">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux de présence</span>
              <span className="font-bold text-green-600">96%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
