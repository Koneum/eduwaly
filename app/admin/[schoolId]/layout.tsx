import { AdminSchoolNav } from "@/components/admin-school-nav"
import { requireSchoolAccess } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params
  await requireSchoolAccess(schoolId)

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      name: true,
      schoolType: true,
    }
  })

  if (!school) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSchoolNav 
        schoolId={schoolId} 
        schoolName={school.name}
        schoolType={school.schoolType}
      />
      <main className="lg:pl-64">
        <div className="lg:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  )
}
