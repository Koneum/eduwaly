import { getAuthUser, requireSchoolAccess } from "@/lib/auth-utils"
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

  const [school, user] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
    }),
    getAuthUser(),
  ])

  if (!school) {
    notFound()
  }

  const student = user && user.role === 'STUDENT'
    ? await prisma.student.findUnique({
        where: { userId: user.id },
        select: { isEnrolled: true },
      })
    : null

  const isEnrolled = Boolean(student?.isEnrolled)

  return (
    <div className="min-h-screen bg-background">
      <StudentNav schoolId={schoolId} schoolName={school.name} isEnrolled={isEnrolled} />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
