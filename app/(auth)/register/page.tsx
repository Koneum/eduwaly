'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'

export default function RegisterPage() {
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    schoolEmail: '',
    schoolPhone: '',
    schoolAddress: '',
    schoolType: 'UNIVERSITY',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          schoolName: formData.schoolName,
          schoolEmail: formData.schoolEmail,
          schoolPhone: formData.schoolPhone,
          schoolAddress: formData.schoolAddress,
          schoolType: formData.schoolType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      const signInResult = await signIn(formData.email, formData.password)

      if (signInResult?.error) {
        throw new Error('Inscription réussie mais erreur de connexion')
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = `/admin/${data.schoolId}`
      }, 1500)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
        <div className="max-w-md w-full bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-800">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Inscription réussie !</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Redirection vers votre tableau de bord...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Partie gauche - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white dark:bg-gray-950 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/Eduwaly-mascote.png" alt="Eduwaly" width={40} height={40} className="object-cover" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">EDUWALY</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Créer un compte
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Inscrivez votre établissement et démarrez votre essai gratuit
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type d'établissement */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, schoolType: 'UNIVERSITY' })}
                className={`p-3 rounded-xl border-2 transition text-sm font-medium ${
                  formData.schoolType === 'UNIVERSITY'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                🏛️ Université
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, schoolType: 'HIGH_SCHOOL' })}
                className={`p-3 rounded-xl border-2 transition text-sm font-medium ${
                  formData.schoolType === 'HIGH_SCHOOL'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                🏫 Lycée
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nom établissement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nom de l&apos;établissement *
                </label>
                <input
                  name="schoolName"
                  type="text"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder={formData.schoolType === 'UNIVERSITY' ? 'Université de...' : 'Lycée...'}
                  required
                />
              </div>

              {/* Votre nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Votre nom complet *
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              {/* Email école */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email établissement *
                </label>
                <input
                  name="schoolEmail"
                  type="email"
                  value={formData.schoolEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder="contact@ecole.ml"
                  required
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Téléphone
                </label>
                <input
                  name="schoolPhone"
                  type="tel"
                  value={formData.schoolPhone}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder="+223 20 22 33 44"
                />
              </div>

              {/* Adresse */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Adresse
                </label>
                <input
                  name="schoolAddress"
                  type="text"
                  value={formData.schoolAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder="Rue 10, Bamako, Mali"
                />
              </div>

              {/* Séparateur */}
              <div className="sm:col-span-2 border-t border-gray-200 dark:border-gray-800 pt-4 mt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Vos identifiants Admin</p>
              </div>

              {/* Email admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Votre email *
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder="admin@ecole.ml"
                  required
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    placeholder="Min. 8 caractères"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmer mdp */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirmer le mot de passe *
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  placeholder="Répétez le mot de passe"
                  required
                />
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Inscription...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Lien connexion */}
          <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-gray-900 dark:text-white font-semibold hover:underline">
              Se connecter
            </Link>
          </p>

          {/* Note essai gratuit */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              ✨ <strong>14 jours d&apos;essai gratuit</strong> inclus, sans engagement
            </p>
          </div>
        </div>
      </div>

      {/* Partie droite - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <Image
          src="/loginpage-design.jpg"
          alt="Register illustration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-br from-cyan-400/20 via-transparent to-pink-400/20" />
      </div>
    </div>
  )
}
