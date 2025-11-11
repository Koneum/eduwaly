/* eslint-disable @typescript-eslint/no-explicit-any */
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// Initialiser les fonts
// @ts-ignore - pdfFonts types are complex
pdfMake.vfs = pdfFonts.pdfMake.vfs

interface School {
  name: string
  logo: string | null
  address: string | null
  phone: string | null
  email: string | null
}

interface Student {
  name: string
  studentNumber: string
  niveau: string
  filiere: string
  enrollmentYear: number | null
}

interface ModuleGrade {
  module: string
  avgDevoirs: number
  avgExamens: number
  finalGrade: number
}

interface PDFTemplateConfig {
  showLogo: boolean
  logoPosition: 'left' | 'center' | 'right'
  headerColor: string
  showAddress: boolean
  showPhone: boolean
  showEmail: boolean
  tableStyle: 'simple' | 'striped' | 'bordered'
  tableHeaderColor: string
  footerText: string
  showSignatures: boolean
}

/**
 * Générer un bulletin de notes en PDF
 */
export async function generateBulletinPDF(
  school: School,
  student: Student,
  period: { name: string; startDate: Date; endDate: Date },
  moduleGrades: ModuleGrade[],
  generalAverage: number,
  config?: Partial<PDFTemplateConfig>
): Promise<Blob> {
  // Configuration par défaut
  const defaultConfig: PDFTemplateConfig = {
    showLogo: true,
    logoPosition: 'center',
    headerColor: '#1e40af',
    showAddress: true,
    showPhone: true,
    showEmail: true,
    tableStyle: 'striped',
    tableHeaderColor: '#3b82f6',
    footerText: 'Bulletin généré automatiquement',
    showSignatures: true
  }

  const finalConfig = { ...defaultConfig, ...config }

  // Calculer la promotion
  const promotion = student.enrollmentYear 
    ? `${student.enrollmentYear}-${student.enrollmentYear + 1}`
    : 'N/A'

  // Construire le document PDF
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        color: finalConfig.headerColor,
        alignment: finalConfig.logoPosition,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'white',
        fillColor: finalConfig.tableHeaderColor
      },
      tableCell: {
        fontSize: 10
      },
      footer: {
        fontSize: 9,
        italics: true,
        color: '#666',
        alignment: 'center',
        margin: [0, 10, 0, 0]
      },
      signature: {
        fontSize: 10,
        margin: [0, 30, 0, 0]
      }
    }
  }

  // En-tête avec logo (si activé)
  if (finalConfig.showLogo && school.logo) {
    docDefinition.content.push({
      image: school.logo,
      width: 80,
      alignment: finalConfig.logoPosition,
      margin: [0, 0, 0, 10]
    })
  }

  // Nom de l'école
  docDefinition.content.push({
    text: school.name,
    style: 'header'
  })

  // Informations école
  const schoolInfo: string[] = []
  if (finalConfig.showAddress && school.address) schoolInfo.push(school.address)
  if (finalConfig.showPhone && school.phone) schoolInfo.push(`Tél: ${school.phone}`)
  if (finalConfig.showEmail && school.email) schoolInfo.push(`Email: ${school.email}`)

  if (schoolInfo.length > 0) {
    docDefinition.content.push({
      text: schoolInfo.join(' | '),
      fontSize: 9,
      color: '#666',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    })
  }

  // Titre du bulletin
  docDefinition.content.push({
    text: 'BULLETIN DE NOTES',
    style: 'subheader',
    alignment: 'center',
    decoration: 'underline',
    margin: [0, 10, 0, 20]
  })

  // Informations étudiant
  docDefinition.content.push({
    columns: [
      {
        width: '50%',
        stack: [
          { text: `Nom: ${student.name}`, margin: [0, 0, 0, 5] },
          { text: `Matricule: ${student.studentNumber}`, margin: [0, 0, 0, 5] },
          { text: `Niveau: ${student.niveau}`, margin: [0, 0, 0, 5] }
        ]
      },
      {
        width: '50%',
        stack: [
          { text: `Filière: ${student.filiere}`, margin: [0, 0, 0, 5] },
          { text: `Promotion: ${promotion}`, margin: [0, 0, 0, 5] },
          { text: `Période: ${period.name}`, margin: [0, 0, 0, 5] }
        ]
      }
    ],
    margin: [0, 0, 0, 20]
  })

  // Tableau des notes
  const tableBody: any[] = [
    [
      { text: 'Matière', style: 'tableHeader' },
      { text: 'Devoirs', style: 'tableHeader', alignment: 'center' },
      { text: 'Examens', style: 'tableHeader', alignment: 'center' },
      { text: 'Note Finale', style: 'tableHeader', alignment: 'center' }
    ]
  ]

  moduleGrades.forEach((grade, index) => {
    const row = [
      { text: grade.module, style: 'tableCell' },
      { text: grade.avgDevoirs.toFixed(2), style: 'tableCell', alignment: 'center' },
      { text: grade.avgExamens.toFixed(2), style: 'tableCell', alignment: 'center' },
      { text: grade.finalGrade.toFixed(2), style: 'tableCell', alignment: 'center', bold: true }
    ]

    // Appliquer le style de tableau
    if (finalConfig.tableStyle === 'striped' && index % 2 === 1) {
      row.forEach((cell: any) => {
        if (typeof cell === 'object' && cell !== null) {
          cell.fillColor = '#f3f4f6'
        }
      })
    }

    tableBody.push(row)
  })

  // Ligne moyenne générale
  tableBody.push([
    { text: 'MOYENNE GÉNÉRALE', style: 'tableHeader', colSpan: 3 },
    {},
    {},
    { 
      text: generalAverage.toFixed(2), 
      style: 'tableHeader', 
      alignment: 'center',
      fontSize: 14
    }
  ])

  docDefinition.content.push({
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: tableBody
    },
    layout: finalConfig.tableStyle === 'bordered' ? 'lightHorizontalLines' : 'noBorders',
    margin: [0, 0, 0, 20]
  })

  // Appréciation
  const appreciation = generalAverage >= 16 ? 'Excellent' :
                      generalAverage >= 14 ? 'Très bien' :
                      generalAverage >= 12 ? 'Bien' :
                      generalAverage >= 10 ? 'Assez bien' :
                      'Insuffisant'

  docDefinition.content.push({
    text: `Appréciation: ${appreciation}`,
    fontSize: 12,
    bold: true,
    color: generalAverage >= 10 ? '#16a34a' : '#dc2626',
    margin: [0, 10, 0, 20]
  })

  // Signatures (si activé)
  if (finalConfig.showSignatures) {
    docDefinition.content.push({
      columns: [
        {
          width: '33%',
          stack: [
            { text: 'Le Directeur', style: 'signature' },
            { text: '_________________', margin: [0, 20, 0, 0] }
          ]
        },
        {
          width: '33%',
          stack: [
            { text: 'Le Professeur', style: 'signature' },
            { text: '_________________', margin: [0, 20, 0, 0] }
          ]
        },
        {
          width: '33%',
          stack: [
            { text: 'Le Parent', style: 'signature' },
            { text: '_________________', margin: [0, 20, 0, 0] }
          ]
        }
      ],
      margin: [0, 30, 0, 0]
    })
  }

  // Pied de page
  if (finalConfig.footerText) {
    docDefinition.content.push({
      text: finalConfig.footerText,
      style: 'footer'
    })
  }

  // Générer le PDF
  return new Promise((resolve, reject) => {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition)
      
      pdfDocGenerator.getBlob((blob: Blob) => {
        resolve(blob)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Générer un reçu de paiement en PDF
 */
export async function generateReceiptPDF(
  school: School,
  student: { name: string; studentNumber: string },
  payment: {
    amount: number
    date: Date
    method: string
    reference: string
    description: string
  }
): Promise<Blob> {
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        text: school.name,
        fontSize: 20,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      {
        text: 'REÇU DE PAIEMENT',
        fontSize: 16,
        bold: true,
        alignment: 'center',
        decoration: 'underline',
        margin: [0, 20, 0, 30]
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: `Étudiant: ${student.name}`, margin: [0, 0, 0, 5] },
              { text: `Matricule: ${student.studentNumber}`, margin: [0, 0, 0, 5] }
            ]
          },
          {
            width: '50%',
            stack: [
              { text: `Date: ${payment.date.toLocaleDateString('fr-FR')}`, margin: [0, 0, 0, 5] },
              { text: `Référence: ${payment.reference}`, margin: [0, 0, 0, 5] }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Description', payment.description],
            ['Montant', `${payment.amount.toLocaleString('fr-FR')} FCFA`],
            ['Mode de paiement', payment.method]
          ]
        },
        margin: [0, 0, 0, 30]
      },
      {
        text: `Montant total: ${payment.amount.toLocaleString('fr-FR')} FCFA`,
        fontSize: 14,
        bold: true,
        alignment: 'right',
        margin: [0, 10, 0, 40]
      },
      {
        columns: [
          { width: '50%', text: '' },
          {
            width: '50%',
            stack: [
              { text: 'Signature et cachet', alignment: 'center', margin: [0, 0, 0, 10] },
              { text: '_________________', alignment: 'center', margin: [0, 20, 0, 0] }
            ]
          }
        ]
      }
    ]
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition)
      
      pdfDocGenerator.getBlob((blob: Blob) => {
        resolve(blob)
      })
    } catch (error) {
      reject(error)
    }
  })
}
