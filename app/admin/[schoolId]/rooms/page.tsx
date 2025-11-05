import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Building2, Users, CheckCircle, XCircle, Plus } from "lucide-react"
import prisma from "@/lib/prisma"

type RoomModel = {
  id: string
  name: string
  code: string
  capacity: number
  isAvailable: boolean
  type: string
  equipment?: string | null
  building?: string | null
  floor?: string | null
}
import { requireSchoolAccess } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import RoomsManager from "@/components/school-admin/rooms-manager"
import { Button } from '@/components/ui/button'

export default async function RoomsManagementPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  const school = (await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      rooms: {
        orderBy: { name: 'asc' }
      }
    }
  })) as unknown as ({ rooms: RoomModel[]; schoolType: 'HIGH_SCHOOL' | 'UNIVERSITY' } & Record<string, unknown>) | null

  if (!school) {
    redirect('/admin')
  }

  // Si c'est un lycée, rediriger vers la gestion des classes
  if (school.schoolType === 'HIGH_SCHOOL') {
    redirect(`/admin/${schoolId}/classes`)
  }

  const roomTypes = {
    AMPHITHEATER: { label: "Amphithéâtre", color: "bg-purple-100 text-purple-700" },
    CLASSROOM: { label: "Salle de classe", color: "bg-blue-100 text-blue-700" },
    LABORATORY: { label: "Laboratoire", color: "bg-green-100 text-green-700" },
    COMPUTER_LAB: { label: "Salle informatique", color: "bg-cyan-100 text-cyan-700" },
    LIBRARY: { label: "Bibliothèque", color: "bg-orange-100 text-orange-700" },
    SPORTS_HALL: { label: "Salle de sport", color: "bg-red-100 text-red-700" },
    CONFERENCE: { label: "Salle de conférence", color: "bg-indigo-100 text-indigo-700" },
    OTHER: { label: "Autre", color: "bg-gray-100 text-gray-700" },
  }

  const totalCapacity = school!.rooms.reduce<number>((sum, room: RoomModel) => sum + room.capacity, 0)
  const availableRooms = school!.rooms.filter((r: RoomModel) => r.isAvailable).length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Salles</h1>
          <p className="text-muted-foreground mt-2">Gérez les salles de votre établissement</p>
        </div>
        <RoomsManager schoolId={schoolId} schoolType={school.schoolType} />
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Salles</p>
                <p className="text-3xl font-bold text-foreground mt-2">{school.rooms.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacité Totale</p>
                <p className="text-3xl font-bold text-foreground mt-2">{totalCapacity}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{availableRooms}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupées</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{school.rooms.length - availableRooms}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des salles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des Salles</CardTitle>
              <CardDescription>{school.rooms.length} salles enregistrées</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {school.rooms.map((room) => {
              const equipment = JSON.parse(room.equipment || '[]')
              const typeInfo = roomTypes[room.type as keyof typeof roomTypes]
              
              return (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Code: {room.code}</p>
                      </div>
                      <Badge variant={room.isAvailable ? "default" : "secondary"} className={room.isAvailable ? "bg-green-600" : ""}>
                        {room.isAvailable ? "Disponible" : "Occupée"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Capacité</span>
                        <span className="font-medium text-foreground">{room.capacity} places</span>
                      </div>
                      {room.building && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Bâtiment</span>
                          <span className="font-medium text-foreground">{room.building}</span>
                        </div>
                      )}
                      {room.floor && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Étage</span>
                          <span className="font-medium text-foreground">{room.floor}</span>
                        </div>
                      )}
                    </div>

                    {equipment.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Équipements</p>
                        <div className="flex flex-wrap gap-1">
                          {equipment.map((eq: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{eq}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">Modifier</Button>
                      <Button variant="ghost" size="sm" className="flex-1">Supprimer</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {school.rooms.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucune salle</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter votre première salle</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une salle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
