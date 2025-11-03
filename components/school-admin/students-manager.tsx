'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Search, Plus, Upload, Mail } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { PermissionButton } from "@/components/permission-button"
import { PermissionMenuItem } from "@/components/permission-menu-item"

interface Student {
  id: string
  studentNumber: string
  enrollmentId: string
  user: {
    name: string
    email: string | null
  } | null
  niveau: string
  filiere: {
    id: string
    nom: string
  } | null
  phone: string | null
  isEnrolled: boolean
  payments: Array<{
    status: string
    amountDue: number
    amountPaid: number
    dueDate: Date
  }>
  scholarships: Array<{
    id: string
    type: string
    percentage: number | null
    amount: number | null
    name: string
    isActive: boolean
  }>
}

interface Filiere {
  id: string
  nom: string
}

interface FeeStructure {
  id: string
  name: string
  amount: number
  type: string
  niveau: string | null
  filiereId: string | null
  filiere: {
    nom: string
  } | null
}

interface StudentsManagerProps {
  students: Student[]
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
  filieres: Filiere[]
  feeStructures: FeeStructure[]
}

export default function StudentsManager({ students, schoolId, schoolType, filieres, feeStructures }: StudentsManagerProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [studentTypeFilter, setStudentTypeFilter] = useState("all") // all, new, old
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Dialogs state
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isScholarshipDialogOpen, setIsScholarshipDialogOpen] = useState(false)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  // Form state for new student
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    studentNumber: '',
    niveau: '',
    phone: '',
    filiereId: ''
  })
  
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    feeStructureId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    tranche: '',
    paymentMethod: 'CASH'
  })
  
  // Scholarship form state
  const [scholarshipData, setScholarshipData] = useState({
    type: '',
    percentage: '',
    reason: ''
  })
  
  // Reminder form state
  const [reminderData, setReminderData] = useState({
    message: '',
    sendToParent: false
  })

  // Edit form state
  const [editData, setEditData] = useState({
    phone: '',
    niveau: '',
    roomId: ''
  })

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Debug: afficher le nombre d'étudiants
  console.log('StudentsManager - Total students:', students.length)
  console.log('StudentsManager - First student:', students[0])

  const filteredStudents = students.filter((student) => {
    const name = student.user?.name || 'Non inscrit'
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.niveau.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filtre par type (nouveau/ancien)
    let matchesType = true
    if (studentTypeFilter === "new") {
      // Nouveaux = créés dans les 30 derniers jours
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      // Note: Il faudrait avoir createdAt dans l'interface Student
      matchesType = true // Pour l'instant on accepte tous
    } else if (studentTypeFilter === "old") {
      matchesType = true // Anciens = tous les autres
    }
    
    if (statusFilter === "all") return matchesSearch && matchesType
    
    // Calculer le statut de paiement
    const latestPayment = student.payments[0]
    if (!latestPayment) return statusFilter === "pending" && matchesSearch && matchesType
    
    const status = latestPayment.status
    return matchesSearch && matchesType && (
      (statusFilter === "paid" && status === "PAID") ||
      (statusFilter === "pending" && status === "PENDING") ||
      (statusFilter === "late" && status === "OVERDUE")
    )
  })

  const getPaymentStatus = (student: Student) => {
    const latestPayment = student.payments[0]
    if (!latestPayment) return { status: 'pending', label: 'En attente', variant: 'secondary' as const }
    
    switch (latestPayment.status) {
      case 'PAID':
        return { status: 'paid', label: 'À jour', variant: 'default' as const }
      case 'PENDING':
        return { status: 'pending', label: 'En attente', variant: 'secondary' as const }
      case 'OVERDUE':
        return { status: 'late', label: 'En retard', variant: 'destructive' as const }
      default:
        return { status: 'pending', label: 'En attente', variant: 'secondary' as const }
    }
  }

  const handleSendCredentials = async (student: Student) => {
    if (!student.user?.email) {
      toast.error('Cet étudiant n\'a pas d\'email')
      return
    }

    try {
      const response = await fetch('/api/admin/send-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      })

      if (response.ok) {
        toast.success('Identifiants envoyés par email avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi des identifiants')
    }
  }

  const handleAction = (student: Student, action: 'view' | 'payment' | 'scholarship' | 'reminder' | 'edit') => {
    // Utiliser setTimeout pour éviter les problèmes de state batching
    setTimeout(() => {
      setSelectedStudent(student)
      
      switch (action) {
        case 'view':
          setIsProfileDialogOpen(true)
          break
        case 'payment':
          setPaymentData({
            feeStructureId: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            tranche: '',
            paymentMethod: 'CASH'
          })
          setIsPaymentDialogOpen(true)
          break
        case 'scholarship':
          setScholarshipData({
            type: '',
            percentage: '',
            reason: ''
          })
          setIsScholarshipDialogOpen(true)
          break
        case 'reminder':
          setReminderData({
            message: '',
            sendToParent: false
          })
          setIsReminderDialogOpen(true)
          break
        case 'edit':
          setIsEditDialogOpen(true)
          break
      }
    }, 0)
  }
  
  const handleCloseDialog = (dialogType: 'profile' | 'payment' | 'scholarship' | 'reminder' | 'edit') => {
    switch (dialogType) {
      case 'profile':
        setIsProfileDialogOpen(false)
        break
      case 'payment':
        setIsPaymentDialogOpen(false)
        setPaymentData({
          feeStructureId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          tranche: '',
          paymentMethod: 'CASH'
        })
        break
      case 'scholarship':
        setIsScholarshipDialogOpen(false)
        break
      case 'reminder':
        setIsReminderDialogOpen(false)
        break
      case 'edit':
        setIsEditDialogOpen(false)
        break
    }
    // Nettoyer après un délai
    setTimeout(() => setSelectedStudent(null), 300)
  }

  const handleAddStudent = () => {
    setIsAddDialogOpen(true)
    // Réinitialiser le formulaire
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      address: '',
      studentNumber: '',
      niveau: '',
      phone: '',
      filiereId: ''
    })
  }

  const handleCreateStudent = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.studentNumber || !formData.niveau) {
      toast.error('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Matricule, Niveau)')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/school-admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          schoolId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      // Afficher les credentials générés
      if (data.credentials) {
        toast.success(
          `Étudiant créé avec succès!\n\nEmail: ${data.credentials.email}\nMot de passe: ${data.credentials.password}\n\nCode d'inscription pour les parents: ${data.credentials.enrollmentId}`,
          { duration: 10000 }
        )
      } else {
        toast.success(data.message || 'Étudiant créé avec succès')
      }
      
      setIsAddDialogOpen(false)
      
      // Recharger la page pour afficher le nouvel étudiant
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSubmitPayment = async () => {
    if (!selectedStudent || !paymentData.feeStructureId || !paymentData.amount || !paymentData.date) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    try {
      const response = await fetch('/api/school-admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          feeStructureId: paymentData.feeStructureId,
          amount: parseFloat(paymentData.amount),
          date: paymentData.date,
          paymentMethod: paymentData.paymentMethod,
          notes: paymentData.tranche
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      toast.success(data.message || 'Paiement enregistré avec succès')
      handleCloseDialog('payment')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement')
    }
  }

  const handleSubmitScholarship = async () => {
    if (!selectedStudent || !scholarshipData.type || !scholarshipData.percentage) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const response = await fetch('/api/school-admin/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          name: `Bourse ${scholarshipData.type}`,
          type: scholarshipData.type,
          percentage: parseFloat(scholarshipData.percentage),
          reason: scholarshipData.reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'application')
      }

      toast.success('Bourse appliquée avec succès')
      handleCloseDialog('scholarship')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'application')
    }
  }

  const handleSubmitReminder = async () => {
    if (!selectedStudent || !reminderData.message) {
      toast.error('Veuillez saisir un message')
      return
    }

    try {
      const response = await fetch('/api/school-admin/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          message: reminderData.message,
          sendToParent: reminderData.sendToParent
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      toast.success(data.message || 'Rappel envoyé avec succès')
      handleCloseDialog('reminder')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi')
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedStudent) {
      toast.error('Aucun étudiant sélectionné')
      return
    }

    try {
      const response = await fetch(`/api/school-admin/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editData.phone,
          niveau: editData.niveau,
          roomId: editData.roomId || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      toast.success('Étudiant modifié avec succès')
      handleCloseDialog('edit')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification')
    }
  }

  const handleImportFile = async () => {
    if (!importFile) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('schoolId', schoolId)

      const response = await fetch('/api/school-admin/students/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import')
      }

      toast.success(`${data.count || 0} étudiant(s) importé(s) avec succès`)
      setIsImportDialogOpen(false)
      setImportFile(null)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header avec filtres et boutons */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un étudiant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Statut paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="paid">À jour</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="late">En retard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={studentTypeFilter} onValueChange={setStudentTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les étudiants</SelectItem>
              <SelectItem value="new">Nouveaux (30j)</SelectItem>
              <SelectItem value="old">Anciens</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <PermissionButton category="students" action="create" onClick={handleAddStudent}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </PermissionButton>
          <PermissionButton category="students" action="create" onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importer Excel/CSV
          </PermissionButton>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Classe / Salle</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Montant à payer</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    Aucun étudiant trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const paymentStatus = getPaymentStatus(student)
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.studentNumber}</TableCell>
                      <TableCell>
                        {student.user?.name || (
                          <span className="text-muted-foreground italic">Non inscrit</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.niveau}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.filiere?.nom || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {/* Classe/Salle - À implémenter */}
                        <span className="text-xs text-muted-foreground">Non assigné</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.user?.email || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.phone || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const latestPayment = student.payments[0]
                            const scholarship = student.scholarships?.[0]
                            
                            // Si pas de paiement, calculer à partir des frais de scolarité et bourse
                            if (!latestPayment) {
                              // Trouver les frais correspondant au niveau/filière de l'étudiant
                              const applicableFees = feeStructures.filter(fee => 
                                (!fee.niveau || fee.niveau === student.niveau) &&
                                (!fee.filiereId || fee.filiereId === student.filiere?.id)
                              )
                              
                              if (applicableFees.length === 0) return '-'
                              
                              // Prendre le premier frais applicable
                              let amount = applicableFees[0].amount
                              const originalAmount = amount
                              
                              // Appliquer la bourse si elle existe
                              if (scholarship) {
                                if (scholarship.percentage) {
                                  amount = amount - (amount * (scholarship.percentage / 100))
                                } else if (scholarship.amount) {
                                  amount = Math.max(0, amount - scholarship.amount)
                                }
                              }
                              
                              return (
                                <div className="flex items-center gap-2">
                                  <span>{amount.toLocaleString()} FCFA</span>
                                  {scholarship && amount !== originalAmount && (
                                    <Badge variant="outline" className="bg-green-50 text-success border-green-200 text-xs">
                                      🎓 Bourse
                                    </Badge>
                                  )}
                                </div>
                              )
                            }
                            
                            // Calculer le restant à payer
                            const remaining = latestPayment.amountDue - latestPayment.amountPaid
                            
                            // Si tout est payé, afficher "-"
                            if (remaining <= 0) return '-'
                            
                            // Afficher le montant restant
                            return (
                              <div className="flex items-center gap-2">
                                <span>{remaining.toLocaleString()} FCFA</span>
                                {scholarship && (
                                  <Badge variant="outline" className="bg-green-50 text-success border-green-200 text-xs">
                                    🎓
                                  </Badge>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatus.variant}>
                          {paymentStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <PermissionMenuItem category="students" action="view" onClick={() => handleAction(student, 'view')}>
                              Voir profil
                            </PermissionMenuItem>
                            <PermissionMenuItem category="finance" action="create" onClick={() => handleAction(student, 'payment')}>
                              Enregistrer paiement
                            </PermissionMenuItem>
                            <PermissionMenuItem category="finance" action="create" onClick={() => handleAction(student, 'scholarship')}>
                              Appliquer bourse
                            </PermissionMenuItem>
                            <PermissionMenuItem category="students" action="edit" onClick={() => handleAction(student, 'reminder')}>
                              Envoyer rappel
                            </PermissionMenuItem>
                            <PermissionMenuItem category="students" action="view" onClick={() => handleSendCredentials(student)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Envoyer identifiants
                            </PermissionMenuItem>
                            <DropdownMenuSeparator />
                            <PermissionMenuItem category="students" action="edit" onClick={() => handleAction(student, 'edit')}>Modifier</PermissionMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Affichage de {filteredStudents.length} étudiant{filteredStudents.length > 1 ? 's' : ''} sur {students.length}
      </div>

      {/* Dialog Ajouter Étudiant */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel étudiant</DialogTitle>
            <DialogDescription>
              Créez un nouveau profil étudiant. Un code d&apos;inscription sera généré automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input 
                id="lastName" 
                placeholder="Ex: Doe" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input 
                id="firstName" 
                placeholder="Ex: John" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date de naissance</Label>
              <Input 
                id="dateOfBirth" 
                type="date" 
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input 
                id="address" 
                placeholder="Ex: Dakar, Sénégal" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentNumber">Matricule *</Label>
              <Input 
                id="studentNumber" 
                placeholder="Ex: 2024001" 
                value={formData.studentNumber}
                onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niveau">Niveau *</Label>
              <Select value={formData.niveau} onValueChange={(value) => setFormData({...formData, niveau: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {schoolType === 'HIGH_SCHOOL' ? (
                    <>
                      <SelectItem value="10E">10ème (Seconde)</SelectItem>
                      <SelectItem value="11E">11ème (Première)</SelectItem>
                      <SelectItem value="12E">12ème (Terminale)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="L1">Licence 1</SelectItem>
                      <SelectItem value="L2">Licence 2</SelectItem>
                      <SelectItem value="L3">Licence 3</SelectItem>
                      <SelectItem value="M1">Master 1</SelectItem>
                      <SelectItem value="M2">Master 2</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filiere">Filière</Label>
              <Select value={formData.filiereId} onValueChange={(value) => setFormData({...formData, filiereId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une filière" />
                </SelectTrigger>
                <SelectContent>
                  {filieres.map((filiere) => (
                    <SelectItem key={filiere.id} value={filiere.id}>
                      {filiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+221 77 123 4567" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateStudent}
              disabled={isCreating}
            >
              {isCreating ? 'Création...' : "Créer l'\u00e9tudiant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Profil Étudiant */}
      <Dialog open={isProfileDialogOpen} onOpenChange={() => handleCloseDialog('profile')}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profil de l&apos;étudiant</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Matricule</Label>
                  <p className="font-medium">{selectedStudent.studentNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID Système</Label>
                  <p className="font-mono text-sm">{selectedStudent.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nom complet</Label>
                  <p className="font-medium">{selectedStudent.user?.name || 'Non inscrit'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Niveau</Label>
                  <p className="font-medium">{selectedStudent.niveau}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Filière</Label>
                  <p className="font-medium">{selectedStudent.filiere?.nom || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedStudent.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Badge variant={selectedStudent.isEnrolled ? 'default' : 'secondary'}>
                    {selectedStudent.isEnrolled ? 'Inscrit' : 'Non inscrit'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Code d&apos;inscription</Label>
                  <p className="font-mono text-sm">{selectedStudent.enrollmentId}</p>
                </div>
              </div>
              
              {!selectedStudent.isEnrolled && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Envoyer le code d&apos;inscription</h4>
                  <p className="text-sm text-muted-foreground">
                    L&apos;étudiant n&apos;a pas encore créé son compte. Envoyez-lui le code d&apos;inscription et le lien pour s&apos;enregistrer.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast.success('Code envoyé par email à l\'étudiant')
                      }}
                    >
                      Envoyer par Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast.success('Code envoyé par SMS à l\'étudiant')
                      }}
                    >
                      Envoyer par SMS
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast.success('Code envoyé au parent')
                      }}
                    >
                      Envoyer au Parent
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Paiement */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={() => handleCloseDialog('payment')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Étudiant: {selectedStudent?.user?.name || selectedStudent?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Afficher la bourse active si elle existe */}
            {selectedStudent?.scholarships && selectedStudent.scholarships.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-success">
                  🎓 Bourse active: {selectedStudent.scholarships[0].name}
                </p>
                <p className="text-xs text-success mt-1">
                  {selectedStudent.scholarships[0].percentage 
                    ? `Réduction de ${selectedStudent.scholarships[0].percentage}%`
                    : `Réduction de ${selectedStudent.scholarships[0].amount?.toLocaleString()} FCFA`
                  }
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="feeStructure">Type de frais *</Label>
              {(() => {
                // Filtrer les frais applicables
                const applicableFees = feeStructures.filter(fee => {
                  if (!selectedStudent) return false
                  if (fee.niveau && fee.niveau !== selectedStudent.niveau) return false
                  if (fee.filiereId && fee.filiereId !== selectedStudent.filiere?.id) return false
                  return true
                })
                
                if (applicableFees.length === 0) {
                  return (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-800">
                        ⚠️ Aucun frais configuré pour le niveau {selectedStudent?.niveau}
                      </p>
                      <p className="text-xs text-[var(--chart-5)] mt-1">
                        Veuillez configurer les frais de scolarité dans les paramètres.
                      </p>
                    </div>
                  )
                }
                
                return (
                  <Select 
                    value={paymentData.feeStructureId} 
                    onValueChange={(value) => {
                      const selectedFee = feeStructures.find(f => f.id === value)
                      if (selectedFee && selectedStudent) {
                        // Calculer le montant après réduction de bourse
                        let finalAmount = selectedFee.amount
                        const scholarship = selectedStudent.scholarships?.[0]
                        
                        if (scholarship) {
                          if (scholarship.percentage) {
                            const discount = finalAmount * (scholarship.percentage / 100)
                            finalAmount = finalAmount - discount
                          } else if (scholarship.amount) {
                            finalAmount = Math.max(0, finalAmount - scholarship.amount)
                          }
                        }
                        
                        setPaymentData({
                          ...paymentData, 
                          feeStructureId: value,
                          amount: finalAmount.toString()
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type de frais" />
                    </SelectTrigger>
                <SelectContent>
                  {feeStructures
                    .filter(fee => {
                      // Filtrer uniquement les frais correspondant au niveau de l'étudiant
                      if (!selectedStudent) return false
                      
                      // Si le frais a un niveau spécifique, il doit correspondre au niveau de l'étudiant
                      if (fee.niveau && fee.niveau !== selectedStudent.niveau) return false
                      
                      // Si le frais a une filière spécifique, elle doit correspondre à celle de l'étudiant
                      if (fee.filiereId && fee.filiereId !== selectedStudent.filiere?.id) return false
                      
                      return true
                    })
                    .map(fee => {
                      // Calculer le montant après bourse pour l'affichage
                      let displayAmount = fee.amount
                      const originalAmount = fee.amount
                      const scholarship = selectedStudent?.scholarships?.[0]
                      
                      if (scholarship) {
                        if (scholarship.percentage) {
                          displayAmount = fee.amount - (fee.amount * (scholarship.percentage / 100))
                        } else if (scholarship.amount) {
                          displayAmount = Math.max(0, fee.amount - scholarship.amount)
                        }
                      }
                      
                      return (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name} - {displayAmount.toLocaleString()} FCFA
                          {scholarship && displayAmount !== originalAmount && (
                            <span className="text-xs text-muted-foreground line-through ml-2">
                              {originalAmount.toLocaleString()}
                            </span>
                          )}
                          {fee.niveau && ` (${fee.niveau})`}
                          {fee.filiere && ` - ${fee.filiere.nom}`}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
                  </Select>
                )
              })()}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FCFA) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 50000"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Date de paiement *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.date}
                onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tranche">Tranche</Label>
              <Input
                id="tranche"
                placeholder="Ex: 1ère tranche, 2ème trimestre..."
                value={paymentData.tranche}
                onChange={(e) => setPaymentData({...paymentData, tranche: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Méthode de paiement</Label>
              <Select value={paymentData.paymentMethod} onValueChange={(value) => setPaymentData({...paymentData, paymentMethod: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Espèces</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                  <SelectItem value="CARD">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog('payment')}>
              Annuler
            </Button>
            <Button onClick={handleSubmitPayment}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Bourse */}
      <Dialog open={isScholarshipDialogOpen} onOpenChange={() => handleCloseDialog('scholarship')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appliquer une bourse</DialogTitle>
            <DialogDescription>
              Étudiant: {selectedStudent?.user?.name || selectedStudent?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scholarshipType">Type de bourse *</Label>
              <Select value={scholarshipData.type} onValueChange={(value) => setScholarshipData({...scholarshipData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MERIT">Bourse au mérite</SelectItem>
                  <SelectItem value="NEED_BASED">Bourse sociale</SelectItem>
                  <SelectItem value="DISCOUNT">Réduction</SelectItem>
                  <SelectItem value="FULL">Bourse complète</SelectItem>
                  <SelectItem value="PARTIAL">Bourse partielle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Pourcentage de réduction *</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 50"
                value={scholarshipData.percentage}
                onChange={(e) => setScholarshipData({...scholarshipData, percentage: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motif</Label>
              <Input
                id="reason"
                placeholder="Raison de l'attribution"
                value={scholarshipData.reason}
                onChange={(e) => setScholarshipData({...scholarshipData, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog('scholarship')}>
              Annuler
            </Button>
            <Button onClick={handleSubmitScholarship}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rappel */}
      <Dialog open={isReminderDialogOpen} onOpenChange={() => handleCloseDialog('reminder')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un rappel</DialogTitle>
            <DialogDescription>
              Étudiant: {selectedStudent?.user?.name || selectedStudent?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                placeholder="Votre message de rappel..."
                value={reminderData.message}
                onChange={(e) => setReminderData({...reminderData, message: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendToParent"
                checked={reminderData.sendToParent}
                onChange={(e) => setReminderData({...reminderData, sendToParent: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="sendToParent" className="cursor-pointer">
                Envoyer également au parent
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog('reminder')}>
              Annuler
            </Button>
            <Button onClick={handleSubmitReminder}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseDialog('edit')
        else if (selectedStudent) {
          setEditData({
            phone: selectedStudent.phone || '',
            niveau: selectedStudent.niveau,
            roomId: ''
          })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;étudiant</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editPhone">Téléphone</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  placeholder="+221 77 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNiveau">Niveau</Label>
                <Select value={editData.niveau} onValueChange={(value) => setEditData({...editData, niveau: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolType === 'HIGH_SCHOOL' ? (
                      <>
                        <SelectItem value="10E">10ème (Seconde)</SelectItem>
                        <SelectItem value="11E">11ème (Première)</SelectItem>
                        <SelectItem value="12E">12ème (Terminale)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="L1">Licence 1</SelectItem>
                        <SelectItem value="L2">Licence 2</SelectItem>
                        <SelectItem value="L3">Licence 3</SelectItem>
                        <SelectItem value="M1">Master 1</SelectItem>
                        <SelectItem value="M2">Master 2</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRoom">{schoolType === 'HIGH_SCHOOL' ? 'Classe' : 'Salle'}</Label>
                <Select value={editData.roomId} onValueChange={(value) => setEditData({...editData, roomId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {/* TODO: Charger les salles/classes depuis l'API */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog('edit')}>
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Import Excel/CSV */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer des étudiants</DialogTitle>
            <DialogDescription>
              Importez une liste d&apos;étudiants depuis un fichier Excel (.xlsx) ou CSV (.csv)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium">
                  {importFile ? importFile.name : 'Cliquez pour sélectionner un fichier'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formats acceptés: .xlsx, .xls, .csv
                </p>
              </label>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">📝 Format attendu :</p>
              <p className="text-xs text-muted-foreground">
                Matricule, Nom, Prénom, Date de naissance, Niveau, Filière, Téléphone
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsImportDialogOpen(false)
              setImportFile(null)
            }}>
              Annuler
            </Button>
            <Button onClick={handleImportFile} disabled={!importFile || isImporting}>
              {isImporting ? 'Import en cours...' : 'Importer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
