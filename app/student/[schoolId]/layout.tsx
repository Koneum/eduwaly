import { requireSchoolAccess } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { StudentNav } from "@/components/student-nav"

export default async function StudentLayout({
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
  })

  if (!school) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNav schoolId={schoolId} schoolName={school.name} />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
