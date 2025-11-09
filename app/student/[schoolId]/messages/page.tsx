import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import MessagingInterface from '@/components/messages/MessagingInterface'

export default async function StudentMessagesPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  
  if (!user || user.role !== 'STUDENT') {
    redirect('/auth/login')
  }

  if (user.schoolId !== schoolId) {
    redirect(`/student/${user.schoolId}`)
  }

  const student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    redirect('/auth/login')
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-responsive-xl font-bold text-foreground">Messagerie</h1>
        <p className="text-muted-foreground text-responsive-sm mt-1 sm:mt-2">
          Communiquez avec vos enseignants et l&apos;administration
        </p>
      </div>

      <MessagingInterface currentUserId={user.id} schoolId={schoolId} />
    </div>
  )
}
