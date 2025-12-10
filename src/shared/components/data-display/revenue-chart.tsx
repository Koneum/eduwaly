"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts"
import { TrendingUp, BarChart3 } from "lucide-react"
import { useState } from "react"

interface RevenueData {
  month: string
  revenue: number
}

interface RevenueChartProps {
  data?: RevenueData[]
  title?: string
}

export function RevenueChart({ data, title = "Revenus Mensuels" }: RevenueChartProps) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  
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
  const totalRevenue = chartData.reduce((acc, item) => acc + item.revenue, 0)
  const avgRevenue = totalRevenue / chartData.length

  return (
    <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm border-0 shadow-lg">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">{title}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Total: <span className="font-semibold text-foreground">{totalRevenue.toLocaleString('fr-FR')} FCFA</span>
          </p>
        </div>
        
        {/* Chart type toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setChartType('area')}
            className={`p-2 rounded-md transition-all ${
              chartType === 'area' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-md transition-all ${
              chartType === 'bar' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={280}>
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC300" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#FFC300" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#FFC300" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="currentColor" 
                strokeOpacity={0.1}
                vertical={false}
              />
              <XAxis 
                dataKey="month" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
              />
              <YAxis 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
                tickFormatter={(value) => value > 0 ? `${(value / 1000).toFixed(0)}k` : '0'}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FFC300"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ fill: '#FFC300', strokeWidth: 0, r: 0 }}
                activeDot={{ fill: '#FFC300', stroke: '#fff', strokeWidth: 2, r: 6 }}
              />
              {/* Average line */}
              <Area
                type="monotone"
                dataKey={() => avgRevenue}
                stroke="#2C3E50"
                strokeWidth={1}
                strokeDasharray="5 5"
                fillOpacity={0}
                dot={false}
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFC300" stopOpacity={1} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="currentColor" 
                strokeOpacity={0.1}
                vertical={false}
              />
              <XAxis 
                dataKey="month" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
              />
              <YAxis 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', opacity: 0.5 }}
                tickFormatter={(value) => value > 0 ? `${(value / 1000).toFixed(0)}k` : '0'}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="revenue"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { month: string } }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-xl">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {payload[0].payload.month}
        </p>
        <p className="text-lg font-bold text-foreground">
          {new Intl.NumberFormat('fr-FR').format(payload[0].value)} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
        </p>
      </div>
    )
  }
  return null
}
