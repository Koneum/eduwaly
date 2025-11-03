'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      await signOut()
      router.push('/login')
    }
    handleLogout()
  }, [signOut, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-primary/10">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Déconnexion en cours...</h2>
        <p className="text-muted-foreground mt-2">Vous allez être redirigé vers la page de connexion</p>
      </div>
    </div>
  )
}
