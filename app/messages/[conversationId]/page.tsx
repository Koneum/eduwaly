import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-utils'

export default async function MessageRedirectPage({
  params
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const user = await getAuthUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Rediriger vers la page de messagerie appropriée selon le rôle
  switch (user.role) {
    case 'SUPER_ADMIN':
      redirect(`/super-admin/messages?conversation=${conversationId}`)
    case 'SCHOOL_ADMIN':
      redirect(`/admin/${user.schoolId}/messages?conversation=${conversationId}`)
    case 'TEACHER':
      redirect(`/teacher/${user.schoolId}/messages?conversation=${conversationId}`)
    case 'STUDENT':
      redirect(`/student/${user.schoolId}/messages?conversation=${conversationId}`)
    case 'PARENT':
      redirect(`/parent/${user.schoolId}/messages?conversation=${conversationId}`)
    default:
      redirect('/')
  }
}
