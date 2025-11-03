'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Shield } from "lucide-react"
import { PermissionButton } from "@/components/permission-button"

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface UserPermission {
  id: string
  permission: Permission
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: Date
  permissions: UserPermission[]
}

interface StaffManagerProps {
  staffMembers: StaffMember[]
  permissions: Permission[]
  schoolId: string
}

interface PermissionState {
  [permissionId: string]: {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

export default function StaffManager({ staffMembers, permissions, schoolId }: StaffManagerProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PERSONNEL' as string,
  })

  const [selectedPermissions, setSelectedPermissions] = useState<PermissionState>({})

  // Grouper les permissions par catégorie et par action
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = {
        view: null,
        create: null,
        edit: null,
        delete: null,
      }
    }
    
    // Extraire l'action du nom (ex: "students.view" -> "view")
    const action = perm.name.split('.')[1] as 'view' | 'create' | 'edit' | 'delete'
    acc[perm.category][action] = perm
    
    return acc
  }, {} as Record<string, { view: Permission | null, create: Permission | null, edit: Permission | null, delete: Permission | null }>)

  const handleCreateStaff = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (createForm.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setIsSubmitting(true)

    try {
      // Préparer les permissions
      const permissionsData = Object.entries(selectedPermissions)
        .filter(([_, perms]) => perms.canView || perms.canCreate || perms.canEdit || perms.canDelete)
        .map(([permissionId, perms]) => ({
          permissionId,
          ...perms
        }))

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          permissions: permissionsData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      toast.success('Membre du personnel créé avec succès')
      setIsCreateOpen(false)
      setCreateForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'PERSONNEL',
      })
      setSelectedPermissions({})
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStaff = async () => {
    if (!selectedStaff) return

    setIsSubmitting(true)

    try {
      // Préparer les permissions
      const permissionsData = Object.entries(selectedPermissions)
        .filter(([_, perms]) => perms.canView || perms.canCreate || perms.canEdit || perms.canDelete)
        .map(([permissionId, perms]) => ({
          permissionId,
          ...perms
        }))

      const response = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          role: createForm.role,
          permissions: permissionsData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      toast.success('Membre du personnel modifié avec succès')
      setIsEditOpen(false)
      setSelectedStaff(null)
      setSelectedPermissions({})
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${staff.name} ?`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      toast.success('Membre du personnel supprimé avec succès')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setCreateForm({
      name: staff.name,
      email: staff.email,
      password: '',
      confirmPassword: '',
      role: staff.role,
    })

    // Charger les permissions existantes
    const perms: PermissionState = {}
    staff.permissions.forEach(up => {
      perms[up.permission.id] = {
        canView: up.canView,
        canCreate: up.canCreate,
        canEdit: up.canEdit,
        canDelete: up.canDelete,
      }
    })
    setSelectedPermissions(perms)
    setIsEditOpen(true)
  }

  const togglePermission = (permissionId: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: {
        canView: prev[permissionId]?.canView || false,
        canCreate: prev[permissionId]?.canCreate || false,
        canEdit: prev[permissionId]?.canEdit || false,
        canDelete: prev[permissionId]?.canDelete || false,
        [action]: !prev[permissionId]?.[action],
      }
    }))
  }

  const toggleAllPermissions = (category: string, perms: { view: Permission | null, create: Permission | null, edit: Permission | null, delete: Permission | null }) => {
    // Vérifier si toutes les permissions de cette catégorie sont cochées
    const allChecked = 
      (perms.view && selectedPermissions[perms.view.id]?.canView) &&
      (perms.create && selectedPermissions[perms.create.id]?.canCreate) &&
      (perms.edit && selectedPermissions[perms.edit.id]?.canEdit) &&
      (perms.delete && selectedPermissions[perms.delete.id]?.canDelete)
    
    setSelectedPermissions(prev => {
      const newState = { ...prev }
      
      if (perms.view) {
        newState[perms.view.id] = { ...newState[perms.view.id], canView: !allChecked, canCreate: false, canEdit: false, canDelete: false }
      }
      if (perms.create) {
        newState[perms.create.id] = { ...newState[perms.create.id], canView: false, canCreate: !allChecked, canEdit: false, canDelete: false }
      }
      if (perms.edit) {
        newState[perms.edit.id] = { ...newState[perms.edit.id], canView: false, canCreate: false, canEdit: !allChecked, canDelete: false }
      }
      if (perms.delete) {
        newState[perms.delete.id] = { ...newState[perms.delete.id], canView: false, canCreate: false, canEdit: false, canDelete: !allChecked }
      }
      
      return newState
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'PERSONNEL': return 'bg-blue-100 text-[var(--link)] dark:bg-blue-900 dark:text-blue-300'
      case 'ASSISTANT': return 'bg-green-100 text-success dark:bg-green-900 dark:text-green-300'
      case 'SECRETARY': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-muted text-muted-foreground dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'Manager'
      case 'PERSONNEL': return 'Personnel'
      case 'ASSISTANT': return 'Assistant'
      case 'SECRETARY': return 'Secrétaire'
      default: return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {staffMembers.length} membre{staffMembers.length > 1 ? 's' : ''} du personnel
          </p>
        </div>
        <PermissionButton 
          category="staff" 
          action="create"
          onClick={() => {
            setCreateForm({
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: 'PERSONNEL',
            })
            setSelectedPermissions({})
            setIsCreateOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un membre
        </PermissionButton>
      </div>

      {/* Liste des membres du staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffMembers.map((staff) => (
          <Card key={staff.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{staff.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{staff.email}</p>
                </div>
                <Badge className={getRoleBadgeColor(staff.role)}>
                  {getRoleLabel(staff.role)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {staff.permissions.length} permission{staff.permissions.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2">
                  <PermissionButton
                    category="staff"
                    action="edit"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(staff)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </PermissionButton>
                  <PermissionButton
                    category="staff"
                    action="delete"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteStaff(staff)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </PermissionButton>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {staffMembers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun membre du personnel</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter des membres du personnel avec des permissions spécifiques
            </p>
            <PermissionButton 
              category="staff" 
              action="create"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un membre
            </PermissionButton>
          </CardContent>
        </Card>
      )}

      {/* Dialog de création */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un membre du personnel</DialogTitle>
            <DialogDescription>
              Créez un nouveau membre du personnel et définissez ses permissions
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="jean@example.com"
                />
              </div>

              <div>
                <Label htmlFor="role">Rôle *</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="PERSONNEL">Personnel</SelectItem>
                    <SelectItem value="ASSISTANT">Assistant</SelectItem>
                    <SelectItem value="SECRETARY">Secrétaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  placeholder="Confirmer le mot de passe"
                />
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sélectionnez les permissions pour ce membre du personnel
              </p>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-sm font-medium">Permission</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Tout</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Voir</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Créer</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Modifier</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Supprimer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(permissionsByCategory).map(([category, perms]) => {
                          const allChecked = 
                            (perms.view && selectedPermissions[perms.view.id]?.canView) &&
                            (perms.create && selectedPermissions[perms.create.id]?.canCreate) &&
                            (perms.edit && selectedPermissions[perms.edit.id]?.canEdit) &&
                            (perms.delete && selectedPermissions[perms.delete.id]?.canDelete)
                          
                          return (
                            <tr key={category} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 px-2">
                                <p className="text-sm font-medium capitalize">{category}</p>
                              </td>
                              <td className="text-center py-3 px-2">
                                <Checkbox
                                  checked={allChecked || false}
                                  onCheckedChange={() => toggleAllPermissions(category, perms)}
                                />
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.view && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.view.id]?.canView || false}
                                    onCheckedChange={() => togglePermission(perms.view!.id, 'canView')}
                                  />
                                )}
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.create && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.create.id]?.canCreate || false}
                                    onCheckedChange={() => togglePermission(perms.create!.id, 'canCreate')}
                                  />
                                )}
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.edit && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.edit.id]?.canEdit || false}
                                    onCheckedChange={() => togglePermission(perms.edit!.id, 'canEdit')}
                                  />
                                )}
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.delete && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.delete.id]?.canDelete || false}
                                    onCheckedChange={() => togglePermission(perms.delete!.id, 'canDelete')}
                                  />
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleCreateStaff} disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer le membre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification (similaire au dialog de création) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le membre du personnel</DialogTitle>
            <DialogDescription>
              Modifiez les informations et permissions du membre
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nom complet *</Label>
                <Input
                  id="edit-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-role">Rôle *</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="PERSONNEL">Personnel</SelectItem>
                    <SelectItem value="ASSISTANT">Assistant</SelectItem>
                    <SelectItem value="SECRETARY">Secrétaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Modifiez les permissions pour ce membre du personnel
              </p>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-sm font-medium">Permission</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Tout</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Voir</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Créer</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Modifier</th>
                          <th className="text-center py-2 px-2 text-xs font-medium">Supprimer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(permissionsByCategory).map(([category, perms]) => {
                          const allChecked = 
                            (perms.view && selectedPermissions[perms.view.id]?.canView) &&
                            (perms.create && selectedPermissions[perms.create.id]?.canCreate) &&
                            (perms.edit && selectedPermissions[perms.edit.id]?.canEdit) &&
                            (perms.delete && selectedPermissions[perms.delete.id]?.canDelete)
                          
                          return (
                            <tr key={category} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3 px-2">
                                <p className="text-sm font-medium capitalize">{category}</p>
                              </td>
                              <td className="text-center py-3 px-2">
                                <Checkbox
                                  checked={allChecked || false}
                                  onCheckedChange={() => toggleAllPermissions(category, perms)}
                                />
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.view && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.view.id]?.canView || false}
                                    onCheckedChange={() => togglePermission(perms.view!.id, 'canView')}
                                  />
                                )}
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.create && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.create.id]?.canCreate || false}
                                    onCheckedChange={() => togglePermission(perms.create!.id, 'canCreate')}
                                  />
                                )}
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.edit && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.edit.id]?.canEdit || false}
                                    onCheckedChange={() => togglePermission(perms.edit!.id, 'canEdit')}
                                  />
                                )}
                              </td>
                              <td className="text-center py-3 px-2">
                                {perms.delete && (
                                  <Checkbox
                                    checked={selectedPermissions[perms.delete.id]?.canDelete || false}
                                    onCheckedChange={() => togglePermission(perms.delete!.id, 'canDelete')}
                                  />
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleEditStaff} disabled={isSubmitting}>
              {isSubmitting ? 'Modification...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
