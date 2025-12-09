import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle, Clock, AlertTriangle, XCircle, CreditCard, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  schoolName: string
  action: string
  time: string
  type: "subscription" | "payment" | "alert"
  subscriptionStatus?: "active" | "trial" | "expired" | "cancelled"
}

interface RecentActivityProps {
  activities?: ActivityItem[]
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    label: "Actif",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500"
  },
  trial: {
    icon: Clock,
    label: "Essai",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500"
  },
  expired: {
    icon: AlertTriangle,
    label: "Expiré",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500"
  },
  cancelled: {
    icon: XCircle,
    label: "Résilié",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500"
  },
  payment: {
    icon: CreditCard,
    label: "Paiement",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500"
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const defaultActivities: ActivityItem[] = [
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
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-lg h-full">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold text-foreground">Activité Récente</CardTitle>
          <p className="text-xs text-muted-foreground">{activityData.length} dernières actions</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-1">
        {activityData.map((activity, index) => {
          const status = activity.subscriptionStatus 
            ? statusConfig[activity.subscriptionStatus] 
            : activity.type === "payment" 
              ? statusConfig.payment 
              : statusConfig.active
          const StatusIcon = status.icon
          
          return (
            <div 
              key={activity.id} 
              className={cn(
                "group relative flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                "hover:bg-muted/50 cursor-pointer"
              )}
            >
              {/* Timeline line */}
              {index < activityData.length - 1 && (
                <div className="absolute left-[22px] top-12 w-0.5 h-[calc(100%-24px)] bg-border" />
              )}
              
              {/* Status dot */}
              <div className={cn(
                "relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                status.bg
              )}>
                <div className={cn("w-2 h-2 rounded-full", status.dot)} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {activity.schoolName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {activity.action}
                    </p>
                  </div>
                  
                  {/* Status badge */}
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0",
                    status.bg,
                    status.text
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{status.label}</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </p>
              </div>
            </div>
          )
        })}
        
        {activityData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Aucune activité récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
