"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, UserPlus, Key, Mail, Phone, Lock, User } from "lucide-react"

export default function EnrollPage() {
  const router = useRouter()
  const [enrollmentId, setEnrollmentId] = useState("")
  const [step, setStep] = useState<"id" | "form">("id")
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [userType, setUserType] = useState<"student" | "parent">("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Enrôlement</h1>
          <p className="text-muted-foreground">
            Créez votre compte avec votre ID d&apos;enrôlement
          </p>
        </div>

        {step === "id" ? (
          /* Étape 1: Vérification de l'ID */
          <Card>
            <CardHeader>
              <CardTitle>Entrez votre ID d&apos;enrôlement</CardTitle>
              <CardDescription>
                L&apos;ID vous a été fourni par votre établissement lors de votre inscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enrollmentId">ID d&apos;enrôlement</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="enrollmentId"
                    placeholder="Entrez votre ID (ex: ENR-2024-A3B5C)"
                    value={enrollmentId}
                    onChange={(e) => {
                      setEnrollmentId(e.target.value.toUpperCase())
                      setError("")
                    }}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setUserType("student")}
                  disabled={userType === "student"}
                >
                  <User className="h-4 w-4 mr-2" />
                  Je suis Étudiant
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setUserType("parent")}
                  disabled={userType === "parent"}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Je suis Parent
                </Button>
              </div>

              <Badge className="w-full justify-center py-2">
                Type sélectionné: {userType === "student" ? "Étudiant" : "Parent"}
              </Badge>

              <Button
                className="w-full"
                onClick={handleVerifyId}
                disabled={!enrollmentId || loading}
              >
                {loading ? "Vérification..." : "Vérifier l'ID"}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Vous n&apos;avez pas d&apos;ID d&apos;enrôlement ? Contactez votre établissement
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Étape 2: Formulaire d'inscription */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Créez votre compte</CardTitle>
                  <CardDescription>
                    Complétez vos informations pour finaliser l&apos;enrôlement
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("id")}>
                  Retour
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Info étudiant */}
              {studentInfo && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-background mb-2">Informations de l&apos;inscription</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-background">Établissement:</span>
                      <p className="font-medium text-background">{studentInfo.schoolName}</p>
                    </div>
                    <div>
                      <span className="text-background">N° Étudiant:</span>
                      <p className="font-medium text-background">{studentInfo.studentNumber}</p>
                    </div>
                    <div>
                      <span className="text-background">Niveau:</span>
                      <p className="font-medium text-background">{studentInfo.niveau}</p>
                    </div>
                    <div>
                      <span className="text-background">Filière:</span>
                      <p className="font-medium text-background">{studentInfo.filiere}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom et Prénom */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input 
                      id="nom" 
                      placeholder="Votre nom" 
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input 
                      id="prenom" 
                      placeholder="Votre prénom" 
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                {/* Email (obligatoire pour université) */}
                {studentInfo?.schoolType === "UNIVERSITY" && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre.email@example.com"
                        className="pl-10"
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
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre.email@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Numéro (obligatoire pour lycée) */}
                {studentInfo?.schoolType === "HIGH_SCHOOL" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+237 6XX XXX XXX"
                        className="pl-10"
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
                    <Label htmlFor="phone">Numéro de téléphone (optionnel)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+237 6XX XXX XXX"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Créez un mot de passe sécurisé (min. 8 caractères)"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirmez votre mot de passe"
                      className="pl-10"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Création en cours..." : "Créer mon compte"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
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
