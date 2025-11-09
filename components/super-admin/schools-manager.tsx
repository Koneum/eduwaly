'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { School, Users, Calendar, Trash2, Plus } from "lucide-react"
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
}

interface SchoolData {
  id: string
  name: string
  subdomain: string
  email?: string | null
  phone?: string | null
  address?: string | null
  isActive: boolean
  schoolType: string
  subscription?: {
    id: string
    status: string
    plan: Plan
  } | null
  _count: {
    students: number
    users: number
    enseignants: number
  }
}

interface SchoolsManagerProps {
  initialSchools: SchoolData[]
  plans: Plan[]
}

export default function SchoolsManager({ initialSchools, plans }: SchoolsManagerProps) {
  const [schools] = useState<SchoolData[]>(initialSchools)
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    email: '',
    phone: '',
    address: '',
    schoolType: 'UNIVERSITY',
    planId: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  })

  const handleSelectSchool = (schoolId: string) => {
    const newSelected = new Set(selectedSchools)
    if (newSelected.has(schoolId)) {
      newSelected.delete(schoolId)
    } else {
      newSelected.add(schoolId)
    }
    setSelectedSchools(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedSchools.size === schools.length) {
      setSelectedSchools(new Set())
    } else {
      setSelectedSchools(new Set(schools.map(s => s.id)))
    }
  }

  // Générer le sous-domaine à partir du nom de l'école
  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-') // Remplacer tirets multiples par un seul
      .substring(0, 50) // Limiter la longueur
  }

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/super-admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      toast.success('École créée avec succès')
      setIsAddDialogOpen(false)
      
      // Reset form
      setFormData({
        name: '',
        subdomain: '',
        email: '',
        phone: '',
        address: '',
        schoolType: 'UNIVERSITY',
        planId: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      })

      // Refresh page
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSchools = async () => {
    if (selectedSchools.size === 0) {
      toast.error('Aucune école sélectionnée')
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSchools.size} école(s) ?`)) {
      return
    }

    setIsLoading(true)

    try {
      const ids = Array.from(selectedSchools).join(',')
      const response = await fetch(`/api/super-admin/schools?ids=${ids}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success(`${data.deleted} école(s) supprimée(s)`)
      setSelectedSchools(new Set())
      
      // Refresh page
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedSchools.size === schools.length && schools.length > 0}
            onCheckedChange={handleSelectAll}
          />
          {selectedSchools.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSchools}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ({selectedSchools.size})
            </Button>
          )}
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle École
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-responsive-lg">Ajouter une nouvelle école</DialogTitle>
              <DialogDescription className="text-responsive-sm">
                Créez une nouvelle école avec son administrateur et son abonnement
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSchool} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-responsive-sm">Nom de l&apos;école *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setFormData({ 
                        ...formData, 
                        name,
                        subdomain: generateSubdomain(name)
                      })
                    }}
                    className="text-responsive-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain" className="text-responsive-sm">Sous-domaine *</Label>
                  <Input
                    id="subdomain"
                    required
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    placeholder="mon-ecole"
                    className="text-responsive-sm"
                  />
                  <p className="text-responsive-xs text-muted-foreground">Généré automatiquement, modifiable</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-responsive-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="text-responsive-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-responsive-sm">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-responsive-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-responsive-sm">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-responsive-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolType" className="text-responsive-sm">Type d&apos;école</Label>
                  <Select
                    value={formData.schoolType}
                    onValueChange={(value) => setFormData({ ...formData, schoolType: value })}
                  >
                    <SelectTrigger className="text-responsive-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNIVERSITY" className="text-responsive-sm">Université</SelectItem>
                      <SelectItem value="HIGH_SCHOOL" className="text-responsive-sm">Lycée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planId" className="text-responsive-sm">Plan d&apos;abonnement</Label>
                  <Select
                    value={formData.planId}
                    onValueChange={(value) => setFormData({ ...formData, planId: value })}
                  >
                    <SelectTrigger className="text-responsive-sm">
                      <SelectValue placeholder="Sélectionner un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id} className="text-responsive-sm">
                          {plan.name} - ${plan.price}/{plan.interval}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-semibold mb-3 sm:mb-4 text-responsive-base">Administrateur de l&apos;école</h4>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName" className="text-responsive-sm">Nom complet</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="text-responsive-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail" className="text-responsive-sm">Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      required
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="text-responsive-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword" className="text-responsive-sm">Mot de passe *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      required
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="text-responsive-sm"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? 'Création...' : 'Créer l\'\u00e9cole'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-sm text-muted-foreground">Total Écoles</p>
                <p className="text-responsive-2xl font-bold">{schools.length}</p>
              </div>
              <School className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-sm text-muted-foreground">Écoles Actives</p>
                <p className="text-responsive-2xl font-bold">{schools.filter(s => s.isActive).length}</p>
              </div>
              <School className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-responsive-sm text-muted-foreground">Total Étudiants</p>
                <p className="text-responsive-2xl font-bold">
                  {schools.reduce((sum, s) => sum + s._count.students, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-[var(--link)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des écoles */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={selectedSchools.has(school.id)}
                    onCheckedChange={() => handleSelectSchool(school.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-responsive-base">{school.name}</CardTitle>
                    <p className="text-responsive-sm text-muted-foreground mt-1">{school.subdomain}</p>
                  </div>
                </div>
                <Badge variant={school.isActive ? 'default' : 'destructive'}>
                  {school.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Infos */}
              <div className="space-y-2 text-responsive-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{school._count.students} étudiants</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{school._count.enseignants} enseignants</span>
                </div>
                {school.subscription && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-responsive-sm">Plan: {school.subscription.plan.name}</span>
                  </div>
                )}
              </div>

              {/* Abonnement */}
              {school.subscription && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-responsive-sm text-muted-foreground">Statut</span>
                    <Badge variant={
                      school.subscription.status === 'ACTIVE' ? 'default' :
                      school.subscription.status === 'TRIAL' ? 'secondary' : 'destructive'
                    }>
                      {school.subscription.status}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
