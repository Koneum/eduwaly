import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Activity {
  id: string
  schoolName: string
  action: string
  time: string
  type: "subscription" | "payment" | "alert"
  subscriptionStatus?: "active" | "trial" | "expired" | "cancelled"
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
      subscriptionStatus: "active",
    },
    {
      id: "2",
      schoolName: "Lycée Victor Hugo",
      action: "Essai gratuit de 30 jours",
      time: "Il y a 4h",
      type: "subscription",
      subscriptionStatus: "trial",
    },
    {
      id: "3",
      schoolName: "Collège Moderne",
      action: "Abonnement expiré",
      time: "Il y a 6h",
      type: "alert",
      subscriptionStatus: "expired",
    },
    {
      id: "4",
      schoolName: "École Internationale",
      action: "Abonnement résilié",
      time: "Il y a 1j",
      type: "subscription",
      subscriptionStatus: "cancelled",
    },
  ]

  const activityData = activities || defaultActivities

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-responsive-lg">Activité Récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {activityData.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 sm:gap-4">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-responsive-xs">
                  {activity.schoolName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-responsive-sm font-medium leading-none text-foreground">{activity.schoolName}</p>
                <p className="text-responsive-sm text-muted-foreground">{activity.action}</p>
                <p className="text-responsive-xs text-muted-foreground">{activity.time}</p>
              </div>
              <Badge
                variant={
                  activity.subscriptionStatus === "active"
                    ? "success"
                    : activity.subscriptionStatus === "trial" || activity.subscriptionStatus === "expired"
                    ? "warning"
                    : activity.subscriptionStatus === "cancelled"
                    ? "destructive"
                    : activity.type === "payment"
                    ? "default"
                    : "secondary"
                }
                className="shrink-0 text-responsive-xs"
              >
                {activity.subscriptionStatus === "active"
                  ? "Abonné"
                  : activity.subscriptionStatus === "trial"
                  ? "Essai 30j"
                  : activity.subscriptionStatus === "expired"
                  ? "Expiré"
                  : activity.subscriptionStatus === "cancelled"
                  ? "Résilié"
                  : activity.type === "payment"
                  ? "Abonné"
                  : "Abonnement"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
