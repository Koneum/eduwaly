"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface RevenueData {
  month: string
  revenue: number
}

interface RevenueChartProps {
  data?: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Données par défaut si aucune donnée n'est fournie
  const defaultData: RevenueData[] = [
    { month: "Jan", revenue: 0 },
    { month: "Fév", revenue: 0 },
    { month: "Mar", revenue: 0 },
    { month: "Avr", revenue: 0 },
    { month: "Mai", revenue: 0 },
    { month: "Juin", revenue: 0 },
    { month: "Juil", revenue: 0 },
    { month: "Août", revenue: 0 },
    { month: "Sep", revenue: 0 },
    { month: "Oct", revenue: 0 },
    { month: "Nov", revenue: 0 },
    { month: "Déc", revenue: 0 },
  ]

  const chartData = data && data.length > 0 ? data : defaultData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-responsive-lg">Revenus Mensuels</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-muted-foreground" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-muted-foreground" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Mois
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.month}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Revenus
                          </span>
                          <span className="font-bold">
                            {new Intl.NumberFormat('fr-FR').format(payload[0].value as number)} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
