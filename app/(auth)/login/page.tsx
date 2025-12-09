'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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

      await new Promise(resolve => setTimeout(resolve, 1000))

      const redirectResponse = await fetch('/api/auth/redirect-url', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!redirectResponse.ok) {
        window.location.href = '/'
        return
      }

      const data = await redirectResponse.json()
      window.location.href = data.redirectUrl
    } catch {
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Partie gauche - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <Image
                  src="/Eduwaly-mascote.png"
                  alt="Eduwaly"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">EDUWALY</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bon retour !
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Connectez-vous avec vos identifiants
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="8-16 caractères"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Se souvenir de moi</span>
              </label>
              <Link href="#" className="text-sm text-gray-900 dark:text-white font-medium hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Lien d'inscription */}
          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-gray-900 dark:text-white font-semibold hover:underline">
              S&apos;inscrire
            </Link>
          </p>

          {/* Comptes de test */}
          <div className="mt-8 p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">🧪 Comptes de test (Mali)</h3>
            
            <div className="space-y-3 text-xs">
              {/* Super Admin */}
              <div className="flex justify-between items-center p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                <span className="font-medium text-purple-900 dark:text-purple-300">👑 Super Admin</span>
                <code className="text-purple-700 dark:text-purple-400">superadmin@eduwaly.com</code>
              </div>
              
              {/* Université */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">🏛️ Université Sciences Bamako</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-blue-900 dark:text-blue-300">Admin</span>
                    <code className="text-blue-700 dark:text-blue-400">admin@usb.ml</code>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-green-900 dark:text-green-300">Professeur</span>
                    <code className="text-green-700 dark:text-green-400">prof@usb.ml</code>
                  </div>
                  <div className="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-orange-900 dark:text-orange-300">Étudiant</span>
                    <code className="text-orange-700 dark:text-orange-400">etudiant@usb.ml</code>
                  </div>
                  <div className="flex justify-between p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <span className="text-pink-900 dark:text-pink-300">Parent</span>
                    <code className="text-pink-700 dark:text-pink-400">parent@usb.ml</code>
                  </div>
                </div>
              </div>

              {/* Lycée */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">🏫 Lycée Prosper Kamara</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-blue-900 dark:text-blue-300">Admin</span>
                    <code className="text-blue-700 dark:text-blue-400">admin@lpk.ml</code>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-green-900 dark:text-green-300">Professeur</span>
                    <code className="text-green-700 dark:text-green-400">prof@lpk.ml</code>
                  </div>
                  <div className="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-orange-900 dark:text-orange-300">Élève</span>
                    <code className="text-orange-700 dark:text-orange-400">eleve@lpk.ml</code>
                  </div>
                  <div className="flex justify-between p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <span className="text-pink-900 dark:text-pink-300">Parent</span>
                    <code className="text-pink-700 dark:text-pink-400">parent@lpk.ml</code>
                  </div>
                </div>
              </div>

              <p className="text-center pt-2 text-gray-500 dark:text-gray-400">
                MDP Super Admin: <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">Saas@2025</code>
                <br />
                Autres: <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">[Role]@2025</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Partie droite - Image de fond */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <Image
          src="/loginpage-design.jpg"
          alt="Login illustration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-br from-cyan-400/20 via-transparent to-pink-400/20" />
      </div>
    </div>
  )
}
