import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info'
}

const variantStyles = {
  default: {
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400',
    accentBorder: 'border-l-gray-400 dark:border-l-gray-600'
  },
  primary: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    accentBorder: 'border-l-amber-500 dark:border-l-amber-400'
  },
  success: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentBorder: 'border-l-emerald-500 dark:border-l-emerald-400'
  },
  warning: {
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    accentBorder: 'border-l-orange-500 dark:border-l-orange-400'
  },
  info: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accentBorder: 'border-l-blue-500 dark:border-l-blue-400'
  }
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className,
  variant = 'default'
}: StatCardProps) {
  const styles = variantStyles[variant]
  
  return (
    <Card className={cn(
      "relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
      "bg-card/80 backdrop-blur-sm",
      styles.accentBorder,
      className
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] dark:to-white/[0.02] pointer-events-none" />
      
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
          
          {/* Icon container with glow effect */}
          <div className={cn(
            "flex-shrink-0 p-2.5 sm:p-3 rounded-xl transition-transform duration-300 hover:scale-110",
            styles.iconBg
          )}>
            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", styles.iconColor)} />
          </div>
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              trend.isPositive 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.isPositive ? "+" : ""}{trend.value}%
            </div>
            <span className="text-xs text-muted-foreground">vs mois dernier</span>
          </div>
        )}
      </div>
    </Card>
  )
}
