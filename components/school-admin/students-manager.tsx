'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Search, Plus, Upload, Mail } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { PermissionButton } from "@/components/permission-button"
import { PermissionMenuItem } from "@/components/permission-menu-item"
// checkQuota ne doit pas être appelé côté client (utilise Prisma)

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

interface Room {
  id: string
  name: string
  code: string
  niveau: string | null
}

interface StudentsManagerProps {
  students: Student[]
  schoolId: string
  schoolType: 'UNIVERSITY' | 'HIGH_SCHOOL'
  filieres: Filiere[]
  feeStructures: FeeStructure[]
  rooms?: Room[]
}

export default function StudentsManager({ students, schoolId, schoolType, filieres, feeStructures, rooms = [] }: StudentsManagerProps) {
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
  const [isSendEnrollmentDialogOpen, setIsSendEnrollmentDialogOpen] = useState(false)
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

  // Send enrollment form state
  const [enrollmentEmailData, setEnrollmentEmailData] = useState({
    recipientEmail: ''
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

  const getPaymentAmount = (student: Student) => {
    const latestPayment = student.payments[0]
    const scholarship = student.scholarships?.[0]
    
    if (!latestPayment) {
      const applicableFees = feeStructures.filter(fee => 
        (!fee.niveau || fee.niveau === student.niveau) &&
        (!fee.filiereId || fee.filiereId === student.filiere?.id)
      )
      
      if (applicableFees.length === 0) return { amount: '-', hasBourse: false }
      
      let amount = applicableFees[0].amount
      const originalAmount = amount
      
      if (scholarship) {
        if (scholarship.percentage) {
          amount = amount - (amount * (scholarship.percentage / 100))
        } else if (scholarship.amount) {
          amount = Math.max(0, amount - scholarship.amount)
        }
      }
      
      return {
        amount: `${amount.toLocaleString()} FCFA`,
        hasBourse: scholarship && amount !== originalAmount
      }
    }
    
    const remaining = latestPayment.amountDue - latestPayment.amountPaid
    if (remaining <= 0) return { amount: '-', hasBourse: false }
    
    return {
      amount: `${remaining.toLocaleString()} FCFA`,
      hasBourse: !!scholarship
    }
  }

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

  const handleSendEnrollmentId = (student: Student) => {
    setSelectedStudent(student)
    setEnrollmentEmailData({ recipientEmail: '' })
    setIsSendEnrollmentDialogOpen(true)
  }

  const handleConfirmSendEnrollment = async () => {
    if (!selectedStudent) return

    if (!enrollmentEmailData.recipientEmail) {
      toast.error('Veuillez entrer l\'email du destinataire')
      return
    }

    try {
      const response = await fetch(`/api/school-admin/students/${selectedStudent.id}/send-enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: enrollmentEmailData.recipientEmail })
      })

      if (response.ok) {
        toast.success('ID d\'enrôlement envoyé par email avec succès')
        setIsSendEnrollmentDialogOpen(false)
        setEnrollmentEmailData({ recipientEmail: '' })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'envoi de l\'email')
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

  const handleAddStudent = async () => {
    // Le check de quota se fera côté serveur lors de la soumission
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
      <ResponsiveTable
        data={filteredStudents}
        columns={[
          {
            header: "Matricule",
            accessor: "studentNumber",
            priority: "high",
            className: "font-medium"
          },
          {
            header: "Nom",
            accessor: (student) => student.user?.name || <span className="text-muted-foreground italic">Non inscrit</span>,
            priority: "high"
          },
          {
            header: "Niveau",
            accessor: "niveau",
            priority: "medium"
          },
          {
            header: "Filière",
            accessor: (student) => student.filiere?.nom || '-',
            priority: "medium"
          },
          {
            header: "Email",
            accessor: (student) => student.user?.email || '-',
            priority: "low"
          },
          {
            header: "Téléphone",
            accessor: (student) => student.phone || '-',
            priority: "low"
          },
          {
            header: "Montant à payer",
            accessor: (student) => {
              const payment = getPaymentAmount(student)
              return (
                <div className="flex items-center gap-2">
                  <span>{payment.amount}</span>
                  {payment.hasBourse && (
                    <Badge variant="outline" className="bg-green-50 text-success border-green-200 text-xs">
                      🎓
                    </Badge>
                  )}
                </div>
              )
            },
            priority: "medium"
          },
          {
            header: "Statut",
            accessor: (student) => {
              const status = getPaymentStatus(student)
              return <Badge variant={status.variant}>{status.label}</Badge>
            },
            priority: "high"
          }
        ]}
        keyExtractor={(student) => student.id}
        actions={(student) => (
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
              <PermissionMenuItem category="students" action="view" onClick={() => handleSendEnrollmentId(student)}>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer identifiants
              </PermissionMenuItem>
              <DropdownMenuSeparator />
              <PermissionMenuItem category="students" action="edit" onClick={() => handleAction(student, 'edit')}>Modifier</PermissionMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        emptyMessage="Aucun étudiant trouvé"
      />

      <div className="text-sm text-muted-foreground">
        Affichage de {filteredStudents.length} étudiant{filteredStudents.length > 1 ? 's' : ''} sur {students.length}
      </div>

      {/* Dialog Ajouter Étudiant */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Ajouter un nouvel étudiant</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Créez un nouveau profil étudiant. Un code d&apos;inscription sera généré automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="lastName" className="text-responsive-sm">Nom</Label>
              <Input 
                id="lastName" 
                placeholder="Ex: Doe" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="firstName" className="text-responsive-sm">Prénom</Label>
              <Input 
                id="firstName" 
                placeholder="Ex: John" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="dateOfBirth" className="text-responsive-sm">Date de naissance</Label>
              <Input 
                id="dateOfBirth" 
                type="date" 
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="address" className="text-responsive-sm">Adresse</Label>
              <Input 
                id="address" 
                placeholder="Ex: Dakar, Sénégal" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="studentNumber" className="text-responsive-sm">Matricule *</Label>
              <Input 
                id="studentNumber" 
                placeholder="Ex: 2024001" 
                value={formData.studentNumber}
                onChange={(e) => setFormData({...formData, studentNumber: e.target.value})}
                required
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="niveau" className="text-responsive-sm">Niveau *</Label>
              <Select value={formData.niveau} onValueChange={(value) => setFormData({...formData, niveau: value})}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {schoolType === 'HIGH_SCHOOL' ? (
                    <>
                      <SelectItem value="10E" className="text-responsive-sm">10ème (Seconde)</SelectItem>
                      <SelectItem value="11E" className="text-responsive-sm">11ème (Première)</SelectItem>
                      <SelectItem value="12E" className="text-responsive-sm">12ème (Terminale)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="L1" className="text-responsive-sm">Licence 1</SelectItem>
                      <SelectItem value="L2" className="text-responsive-sm">Licence 2</SelectItem>
                      <SelectItem value="L3" className="text-responsive-sm">Licence 3</SelectItem>
                      <SelectItem value="M1" className="text-responsive-sm">Master 1</SelectItem>
                      <SelectItem value="M2" className="text-responsive-sm">Master 2</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="filiere" className="text-responsive-sm">Filière</Label>
              <Select value={formData.filiereId} onValueChange={(value) => setFormData({...formData, filiereId: value})}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue placeholder="Sélectionner une filière" />
                </SelectTrigger>
                <SelectContent>
                  {filieres.map((filiere) => (
                    <SelectItem key={filiere.id} value={filiere.id} className="text-responsive-sm">
                      {filiere.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phone" className="text-responsive-sm">Téléphone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+221 77 123 4567" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isCreating}
              className="btn-responsive w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateStudent}
              disabled={isCreating}
              className="btn-responsive w-full sm:w-auto"
            >
              {isCreating ? 'Création...' : "Créer l'\u00e9tudiant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Profil Étudiant */}
      <Dialog open={isProfileDialogOpen} onOpenChange={() => handleCloseDialog('profile')}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Profil de l&apos;étudiant</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">Matricule</Label>
                  <p className="text-responsive-sm font-medium">{selectedStudent.studentNumber}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">ID Système</Label>
                  <p className="font-mono text-responsive-xs">{selectedStudent.id}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">Nom complet</Label>
                  <p className="text-responsive-sm font-medium">{selectedStudent.user?.name || 'Non inscrit'}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">Niveau</Label>
                  <p className="text-responsive-sm font-medium">{selectedStudent.niveau}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">Filière</Label>
                  <p className="text-responsive-sm font-medium">{selectedStudent.filiere?.nom || '-'}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">Téléphone</Label>
                  <p className="text-responsive-sm font-medium">{selectedStudent.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">Statut</Label>
                  <Badge variant={selectedStudent.isEnrolled ? 'default' : 'secondary'} className="text-responsive-xs">
                    {selectedStudent.isEnrolled ? 'Inscrit' : 'Non inscrit'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-responsive-sm text-muted-foreground">Code d&apos;inscription</Label>
                  <p className="font-mono text-responsive-xs">{selectedStudent.enrollmentId}</p>
                </div>
              </div>
              
              {!selectedStudent.isEnrolled && (
                <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                  <h4 className="font-semibold text-responsive-sm">Envoyer le code d&apos;inscription</h4>
                  <p className="text-responsive-sm text-muted-foreground">
                    L&apos;étudiant n&apos;a pas encore créé son compte. Envoyez-lui le code d&apos;inscription et le lien pour s&apos;enregistrer.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSendEnrollmentId(selectedStudent)}
                      className="w-full sm:w-auto text-responsive-sm"
                    >
                      <Mail className="icon-responsive mr-2" />
                      Envoyer par Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast.success('Code envoyé par SMS à l\'étudiant')
                      }}
                      className="w-full sm:w-auto text-responsive-sm"
                    >
                      Envoyer par SMS
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast.success('Code envoyé au parent')
                      }}
                      className="w-full sm:w-auto text-responsive-sm"
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
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Enregistrer un paiement</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Étudiant: {selectedStudent?.user?.name || selectedStudent?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            {/* Afficher la bourse active si elle existe */}
            {selectedStudent?.scholarships && selectedStudent.scholarships.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                <p className="text-responsive-sm font-medium text-success">
                  🎓 Bourse active: {selectedStudent.scholarships[0].name}
                </p>
                <p className="text-responsive-xs text-success mt-1">
                  {selectedStudent.scholarships[0].percentage 
                    ? `Réduction de ${selectedStudent.scholarships[0].percentage}%`
                    : `Réduction de ${selectedStudent.scholarships[0].amount?.toLocaleString()} FCFA`
                  }
                </p>
              </div>
            )}
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="feeStructure" className="text-responsive-sm">Type de frais *</Label>
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
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3">
                      <p className="text-responsive-sm text-orange-800">
                        ⚠️ Aucun frais configuré pour le niveau {selectedStudent?.niveau}
                      </p>
                      <p className="text-responsive-xs text-[var(--chart-5)] mt-1">
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
                    <SelectTrigger className="text-responsive-sm">
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
                        <SelectItem key={fee.id} value={fee.id} className="text-responsive-sm">
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
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="amount" className="text-responsive-sm">Montant (FCFA) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 50000"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="paymentDate" className="text-responsive-sm">Date de paiement *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.date}
                onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="tranche" className="text-responsive-sm">Tranche</Label>
              <Input
                id="tranche"
                placeholder="Ex: 1ère tranche, 2ème trimestre..."
                value={paymentData.tranche}
                onChange={(e) => setPaymentData({...paymentData, tranche: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="paymentMethod" className="text-responsive-sm">Méthode de paiement</Label>
              <Select value={paymentData.paymentMethod} onValueChange={(value) => setPaymentData({...paymentData, paymentMethod: value})}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH" className="text-responsive-sm">Éspèces</SelectItem>
                  <SelectItem value="MOBILE_MONEY" className="text-responsive-sm">Mobile Money</SelectItem>
                  <SelectItem value="BANK_TRANSFER" className="text-responsive-sm">Virement bancaire</SelectItem>
                  <SelectItem value="CARD" className="text-responsive-sm">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => handleCloseDialog('payment')} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleSubmitPayment} className="w-full sm:w-auto">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Bourse */}
      <Dialog open={isScholarshipDialogOpen} onOpenChange={() => handleCloseDialog('scholarship')}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Appliquer une bourse</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Étudiant: {selectedStudent?.user?.name || selectedStudent?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="scholarshipType" className="text-responsive-sm">Type de bourse *</Label>
              <Select value={scholarshipData.type} onValueChange={(value) => setScholarshipData({...scholarshipData, type: value})}>
                <SelectTrigger className="text-responsive-sm">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MERIT" className="text-responsive-sm">Bourse au mérite</SelectItem>
                  <SelectItem value="NEED_BASED" className="text-responsive-sm">Bourse sociale</SelectItem>
                  <SelectItem value="DISCOUNT" className="text-responsive-sm">Réduction</SelectItem>
                  <SelectItem value="FULL" className="text-responsive-sm">Bourse complète</SelectItem>
                  <SelectItem value="PARTIAL" className="text-responsive-sm">Bourse partielle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="percentage" className="text-responsive-sm">Pourcentage de réduction *</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 50"
                value={scholarshipData.percentage}
                onChange={(e) => setScholarshipData({...scholarshipData, percentage: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="reason" className="text-responsive-sm">Motif</Label>
              <Input
                id="reason"
                placeholder="Raison de l'attribution"
                value={scholarshipData.reason}
                onChange={(e) => setScholarshipData({...scholarshipData, reason: e.target.value})}
                className="text-responsive-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => handleCloseDialog('scholarship')} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleSubmitScholarship} className="w-full sm:w-auto">
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rappel */}
      <Dialog open={isReminderDialogOpen} onOpenChange={() => handleCloseDialog('reminder')}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Envoyer un rappel</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Étudiant: {selectedStudent?.user?.name || selectedStudent?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="message" className="text-responsive-sm">Message *</Label>
              <textarea
                id="message"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md text-responsive-sm"
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
              <Label htmlFor="sendToParent" className="cursor-pointer text-responsive-sm">
                Envoyer également au parent
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => handleCloseDialog('reminder')} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleSubmitReminder} className="w-full sm:w-auto">
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
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Modifier l&apos;étudiant</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="editPhone" className="text-responsive-sm">Téléphone</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  placeholder="+221 77 123 4567"
                  className="text-responsive-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="editNiveau" className="text-responsive-sm">Niveau</Label>
                <Select value={editData.niveau} onValueChange={(value) => setEditData({...editData, niveau: value})}>
                  <SelectTrigger className="text-responsive-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolType === 'HIGH_SCHOOL' ? (
                      <>
                        <SelectItem value="10E" className="text-responsive-sm">10ème (Seconde)</SelectItem>
                        <SelectItem value="11E" className="text-responsive-sm">11ème (Première)</SelectItem>
                        <SelectItem value="12E" className="text-responsive-sm">12ème (Terminale)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="L1" className="text-responsive-sm">Licence 1</SelectItem>
                        <SelectItem value="L2" className="text-responsive-sm">Licence 2</SelectItem>
                        <SelectItem value="L3" className="text-responsive-sm">Licence 3</SelectItem>
                        <SelectItem value="M1" className="text-responsive-sm">Master 1</SelectItem>
                        <SelectItem value="M2" className="text-responsive-sm">Master 2</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="editRoom" className="text-responsive-sm">{schoolType === 'HIGH_SCHOOL' ? 'Classe' : 'Salle'}</Label>
                <Select value={editData.roomId} onValueChange={(value) => setEditData({...editData, roomId: value})}>
                  <SelectTrigger className="text-responsive-sm">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-responsive-sm">Aucune</SelectItem>
                    {rooms
                      .filter(room => !room.niveau || room.niveau === editData.niveau)
                      .map(room => (
                        <SelectItem key={room.id} value={room.id} className="text-responsive-sm">
                          {room.name} ({room.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => handleCloseDialog('edit')} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit} className="w-full sm:w-auto">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Import Excel/CSV */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Importer des étudiants</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Importez une liste d&apos;étudiants depuis un fichier Excel (.xlsx) ou CSV (.csv)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-responsive-sm font-medium">
                  {importFile ? importFile.name : 'Cliquez pour sélectionner un fichier'}
                </p>
                <p className="text-responsive-xs text-muted-foreground mt-2">
                  Formats acceptés: .xlsx, .xls, .csv
                </p>
              </label>
            </div>
            <div className="bg-muted p-3 sm:p-4 rounded-lg">
              <p className="text-responsive-sm font-medium mb-2">📝 Format attendu :</p>
              <p className="text-responsive-xs text-muted-foreground">
                Matricule, Nom, Prénom, Date de naissance, Niveau, Filière, Téléphone
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => {
              setIsImportDialogOpen(false)
              setImportFile(null)
            }} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleImportFile} disabled={!importFile || isImporting} className="w-full sm:w-auto">
              {isImporting ? 'Import en cours...' : 'Importer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Envoi ID d'Enrôlement */}
      <Dialog open={isSendEnrollmentDialogOpen} onOpenChange={setIsSendEnrollmentDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-responsive-lg">Envoyer l&apos;ID d&apos;enrôlement</DialogTitle>
            <DialogDescription className="text-responsive-sm">
              Étudiant: {selectedStudent?.user?.name || selectedStudent?.studentNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 sm:p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="icon-responsive text-blue-600" />
                <p className="font-semibold text-responsive-sm">Informations à envoyer</p>
              </div>
              <div className="space-y-1 text-responsive-sm">
                <p>ID d&apos;enrôlement (parent et etudiant): <span className="font-bold"><strong>{selectedStudent?.enrollmentId}</strong></span></p>
                <p>Matricule: <span className="font-bold"><strong>{selectedStudent?.studentNumber}</strong></span></p>
                <p>Niveau: <span className="font-bold"><strong>{selectedStudent?.niveau}</strong></span></p>
                {selectedStudent?.filiere && (
                  <p>Filière: <span className="font-bold"><strong>{selectedStudent.filiere.nom}</strong></span></p>
                )}
              </div>
            </div>


            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="recipientEmail" className="text-responsive-sm">Email du destinataire *</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="parent@example.com ou etudiant@example.com"
                value={enrollmentEmailData.recipientEmail}
                onChange={(e) => setEnrollmentEmailData({ recipientEmail: e.target.value })}
                className="text-responsive-sm"
              />
              <p className="text-responsive-xs text-muted-foreground">
                Un email professionnel sera envoyé avec l&apos;ID d&apos;enrôlement, l&apos;email suggéré et les instructions complètes.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => {
              setIsSendEnrollmentDialogOpen(false)
              setEnrollmentEmailData({ recipientEmail: '' })
            }} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleConfirmSendEnrollment} className="w-full sm:w-auto">
              <Mail className="icon-responsive mr-2" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
