'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn(email, password)

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      // Attendre un peu pour que la session soit bien créée
      await new Promise(resolve => setTimeout(resolve, 500))

      // Récupérer l'URL de redirection depuis le serveur
      const redirectResponse = await fetch('/api/auth/redirect-url')
      const { redirectUrl } = await redirectResponse.json()
      
      // Rediriger vers le dashboard approprié
      window.location.href = redirectUrl
    } catch {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-blue-950 rounded-2xl mb-4">
            <Image
              src="/Eduwaly-mascote.png"
              alt="Logo"
              width={50}
              height={50}
            />
            
          </div>
          <h1 className="text-3xl font-bold text-blue-950">EDUWALY</h1>
          <p className="text-muted-foreground mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire */}
        <div className="bg-card rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border text-foreground dark:text-white border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-foreground dark:text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="MDP"
                  required
                />
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-foreground hover:text-primary py-3 rounded-lg font-medium hover:bg-secondary   focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Lien d'inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-foreground dark:text-primary hover:text-green-600 font-medium">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>

        {/* Comptes de test */}
        {/* <div className="mt-6 bg-card rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-foreground mb-3">Comptes de test :</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
              <span className="font-medium text-purple-900">Super Admin:</span>
              <code className="text-purple-700 text-xs">superadmin@saas.com</code>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span className="font-medium text-blue-900">Admin École:</span>
              <code className="text-[var(--link)] text-xs">admin@excellence-dakar.sn</code>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span className="font-medium text-green-900">Enseignant:</span>
              <code className="text-success text-xs">teacher@excellence-dakar.sn</code>
            </div>
            <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
              <span className="font-medium text-orange-900">Étudiant:</span>
              <code className="text-orange-700 text-xs">student1@excellence-dakar.sn</code>
            </div>
            <div className="flex justify-between items-center p-2 bg-pink-50 rounded">
              <span className="font-medium text-pink-900">Parent:</span>
              <code className="text-pink-700 text-xs">parent@excellence-dakar.sn</code>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Mot de passe pour tous : <code className="bg-muted px-2 py-1 rounded">password123</code>
            </p>
          </div>
        </div> */}
      </div>
    </div>
  )
}
