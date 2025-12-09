import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-utils'
import MessagingInterface from '@/components/messages/MessagingInterface'
import { MessageSquare } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminMessagesPage() {
  const user = await getAuthUser()
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/auth/login')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Messagerie</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">Communiquez avec les administrateurs d&apos;école</p>
            </div>
          </div>
        </div>
      </div>

      <MessagingInterface currentUserId={user.id} schoolId="super-admin" />
    </div>
  )
}
