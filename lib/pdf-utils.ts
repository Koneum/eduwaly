// Utilitaires pour la génération de PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportCard, Certificate } from '@/types/reporting';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = {
  primary: '#FFC300',
  secondary: '#2C3E50',
  success: '#10B981',
  danger: '#EF4444',
  gray: '#6B7280',
};

const FONTS = {
  title: 16,
  subtitle: 14,
  normal: 11,
  small: 9,
};

// Génération de bulletin de notes PDF
export async function generateReportCardPDF(reportCard: ReportCard): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // En-tête avec fond jaune
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(FONTS.title);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE NOTES', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(FONTS.normal);
  doc.setFont('helvetica', 'normal');
  doc.text(`Année Académique: ${reportCard.academicYear}`, pageWidth / 2, 25, { align: 'center' });
  doc.text(`Semestre: ${reportCard.semester}`, pageWidth / 2, 32, { align: 'center' });

  yPos = 50;

  // Informations étudiant
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS ÉTUDIANT', 15, yPos);
  
  yPos += 10;
  doc.setFontSize(FONTS.normal);
  doc.setFont('helvetica', 'normal');
  
  const studentInfo = [
    ['Nom complet:', reportCard.studentName],
    ['Matricule:', reportCard.enrollmentId],
    ['Filière:', reportCard.filiere],
    ['Niveau:', reportCard.niveau],
  ];

  studentInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos);
    yPos += 7;
  });

  yPos += 5;

  // Tableau des notes
  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉSULTATS ACADÉMIQUES', 15, yPos);
  yPos += 5;

  const tableData = reportCard.grades.map((grade) => [
    grade.moduleCode,
    grade.moduleName,
    grade.moduleAverage.toFixed(2),
    grade.coefficient.toString(),
    grade.weightedAverage.toFixed(2),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Code', 'Module', 'Moyenne', 'Coef.', 'Moy. Pond.']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.secondary,
      fontStyle: 'bold',
      fontSize: FONTS.normal,
    },
    bodyStyles: {
      fontSize: FONTS.normal,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Moyenne générale
  doc.setFillColor(COLORS.primary);
  doc.rect(15, yPos, pageWidth - 30, 25, 'F');
  
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text(`MOYENNE GÉNÉRALE: ${reportCard.average.toFixed(2)}/20`, pageWidth / 2, yPos + 10, { align: 'center' });
  
  if (reportCard.rank && reportCard.totalStudents) {
    doc.text(`Classement: ${reportCard.rank}e / ${reportCard.totalStudents}`, pageWidth / 2, yPos + 18, { align: 'center' });
  }

  yPos += 30;

  // Absences
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSIDUITÉ', 15, yPos);
  
  yPos += 8;
  doc.setFontSize(FONTS.normal);
  doc.setFont('helvetica', 'normal');
  
  const absenceInfo = [
    ['Total absences:', `${reportCard.absences.total}`],
    ['Justifiées:', `${reportCard.absences.justified}`],
    ['Non justifiées:', `${reportCard.absences.unjustified}`],
    ['Taux de présence:', `${(100 - reportCard.absences.percentage).toFixed(1)}%`],
  ];

  absenceInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos);
    yPos += 7;
  });

  // Commentaires
  if (reportCard.comments) {
    yPos += 5;
    doc.setFontSize(FONTS.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVATIONS', 15, yPos);
    
    yPos += 8;
    doc.setFontSize(FONTS.normal);
    doc.setFont('helvetica', 'normal');
    const splitComments = doc.splitTextToSize(reportCard.comments, pageWidth - 30);
    doc.text(splitComments, 15, yPos);
  }

  // Pied de page
  const footerY = pageHeight - 20;
  doc.setFontSize(FONTS.small);
  doc.setTextColor(COLORS.gray);
  doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, footerY, { align: 'center' });
  doc.text('Document officiel - Ne peut être modifié', pageWidth / 2, footerY + 5, { align: 'center' });

  return doc.output('blob');
}

// Génération de certificat de scolarité PDF
export async function generateCertificatePDF(certificate: Certificate): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 30;

  // Bordure décorative
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // En-tête
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.schoolName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  if (certificate.schoolAddress) {
    doc.setFontSize(FONTS.normal);
    doc.setFont('helvetica', 'normal');
    doc.text(certificate.schoolAddress, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
  }
  
  if (certificate.schoolPhone) {
    doc.text(`Tél: ${certificate.schoolPhone}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
  }

  yPos += 15;

  // Titre du certificat
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text('CERTIFICAT DE SCOLARITÉ', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setLineWidth(1);
  doc.setDrawColor(COLORS.primary);
  doc.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 50, yPos);

  yPos += 15;

  // Numéro de certificat
  doc.setFontSize(FONTS.small);
  doc.setTextColor(COLORS.gray);
  doc.setFont('helvetica', 'italic');
  doc.text(`N° ${certificate.certificateNumber}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 20;

  // Corps du certificat
  doc.setFontSize(FONTS.normal);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  
  const certText = [
    'Le Directeur de l\'établissement soussigné certifie que :',
    '',
    `${certificate.studentName}`,
    '',
    `Matricule: ${certificate.enrollmentId}`,
    '',
    `Est régulièrement inscrit(e) dans notre établissement pour l'année académique ${certificate.academicYear}`,
    '',
    `Filière: ${certificate.filiere}`,
    `Niveau: ${certificate.niveau}`,
    '',
    `Ce certificat est délivré pour servir et valoir ce que de droit, notamment pour ${certificate.purpose}.`,
  ];

  certText.forEach((line) => {
    if (line === '') {
      yPos += 5;
    } else if (line === certificate.studentName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(FONTS.subtitle);
      doc.text(line.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONTS.normal);
      yPos += 8;
    } else {
      const splitText = doc.splitTextToSize(line, pageWidth - 40);
      doc.text(splitText, pageWidth / 2, yPos, { align: 'center' });
      yPos += splitText.length * 7;
    }
  });

  yPos += 20;

  // Date et lieu
  doc.setFont('helvetica', 'italic');
  doc.text(`Fait à [Ville], le ${format(certificate.issuedAt, 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, yPos, { align: 'center' });

  yPos += 20;

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.text('Le Directeur', pageWidth - 50, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 70, yPos, pageWidth - 30, yPos);

  // Pied de page
  const footerY = pageHeight - 15;
  doc.setFontSize(FONTS.small);
  doc.setTextColor(COLORS.gray);
  doc.setFont('helvetica', 'italic');
  doc.text('Document officiel avec cachet et signature', pageWidth / 2, footerY, { align: 'center' });

  return doc.output('blob');
}

// Utilitaires
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CERT-${year}-${random}`;
}
