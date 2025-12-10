"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface PaymentStatusChartProps {
  schoolId: string
}

interface PaymentStats {
  paid: number
  pending: number
  overdue: number
}

export function PaymentStatusChart({ schoolId }: PaymentStatusChartProps) {
  const [stats, setStats] = useState<PaymentStats>({ paid: 0, pending: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/school-admin/payments/stats?schoolId=${schoolId}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [schoolId])

  const chartData = [
    { name: "Payés", value: stats.paid, color: "hsl(142, 76%, 36%)" }, // Vert
    { name: "En attente", value: stats.pending, color: "hsl(48, 96%, 53%)" }, // Jaune
    { name: "En retard", value: stats.overdue, color: "hsl(0, 84%, 60%)" }, // Rouge
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Statut des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-responsive-sm text-muted-foreground">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = stats.paid + stats.pending + stats.overdue

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Statut des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-responsive-sm text-muted-foreground">Aucun paiement enregistré</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-responsive-lg">Statut des Paiements</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie 
              data={chartData} 
              cx="50%" 
              cy="50%" 
              innerRadius={60} 
              outerRadius={90} 
              paddingAngle={5} 
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number) => [`${value} paiements`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-responsive-sm text-muted-foreground">
                {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p className="text-responsive-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{total}</span> paiements
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
