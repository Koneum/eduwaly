"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, UserPlus, Key, Mail, Phone, Lock, User, Eye, EyeOff } from "lucide-react"

export default function EnrollPage() {
  const router = useRouter()
  const [enrollmentId, setEnrollmentId] = useState("")
  const [step, setStep] = useState<"id" | "form">("id")
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [userType, setUserType] = useState<"student" | "parent">("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })

  const passwordsMatch = !formData.confirmPassword || formData.password === formData.confirmPassword

  const handleVerifyId = async () => {
    if (!enrollmentId.trim()) {
      setError("Veuillez entrer votre ID d'enrôlement")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/enroll/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, userType })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la vérification')
        return
      }

      setStudentInfo(data.data)
      setStep("form")
    } catch (err) {
      console.error('Erreur vérification enrollment:', err)
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    // Validation email pour université
    if (studentInfo?.schoolType === "UNIVERSITY" && !formData.email) {
      setError("L'email est obligatoire pour les universités")
      return
    }

    // Validation téléphone pour lycée
    if (studentInfo?.schoolType === "HIGH_SCHOOL" && !formData.phone) {
      setError("Le numéro de téléphone est obligatoire pour les lycées")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/enroll/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          userType,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          studentId: studentInfo?.studentId,
          parentId: studentInfo?.parentId,
          schoolId: studentInfo?.schoolId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la création du compte')
        return
      }

      // Rediriger vers la page de connexion avec un message de succès
      router.push('/login?enrolled=true')
    } catch (err) {
      console.error('Erreur création compte:', err)
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-primary/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-responsive">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-primary/10 dark:bg-primary/20 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <GraduationCap className="icon-responsive-lg text-primary" />
          </div>
          <h1 className="heading-responsive-h1 text-foreground mb-2">Enrôlement</h1>
          <p className="text-responsive-sm text-muted-foreground px-4">
            Créez votre compte avec votre ID d&apos;enrôlement
          </p>
        </div>

        {step === "id" ? (
          /* Étape 1: Vérification de l'ID */
          <Card className="card-responsive shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-responsive-lg sm:text-responsive-xl">
                Entrez votre ID d&apos;enrôlement
              </CardTitle>
              <CardDescription className="text-responsive-xs sm:text-responsive-sm">
                L&apos;ID vous a été fourni par votre établissement lors de votre inscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="enrollmentId" className="text-responsive-sm">
                  ID d&apos;enrôlement
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
                  <Input
                    id="enrollmentId"
                    placeholder="Ex: ENR-2024-A3B5C"
                    value={enrollmentId}
                    onChange={(e) => {
                      setEnrollmentId(e.target.value.toUpperCase())
                      setError("")
                    }}
                    className="pl-10 text-responsive-sm h-10 sm:h-11"
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-responsive-xs text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant={userType === "student" ? "default" : "outline"}
                  className={`flex-1 text-responsive-sm h-10 sm:h-11 ${userType === "student" ? "text-background" : ""}`}
                  onClick={() => setUserType("student")}
                >
                  <User className="icon-responsive mr-2" />
                  Je suis Étudiant
                </Button>
                <Button
                  variant={userType === "parent" ? "default" : "outline"}
                  className={`flex-1 text-responsive-sm h-10 sm:h-11 ${userType === "parent" ? "text-background" : ""}`}
                  onClick={() => setUserType("parent")}
                >
                  <UserPlus className="icon-responsive mr-2" />
                  Je suis Parent
                </Button>
              </div>

              <Badge className="w-full justify-center py-2 text-responsive-xs sm:text-responsive-sm text-background">
                Type sélectionné: {userType === "student" ? "Étudiant" : "Parent"}
              </Badge>

              <Button
                className="w-full text-responsive-sm h-10 sm:h-11 text-background"
                onClick={handleVerifyId}
                disabled={!enrollmentId || loading}
              >
                {loading ? "Vérification..." : "Vérifier l'ID"}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground text-center">
                  Vous n&apos;avez pas d&apos;ID d&apos;enrôlement ? Contactez votre établissement
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Étape 2: Formulaire d'inscription */
          <Card className="card-responsive shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-responsive-lg sm:text-responsive-xl">
                    Créez votre compte
                  </CardTitle>
                  <CardDescription className="text-responsive-xs sm:text-responsive-sm">
                    Complétez vos informations pour finaliser l&apos;enrôlement
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep("id")}
                  className="text-responsive-xs sm:text-responsive-sm self-start sm:self-auto"
                >
                  ← Retour
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Info étudiant */}
              {studentInfo && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-responsive-sm sm:text-responsive-base font-semibold text-blue-900 dark:text-blue-100 mb-2 sm:mb-3">
                    Informations de l&apos;inscription
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-responsive-xs sm:text-responsive-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Établissement:</span>
                      <p className="font-medium text-blue-900 dark:text-blue-100">{studentInfo.schoolName}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Matricule:</span>
                      <p className="font-medium text-blue-900 dark:text-blue-100">{studentInfo.studentNumber}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Niveau:</span>
                      <p className="font-medium text-blue-900 dark:text-blue-100">{studentInfo.niveau}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Filière:</span>
                      <p className="font-medium text-blue-900 dark:text-blue-100">{studentInfo.filiere}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Nom et Prénom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-responsive-sm">Nom *</Label>
                    <Input 
                      id="nom" 
                      placeholder="Votre nom" 
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="text-responsive-sm h-10 sm:h-11"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-responsive-sm">Prénom *</Label>
                    <Input 
                      id="prenom" 
                      placeholder="Votre prénom" 
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      className="text-responsive-sm h-10 sm:h-11"
                      required 
                    />
                  </div>
                </div>

                {/* Email (obligatoire pour université) */}
                {studentInfo?.schoolType === "UNIVERSITY" && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-responsive-sm">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre.email@example.com"
                        className="pl-10 text-responsive-sm h-10 sm:h-11"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email (optionnel pour lycée) */}
                {studentInfo?.schoolType === "HIGH_SCHOOL" && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-responsive-sm">Email (optionnel)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre.email@example.com"
                        className="pl-10 text-responsive-sm h-10 sm:h-11"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Numéro (obligatoire pour lycée) */}
                {studentInfo?.schoolType === "HIGH_SCHOOL" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-responsive-sm">Numéro de téléphone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+237 6XX XXX XXX"
                        className="pl-10 text-responsive-sm h-10 sm:h-11"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Numéro (optionnel pour université) */}
                {studentInfo?.schoolType === "UNIVERSITY" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-responsive-sm">Numéro de téléphone (optionnel)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+237 6XX XXX XXX"
                        className="pl-10 text-responsive-sm h-10 sm:h-11"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-responsive-sm">Mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
                      className="pl-10 pr-10 text-responsive-sm h-10 sm:h-11"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="icon-responsive" /> : <Eye className="icon-responsive" />}
                    </button>
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-responsive-sm">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmez votre mot de passe"
                      className="pl-10 pr-10 text-responsive-sm h-10 sm:h-11"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                    >
                      {showConfirmPassword ? <EyeOff className="icon-responsive" /> : <Eye className="icon-responsive" />}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p className="text-responsive-xs text-red-600 dark:text-red-400">
                      Les mots de passe ne correspondent pas.
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-responsive-xs sm:text-responsive-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full text-responsive-sm h-10 sm:h-11" 
                  disabled={loading}
                >
                  {loading ? "Création en cours..." : "Créer mon compte"}
                </Button>

                <p className="text-responsive-xs text-muted-foreground text-center px-4">
                  En créant un compte, vous acceptez les conditions d&apos;utilisation
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
