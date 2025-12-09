'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Mail, Lock, Loader2, Key, Eye, EyeOff, Briefcase, Edit2, Check, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProfileManagerProps {
  user: {
    name: string
    email: string
    role: string
    jobTitle?: string | null
  }
}

// Options de titres prédéfinis
const JOB_TITLE_OPTIONS = [
  { value: 'Directeur', label: 'Directeur' },
  { value: 'Directeur Adjoint', label: 'Directeur Adjoint' },
  { value: 'Chef de Département', label: 'Chef de Département' },
  { value: 'Secrétaire Général', label: 'Secrétaire Général' },
  { value: 'Responsable Pédagogique', label: 'Responsable Pédagogique' },
  { value: 'Comptable', label: 'Comptable' },
  { value: 'Surveillant Général', label: 'Surveillant Général' },
  { value: 'Conseiller Pédagogique', label: 'Conseiller Pédagogique' },
  { value: 'Autre', label: 'Autre (personnalisé)' },
]

export default function ProfileManager({ user }: ProfileManagerProps) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isEditingJobTitle, setIsEditingJobTitle] = useState(false)
  const [jobTitleForm, setJobTitleForm] = useState({
    jobTitle: user.jobTitle || '',
    customJobTitle: '',
  })
  const [isJobTitleCustom, setIsJobTitleCustom] = useState(
    user.jobTitle && !JOB_TITLE_OPTIONS.some(opt => opt.value === user.jobTitle)
  )

  // État formulaire email
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    code: '',
  })

  // État formulaire mot de passe
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    code: '',
  })

  const handleSendEmailCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/school-admin/profile/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du code')
      }

      // En développement, afficher le code
      if (data.code) {
        toast.success(`Code envoyé ! (Dev: ${data.code})`)
      } else {
        toast.success('Code de vérification envoyé par email') 
      }

      setStep('verify')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de l\'envoi du code')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPasswordCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/school-admin/profile/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du code')
      }

      // En développement, afficher le code
      if (data.code) {
        toast.success(`Code envoyé ! (Dev: ${data.code})`)
      } else {
        toast.success('Code de vérification envoyé par email')
      }

      setStep('verify')
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de l\'envoi du code')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!emailForm.newEmail || !emailForm.code) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/school-admin/profile/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: emailForm.code,
          newEmail: emailForm.newEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      toast.success('Email modifié avec succès. Veuillez vous reconnecter.')
      setIsEmailDialogOpen(false)
      setEmailForm({ newEmail: '', code: '' })
      setStep('request')

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword || !passwordForm.code) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/school-admin/profile/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: passwordForm.code,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      toast.success('Mot de passe modifié avec succès. Veuillez vous reconnecter.')
      setIsPasswordDialogOpen(false)
      setPasswordForm({ newPassword: '', confirmPassword: '', code: '' })
      setStep('request')

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateJobTitle = async () => {
    const finalJobTitle = isJobTitleCustom ? jobTitleForm.customJobTitle : jobTitleForm.jobTitle
    
    if (!finalJobTitle) {
      toast.error('Veuillez sélectionner ou entrer un titre')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/school-admin/profile/update-job-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: finalJobTitle }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      toast.success('Titre modifié avec succès')
      setIsEditingJobTitle(false)
      // Reload to update the user data
      window.location.reload()
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Erreur lors de la modification')
    } finally {
      setLoading(false)
    }
  }

  const closeEmailDialog = () => {
    setIsEmailDialogOpen(false)
    setEmailForm({ newEmail: '', code: '' })
    setStep('request')
  }

  const closePasswordDialog = () => {
    setIsPasswordDialogOpen(false)
    setPasswordForm({ newPassword: '', confirmPassword: '', code: '' })
    setStep('request')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="heading-responsive-h2">Mon Profil</h2>
        <p className="text-responsive-sm text-muted-foreground">
          Gérez vos informations personnelles et vos paramètres de sécurité
        </p>
      </div>

      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Informations de base</CardTitle>
          <CardDescription className="text-responsive-sm">
            Vos informations personnelles enregistrées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div>
            <Label className="text-responsive-sm text-muted-foreground">Nom complet</Label>
            <p className="text-responsive-base font-medium">{user.name}</p>
          </div>
          <div>
            <Label className="text-responsive-sm text-muted-foreground">Email</Label>
            <p className="text-responsive-base font-medium">{user.email}</p>
          </div>
          <div>
            <Label className="text-responsive-sm text-muted-foreground">Rôle</Label>
            <p className="text-responsive-base font-medium">
              {user.role === 'SCHOOL_ADMIN' ? 'Administrateur École' : user.role}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Titre / Poste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Titre / Poste
          </CardTitle>
          <CardDescription className="text-responsive-sm">
            Votre titre officiel au sein de l&apos;établissement (ex: Chef de Département, Directeur)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {!isEditingJobTitle ? (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-responsive-sm text-muted-foreground">Titre actuel</Label>
                <p className="text-responsive-base font-medium">
                  {user.jobTitle || 'Non défini'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingJobTitle(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-responsive-sm">Sélectionnez votre titre</Label>
                <Select
                  value={isJobTitleCustom ? 'Autre' : jobTitleForm.jobTitle}
                  onValueChange={(value) => {
                    if (value === 'Autre') {
                      setIsJobTitleCustom(true)
                      setJobTitleForm({ ...jobTitleForm, jobTitle: '' })
                    } else {
                      setIsJobTitleCustom(false)
                      setJobTitleForm({ ...jobTitleForm, jobTitle: value, customJobTitle: '' })
                    }
                  }}
                >
                  <SelectTrigger className="text-responsive-sm">
                    <SelectValue placeholder="Sélectionnez un titre" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isJobTitleCustom && (
                <div>
                  <Label className="text-responsive-sm">Titre personnalisé</Label>
                  <Input
                    placeholder="Entrez votre titre"
                    value={jobTitleForm.customJobTitle}
                    onChange={(e) => setJobTitleForm({ ...jobTitleForm, customJobTitle: e.target.value })}
                    className="text-responsive-sm"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingJobTitle(false)
                    setJobTitleForm({ jobTitle: user.jobTitle || '', customJobTitle: '' })
                    setIsJobTitleCustom(user.jobTitle && !JOB_TITLE_OPTIONS.some(opt => opt.value === user.jobTitle))
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdateJobTitle}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-responsive-lg">Sécurité</CardTitle>
          <CardDescription className="text-responsive-sm">
            Modifiez votre email ou votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-responsive-sm"
            onClick={() => setIsEmailDialogOpen(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Modifier mon email
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-responsive-sm"
            onClick={() => setIsPasswordDialogOpen(true)}
          >
            <Lock className="h-4 w-4 mr-2" />
            Modifier mon mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Dialog Modifier Email */}
      <Dialog open={isEmailDialogOpen} onOpenChange={closeEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier mon email</DialogTitle>
            <DialogDescription>
              {step === 'request'
                ? 'Un code de vérification sera envoyé à votre email actuel'
                : 'Entrez le code reçu et votre nouvel email'}
            </DialogDescription>
          </DialogHeader>

          {step === 'request' ? (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-responsive-sm text-muted-foreground">
                Email actuel: <strong>{user.email}</strong>
              </p>
              <Button onClick={handleSendEmailCode} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer le code
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="new-email" className="text-responsive-sm">Nouvel email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="nouveau@email.com"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  className="text-responsive-sm"
                />
              </div>
              <div>
                <Label htmlFor="email-code" className="text-responsive-sm">Code de vérification *</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-code"
                    type="text"
                    placeholder="123456"
                    className="pl-10 text-responsive-sm"
                    value={emailForm.code}
                    onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button variant="outline" onClick={closeEmailDialog} disabled={loading} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button onClick={handleUpdateEmail} disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    'Modifier'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier Mot de passe */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={closePasswordDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Modifier mon mot de passe</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              {step === 'request'
                ? 'Un code de vérification sera envoyé à votre email'
                : 'Entrez le code reçu et votre nouveau mot de passe'}
            </DialogDescription>
          </DialogHeader>

          {step === 'request' ? (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-responsive-sm text-muted-foreground">
                Un code sera envoyé à: <strong>{user.email}</strong>
              </p>
              <Button onClick={handleSendPasswordCode} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer le code
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="new-password" className="text-responsive-sm">Nouveau mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 text-responsive-sm"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-responsive-sm">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 text-responsive-sm"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="password-code" className="text-responsive-sm">Code de vérification *</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-code"
                    type="text"
                    placeholder="123456"
                    className="pl-10 text-responsive-sm"
                    value={passwordForm.code}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, code: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button variant="outline" onClick={closePasswordDialog} disabled={loading} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button onClick={handleUpdatePassword} disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    'Modifier'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
