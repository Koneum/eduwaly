import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import MessagingInterface from '@/components/messages/MessagingInterface'

export default async function ParentMessagesPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  
  if (!user || user.role !== 'PARENT') {
    redirect('/auth/login')
  }

  if (user.schoolId !== schoolId) {
    redirect(`/parent/${user.schoolId}`)
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: user.id },
    include: {
      students: {
        include: {
          user: true,
          filiere: true
        }
      }
    }
  })

  if (!parent) {
    redirect('/auth/login')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messagerie</h1>
        <p className="text-muted-foreground mt-2">
          Communiquez avec les enseignants et l&apos;administration
        </p>
      </div>

      <MessagingInterface currentUserId={user.id} />
    </div>
  )
}
