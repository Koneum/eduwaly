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
import { Mail, Lock, Loader2, Key, Eye, EyeOff } from 'lucide-react'

interface ProfileManagerProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export default function ProfileManager({ user }: ProfileManagerProps) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mon Profil</h2>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et vos paramètres de sécurité
        </p>
      </div>

      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Vos informations personnelles enregistrées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Nom complet</Label>
            <p className="text-lg font-medium">{user.name}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Rôle</Label>
            <p className="text-lg font-medium">
              {user.role === 'SCHOOL_ADMIN' ? 'Administrateur École' : user.role}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
          <CardDescription>
            Modifiez votre email ou votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setIsEmailDialogOpen(true)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Modifier mon email
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
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
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-email">Nouvel email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, newEmail: e.target.value })
                  }
                  placeholder="nouveau@exemple.com"
                />
              </div>
              <div>
                <Label htmlFor="email-code">Code de vérification *</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-code"
                    className="pl-10"
                    value={emailForm.code}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, code: e.target.value })
                    }
                    placeholder="123456"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeEmailDialog} disabled={loading}>
                  Annuler
                </Button>
                <Button onClick={handleUpdateEmail} disabled={loading}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier mon mot de passe</DialogTitle>
            <DialogDescription>
              {step === 'request'
                ? 'Un code de vérification sera envoyé à votre email'
                : 'Entrez le code reçu et votre nouveau mot de passe'}
            </DialogDescription>
          </DialogHeader>

          {step === 'request' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-10"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="••••••••"
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
                <Label htmlFor="confirm-password">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="pl-10 pr-10"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="••••••••"
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
                <Label htmlFor="password-code">Code de vérification *</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password-code"
                    className="pl-10"
                    value={passwordForm.code}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, code: e.target.value })
                    }
                    placeholder="123456"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closePasswordDialog} disabled={loading}>
                  Annuler
                </Button>
                <Button onClick={handleUpdatePassword} disabled={loading}>
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
