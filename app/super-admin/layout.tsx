import type React from "react"
import { SuperAdminNav } from "@/components/super-admin-nav"
import { requireSuperAdmin } from "@/lib/auth-utils"

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminNav />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">{children}</div>
      </main>
    </div>
  )
}
