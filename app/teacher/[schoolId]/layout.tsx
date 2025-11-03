import { requireSchoolAccess } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { TeacherNav } from "@/components/teacher-nav"

export default async function TeacherLayout({
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
      <TeacherNav schoolId={schoolId} schoolName={school.name} />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
