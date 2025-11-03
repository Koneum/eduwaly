'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Building2, AlertCircle, Loader2, CheckCircle, Phone, MapPin, School } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
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
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Connexion automatique après inscription
      const signInResult = await signIn(formData.email, formData.password)

      if (signInResult?.error) {
        throw new Error('Inscription réussie mais erreur de connexion')
      }

      setSuccess(true)
      
      // Redirection vers le dashboard admin
      setTimeout(() => {
        window.location.href = `/admin/${data.schoolId}`
      }, 1500)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Une erreur est survenue lors de l\'inscription')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-primary/10 px-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Inscription réussie !</h2>
          <p className="text-muted-foreground mb-4">
            Votre compte a été créé avec succès. Redirection vers la page de connexion...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary to-secondary px-4 py-12">
      <div className="max-w-md w-full items-center flex flex-col">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-primary rounded-lg mb-4">
            <Image
              src="/Eduwaly-mascote.png"
              alt="Logo"
              width={50}
              height={50}
            />
            
            
          </div>
          <h1 className="text-3xl font-bold text-foreground">Créer un compte</h1>
          <p className="text-foreground mt-2">Inscrivez votre école sur EDUWALY</p>
        </div>

        {/* Formulaire */}
        <div className="bg-card rounded-2xl shadow-xl w-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nom de l'école */}
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-foreground mb-2">
                Nom de l&apos;école
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Université de..."
                  required
                />
              </div>
            </div>

            {/* Nom complet */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Jean Dupont"
                  required
                />
              </div>
            </div>

            {/* Type d'établissement */}
            <div>
              <label htmlFor="schoolType" className="block text-sm font-medium text-foreground mb-2">
                Type d&apos;établissement
              </label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70 pointer-events-none z-10" />
                <select
                  id="schoolType"
                  name="schoolType"
                  value={formData.schoolType}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 text-white py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition appearance-none bg-card"
                  required
                >
                  <option value="UNIVERSITY">Université</option>
                  <option value="HIGH_SCHOOL">Lycée</option>
                </select>
              </div>
            </div>

            {/* Email école */}
            <div>
              <label htmlFor="schoolEmail" className="block text-sm font-medium text-foreground mb-2">
                Email de l&apos;école
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="schoolEmail"
                  name="schoolEmail"
                  type="email"
                  value={formData.schoolEmail}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="contact@ecole.com"
                  required
                />
              </div>
            </div>

            {/* Téléphone école */}
            <div>
              <label htmlFor="schoolPhone" className="block text-sm font-medium text-foreground mb-2">
                Téléphone de l&apos;école
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="schoolPhone"
                  name="schoolPhone"
                  type="tel"
                  value={formData.schoolPhone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="+221 33 123 4567"
                />
              </div>
            </div>

            {/* Adresse école */}
            <div>
              <label htmlFor="schoolAddress" className="block text-sm font-medium text-foreground mb-2">
                Adresse de l&apos;école
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="schoolAddress"
                  name="schoolAddress"
                  type="text"
                  value={formData.schoolAddress}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Rue 10, Dakar, Sénégal"
                />
              </div>
            </div>

            {/* Email admin */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Votre email (Admin)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="admin@ecole.com"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 text-white border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="••••••••"
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

            </div>
            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-secondary hover:text-primary py-3 rounded-lg font-medium hover:bg-secondary focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire'
              )}
            </button>
          </form>

          {/* Lien de connexion */}
          <div className="mt-6 text-center">
            <p className="text-sm text-primary">
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="text-white hover:text-primary font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> L&apos;inscription crée automatiquement votre école avec un essai gratuit de 30 jours.
          </p>
        </div>
      </div>
    </div>
  )
}
