import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Activity {
  id: string
  schoolName: string
  action: string
  time: string
  type: "subscription" | "payment" | "alert"
}

interface RecentActivityProps {
  activities?: Activity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  // Données par défaut si aucune donnée n'est fournie
  const defaultActivities: Activity[] = [
    {
      id: "1",
      schoolName: "École Primaire Saint-Jean",
      action: "Nouvel abonnement Premium",
      time: "Il y a 2h",
      type: "subscription",
    },
    {
      id: "2",
      schoolName: "Lycée Victor Hugo",
      action: "Paiement reçu - 15,000 FCFA",
      time: "Il y a 4h",
      type: "payment",
    },
    {
      id: "3",
      schoolName: "Collège Moderne",
      action: "Alerte: Abonnement expire dans 3 jours",
      time: "Il y a 6h",
      type: "alert",
    },
    {
      id: "4",
      schoolName: "École Internationale",
      action: "Mise à jour du profil",
      time: "Il y a 1j",
      type: "subscription",
    },
  ]

  const activityData = activities || defaultActivities

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityData.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {activity.schoolName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">{activity.schoolName}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <Badge
                variant={
                  activity.type === "alert" ? "destructive" : activity.type === "payment" ? "default" : "secondary"
                }
                className="shrink-0"
              >
                {activity.type === "subscription" ? "Abonnement" : activity.type === "payment" ? "Paiement" : "Alerte"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
