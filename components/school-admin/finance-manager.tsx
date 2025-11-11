'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Printer, Download, Filter, FileText, FileSpreadsheet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generatePDFHeader, generatePDFFooter, type SchoolInfo, type PDFHeaderConfig } from '@/lib/pdf-utils'

// Fonction pour convertir FeeType en nom lisible
const getFeeTypeName = (type: string): string => {
  const feeTypeNames: Record<string, string> = {
    'REGISTRATION': "Frais d'inscription",
    'TUITION': 'Frais de scolarité',
    'EXAM': "Frais d'examen",
    'LIBRARY': 'Frais de bibliothèque',
    'SPORT': 'Frais sportifs',
    'TRANSPORT': 'Frais de transport',
    'OTHER': 'Autres frais'
  }
  return feeTypeNames[type] || type
}

interface Student {
  id: string
  firstName: string
  lastName: string
  classe: {
    name: string
  }
}

interface FeeStructure {
  type: string
}

interface Payment {
  id: string
  amount: number
  amountPaid: number
  status: string
  dueDate: Date
  paidAt: Date | null
  paymentMethod: string | null
  student: Student
  feeStructure?: FeeStructure | null
}

interface FinanceManagerProps {
  payments: Payment[]
  schoolId: string
}

interface ReceiptTemplate {
  id: string
  name: string
  logoUrl: string | null
  headerText: string | null
  footerText: string | null
  showLogo: boolean
  showStamp: boolean
  stampUrl: string | null
  primaryColor: string
}

export default function FinanceManager({ payments, schoolId }: FinanceManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [receiptTemplate, setReceiptTemplate] = useState<ReceiptTemplate | null>(null)
  const [school, setSchool] = useState<SchoolInfo | null>(null)
  const [pdfConfig, setPdfConfig] = useState<PDFHeaderConfig | null>(null)

  // Charger le template actif et les infos école
  useEffect(() => {
    // Template de reçu
    fetch(`/api/school-admin/receipt-templates/active?schoolId=${schoolId}`)
      .then(res => res.json())
      .then(data => setReceiptTemplate(data))
      .catch(err => console.error('Erreur chargement template:', err))

    // Infos école et template PDF
    Promise.all([
      fetch(`/api/schools/${schoolId}`),
      fetch(`/api/admin/pdf-templates?schoolId=${schoolId}`)
    ]).then(async ([schoolRes, templateRes]) => {
      if (schoolRes.ok && templateRes.ok) {
        const schoolData = await schoolRes.json()
        const templateData = await templateRes.json()
        
        setSchool({
          name: schoolData.name,
          logo: schoolData.logo,
          address: schoolData.address,
          phone: schoolData.phone,
          email: schoolData.email,
          stamp: schoolData.stamp
        })
        setPdfConfig(templateData.config)
      }
    }).catch(err => console.error('Erreur chargement config PDF:', err))
  }, [schoolId])

  // Filtrer et trier les paiements
  const filteredPayments = payments
    .filter(payment => {
      const studentName = `${payment.student.firstName} ${payment.student.lastName}`.toLowerCase()
      const matchesSearch = studentName.includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      } else if (sortBy === 'amount') {
        return Number(b.amount) - Number(a.amount)
      } else if (sortBy === 'name') {
        return `${a.student.firstName} ${a.student.lastName}`.localeCompare(
          `${b.student.firstName} ${b.student.lastName}`
        )
      }
      return 0
    })

  // Calculer les statistiques CORRECTEMENT
  const stats = {
    // Total attendu (somme de tous les montants dus)
    total: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    
    // Total payé (somme de TOUS les montants payés, peu importe le statut)
    paid: payments.reduce((sum, p) => sum + Number(p.amountPaid), 0),
    
    // Total restant (total - payé)
    remaining: payments.reduce((sum, p) => 
      sum + (Number(p.amount) - Number(p.amountPaid)), 0
    ),
    
    // Restant en attente (seulement les paiements PENDING)
    pending: payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + (Number(p.amount) - Number(p.amountPaid)), 0),
    
    // Restant en retard (seulement les paiements OVERDUE)
    overdue: payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + (Number(p.amount) - Number(p.amountPaid)), 0),
  }

  // Imprimer un reçu
  const printReceipt = (payment: Payment) => {
    const receiptWindow = window.open('', '_blank')
    if (!receiptWindow) return

    const template = receiptTemplate || {
      logoUrl: null,
      headerText: 'REÇU DE PAIEMENT',
      footerText: 'Merci pour votre paiement',
      showLogo: false,
      showStamp: false,
      stampUrl: null,
      primaryColor: '#4F46E5'
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu de Paiement - ${payment.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid ${template.primaryColor};
              padding-bottom: 20px;
            }
            .logo {
              max-width: 200px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: ${template.primaryColor};
            }
            .info-section {
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .value {
              color: #333;
            }
            .amount-section {
              margin-top: 30px;
              padding: 20px;
              background: #f5f5f5;
              border-radius: 8px;
            }
            .total {
              font-size: 24px;
              font-weight: bold;
              text-align: right;
              color: ${template.primaryColor};
            }
            .stamp {
              max-width: 150px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 14px;
              padding-top: 20px;
              border-top: 2px solid #eee;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${template.showLogo && template.logoUrl ? `<img src="${template.logoUrl}" alt="Logo" class="logo" />` : ''}
            <h1>${template.headerText || 'REÇU DE PAIEMENT'}</h1>
            <p style="color: #666; margin: 10px 0;">N° ${payment.id}</p>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">Étudiant:</span>
              <span class="value">${payment.student.firstName} ${payment.student.lastName}</span>
            </div>
            <div class="info-row">
              <span class="label">Classe:</span>
              <span class="value">${payment.student.classe.name}</span>
            </div>
            ${payment.feeStructure ? `
            <div class="info-row">
              <span class="label">Type de frais:</span>
              <span class="value">${getFeeTypeName(payment.feeStructure.type)}</span>
            </div>
            ` : ''}
            ${payment.paidAt ? `
            <div class="info-row">
              <span class="label">Date de paiement:</span>
              <span class="value">${new Date(payment.paidAt).toLocaleDateString('fr-FR')}</span>
            </div>
            ` : ''}
            ${payment.paymentMethod ? `
            <div class="info-row">
              <span class="label">Méthode de paiement:</span>
              <span class="value">${payment.paymentMethod}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Statut:</span>
              <span class="value">${payment.status === 'PAID' ? 'Payé' : payment.status === 'PENDING' ? 'En attente' : 'En retard'}</span>
            </div>
          </div>

          <div class="amount-section">
            <div class="info-row">
              <span class="label">Montant dû:</span>
              <span class="value">${Number(payment.amount).toLocaleString()} FCFA</span>
            </div>
            <div class="info-row">
              <span class="label">Montant payé:</span>
              <span class="value">${Number(payment.amountPaid).toLocaleString()} FCFA</span>
            </div>
            <div class="total">
              Total: ${Number(payment.amountPaid).toLocaleString()} FCFA
            </div>
          </div>

          <div class="footer">
            ${template.showStamp && template.stampUrl ? `<img src="${template.stampUrl}" alt="Cachet" class="stamp" />` : ''}
            <p>${template.footerText || 'Merci pour votre paiement'}</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
              Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
  }

  // Exporter en Excel (CSV avec séparateur point-virgule pour Excel)
  const exportToExcel = () => {
    const headers = ['Date', 'Étudiant', 'Classe', 'Type de frais', 'Montant Total', 'Montant Payé', 'Restant', 'Statut', 'Méthode']
    const rows = filteredPayments.map(p => {
      const remaining = Number(p.amount) - Number(p.amountPaid)
      return [
        p.paidAt ? new Date(p.paidAt).toLocaleDateString('fr-FR') : '-',
        `${p.student.firstName} ${p.student.lastName}`,
        p.student.classe.name,
        p.feeStructure ? getFeeTypeName(p.feeStructure.type) : '-',
        Number(p.amount).toLocaleString(),
        Number(p.amountPaid).toLocaleString(),
        remaining > 0 ? remaining.toLocaleString() : '0',
        p.status === 'PAID' ? 'Payé' : p.status === 'PENDING' ? 'En attente' : 'En retard',
        p.paymentMethod || '-'
      ]
    })

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    const BOM = '\uFEFF' // UTF-8 BOM pour Excel
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Exporter en PDF
  const exportToPDF = () => {
    if (!school || !pdfConfig) {
      alert('Configuration PDF non chargée. Veuillez rafraîchir la page.')
      return
    }

    const pdfWindow = window.open('', '_blank')
    if (!pdfWindow) return

    const pdfHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Liste des Paiements</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              margin: 0;
            }
            .report-title {
              text-align: center;
              margin: 20px 0;
              font-size: 24px;
              font-weight: bold;
              color: ${pdfConfig.headerColor};
            }
            .report-meta {
              text-align: center;
              margin-bottom: 30px;
              color: #666;
              font-size: 14px;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 8px;
              text-align: center;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
            .stat-value.green { color: #10b981; }
            .stat-value.orange { color: #f59e0b; }
            .stat-value.red { color: #ef4444; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              color: #333;
            }
            tr:hover {
              background-color: #f9f9f9;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .badge-paid { background-color: #d1fae5; color: #065f46; }
            .badge-pending { background-color: #fef3c7; color: #92400e; }
            .badge-overdue { background-color: #fee2e2; color: #991b1b; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { padding: 20px; }
              .stats { page-break-inside: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          ${generatePDFHeader(school, pdfConfig)}
          
          <div class="report-title">LISTE DES PAIEMENTS</div>
          <div class="report-meta">
            <p>Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Total de ${filteredPayments.length} paiement(s)</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Total Attendu</div>
              <div class="stat-value">${stats.total.toLocaleString()} FCFA</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Payé</div>
              <div class="stat-value green">${stats.paid.toLocaleString()} FCFA</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Restant</div>
              <div class="stat-value orange">${stats.remaining.toLocaleString()} FCFA</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Restant (Attente)</div>
              <div class="stat-value orange">${stats.pending.toLocaleString()} FCFA</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Restant (Retard)</div>
              <div class="stat-value red">${stats.overdue.toLocaleString()} FCFA</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Étudiant</th>
                <th>Classe</th>
                <th>Type de frais</th>
                <th style="text-align: right;">Total</th>
                <th style="text-align: right;">Payé</th>
                <th style="text-align: right;">Restant</th>
                <th>Statut</th>
                <th>Méthode</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(p => {
                const remaining = Number(p.amount) - Number(p.amountPaid)
                return `
                <tr>
                  <td>${p.paidAt ? new Date(p.paidAt).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>${p.student.firstName} ${p.student.lastName}</td>
                  <td>${p.student.classe.name}</td>
                  <td>${p.feeStructure ? getFeeTypeName(p.feeStructure.type) : '-'}</td>
                  <td style="text-align: right; font-weight: 500;">${Number(p.amount).toLocaleString()} FCFA</td>
                  <td style="text-align: right; color: #10b981; font-weight: 500;">${Number(p.amountPaid).toLocaleString()} FCFA</td>
                  <td style="text-align: right; font-weight: bold; color: ${remaining > 0 ? '#ef4444' : '#10b981'};">
                    ${remaining > 0 ? remaining.toLocaleString() + ' FCFA' : '✓ Soldé'}
                  </td>
                  <td>
                    <span class="badge badge-${p.status === 'PAID' ? 'paid' : p.status === 'PENDING' ? 'pending' : 'overdue'}">
                      ${p.status === 'PAID' ? 'Payé' : p.status === 'PENDING' ? 'En attente' : 'En retard'}
                    </span>
                  </td>
                  <td>${p.paymentMethod || '-'}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>

          ${generatePDFFooter(pdfConfig.footerText, pdfConfig.showSignatures, school.stamp || undefined)}

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    pdfWindow.document.write(pdfHTML)
    pdfWindow.document.close()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Total Attendu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold">{stats.total.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Total Payé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-success">{stats.paid.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Total Restant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-orange-600">{stats.remaining.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Restant (Attente)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-chart-5">{stats.pending.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-responsive-xs font-medium text-muted-foreground">Restant (Retard)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-responsive-xl font-bold text-red-600">{stats.overdue.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className="text-responsive-lg">Liste des Paiements</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-responsive-xs">
                    <Download className="icon-responsive mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDF} className="text-responsive-sm">
                    <FileText className="icon-responsive mr-2" />
                    Exporter en PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} className="text-responsive-sm">
                    <FileSpreadsheet className="icon-responsive mr-2" />
                    Exporter en Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-responsive text-muted-foreground" />
              <Input
                placeholder="Rechercher un étudiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 text-responsive-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] text-responsive-sm">
                <Filter className="icon-responsive mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-responsive-sm">Tous les statuts</SelectItem>
                <SelectItem value="PAID" className="text-responsive-sm">Payé</SelectItem>
                <SelectItem value="PENDING" className="text-responsive-sm">En attente</SelectItem>
                <SelectItem value="OVERDUE" className="text-responsive-sm">En retard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] text-responsive-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date" className="text-responsive-sm">Trier par date</SelectItem>
                <SelectItem value="amount" className="text-responsive-sm">Trier par montant</SelectItem>
                <SelectItem value="name" className="text-responsive-sm">Trier par nom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des paiements */}
          <ResponsiveTable
            data={filteredPayments}
            columns={[
              {
                header: "Étudiant",
                accessor: (payment) => `${payment.student.firstName} ${payment.student.lastName}`,
                priority: "high",
                className: "font-medium"
              },
              {
                header: "Classe",
                accessor: (payment) => payment.student.classe.name,
                priority: "medium"
              },
              {
                header: "Type de frais",
                accessor: (payment) => payment.feeStructure ? getFeeTypeName(payment.feeStructure.type) : '-',
                priority: "medium"
              },
              {
                header: "Date de paiement",
                accessor: (payment) => payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('fr-FR') : '-',
                priority: "medium"
              },
              {
                header: "Montant Total",
                accessor: (payment) => `${Number(payment.amount).toLocaleString()} FCFA`,
                priority: "high",
                className: "text-right font-medium"
              },
              {
                header: "Montant Payé",
                accessor: (payment) => (
                  <span className="text-green-600 font-medium">
                    {Number(payment.amountPaid).toLocaleString()} FCFA
                  </span>
                ),
                priority: "high",
                className: "text-right"
              },
              {
                header: "Restant",
                accessor: (payment) => {
                  const remaining = Number(payment.amount) - Number(payment.amountPaid)
                  return (
                    <span className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining > 0 ? `${remaining.toLocaleString()} FCFA` : '✓ Soldé'}
                    </span>
                  )
                },
                priority: "high",
                className: "text-right"
              },
              {
                header: "Statut",
                accessor: (payment) => (
                  <Badge
                    variant={
                      payment.status === 'PAID' ? 'default' :
                      payment.status === 'PENDING' ? 'secondary' : 'destructive'
                    }
                  >
                    {payment.status === 'PAID' ? 'Payé' :
                     payment.status === 'PENDING' ? 'En attente' : 'En retard'}
                  </Badge>
                ),
                priority: "high"
              }
            ]}
            keyExtractor={(payment) => payment.id}
            actions={(payment) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => printReceipt(payment)}
                disabled={payment.status !== 'PAID'}
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
            emptyMessage="Aucun paiement trouvé"
          />

          <div className="text-responsive-xs text-muted-foreground">
            Affichage de {filteredPayments.length} paiement{filteredPayments.length > 1 ? 's' : ''} sur {payments.length}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
