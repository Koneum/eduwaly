"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface PaymentStatusData {
  paid: number
  overdue: number
  pending: number
}

interface PaymentStatusChartProps {
  data: PaymentStatusData
}

export function PaymentStatusChart({ data: paymentData }: PaymentStatusChartProps) {
  const data = [
    { name: "À jour", value: paymentData.paid, color: "var(--color-chart-2)" },
    { name: "En retard", value: paymentData.overdue, color: "var(--color-chart-5)" },
    { name: "En attente", value: paymentData.pending, color: "var(--color-chart-3)" },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-responsive-lg">Statut des Paiements</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-responsive-sm text-muted-foreground">
                {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
