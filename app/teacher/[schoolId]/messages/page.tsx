import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-utils'
import MessagingInterface from '@/components/messages/MessagingInterface'

export default async function TeacherMessagesPage({ 
  params 
}: { 
  params: Promise<{ schoolId: string }> 
}) {
  const { schoolId } = await params
  const user = await getAuthUser()
  
  if (!user || user.role !== 'TEACHER') {
    redirect('/auth/login')
  }

  if (user.schoolId !== schoolId) {
    redirect(`/teacher/${user.schoolId}`)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messagerie</h1>
        <p className="text-muted-foreground mt-2">
          Communiquez avec les étudiants, parents et l&apos;administration
        </p>
      </div>

      <MessagingInterface currentUserId={user.id} schoolId={schoolId} />
    </div>
  )
}
