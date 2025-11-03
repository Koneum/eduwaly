import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, MapPin } from "lucide-react"
import prisma from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function ParentSchedulePage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  if (!user || user.role !== 'PARENT') redirect('/auth/login')

  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: true,
          filiere: true
        }
      }
    }
  })

  if (!parent) redirect('/auth/login')

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Emplois du Temps</h1>
        <p className="text-muted-foreground mt-2">Consultez les emplois du temps de vos enfants</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emplois du Temps par Enfant</CardTitle>
          <CardDescription>Sélectionnez un enfant pour voir son planning</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={parent.students[0]?.id || "0"} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${parent.students.length}, 1fr)` }}>
              {parent.students.map((student) => (
                <TabsTrigger key={student.id} value={student.id}>
                  {student.user?.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            {parent.students.map((student) => (
              <TabsContent key={student.id} value={student.id} className="space-y-4 mt-4">
                <div className="space-y-3">
                  {[
                    { time: "08:00 - 09:00", subject: "Mathématiques", teacher: "Prof. Dupont", room: "Salle 201" },
                    { time: "09:00 - 10:00", subject: "Français", teacher: "Prof. Martin", room: "Salle 105" },
                    { time: "10:15 - 11:15", subject: "Anglais", teacher: "Prof. Smith", room: "Salle 302" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold text-foreground">{item.subject}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">{item.teacher}</p>
                              <span className="text-muted-foreground">•</span>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">{item.room}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{item.time}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
