import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-utils'

export default async function Home() {
  const user = await getAuthUser()

  // Si pas connecté, rediriger vers login
  if (!user) {
    redirect('/login')
  }

  // Rediriger vers le dashboard approprié selon le rôle
  const { role, schoolId } = user

  switch (role) {
    case 'SUPER_ADMIN':
      redirect('/super-admin')
      break
    case 'SCHOOL_ADMIN':
    case 'MANAGER':
    case 'PERSONNEL':
    case 'ASSISTANT':
    case 'SECRETARY':
      redirect(`/admin/${schoolId}`)
      break
    case 'TEACHER':
      redirect(`/teacher/${schoolId}`)
      break
    case 'STUDENT':
      redirect(`/student/${schoolId}`)
      break
    case 'PARENT':
      redirect(`/parent/${schoolId}`)
      break
    default:
      redirect('/unauthorized')
  }
}