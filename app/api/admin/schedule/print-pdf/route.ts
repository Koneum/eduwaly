import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Étendre le type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => void;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { schoolId, filiereId, ueCommuneOnly, schoolType } = await request.json();

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 });
    }

    // Récupérer l'école avec logo
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, logo: true }
    });

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 });
    }

    // Récupérer TOUTES les filières de l'école pour "TOUTES FILIÈRES"
    const allFilieres = await prisma.filiere.findMany({
      where: { schoolId },
      select: { id: true, nom: true },
      orderBy: { nom: 'asc' }
    });

    // Créer la liste des abréviations des filières
    const filieresAbbrev = allFilieres.map(f => {
      // Extraire l'abréviation (premières lettres ou acronyme)
      const words = f.nom.split(' ');
      if (words.length > 1) {
        return words.map(w => w[0]).join('').toUpperCase();
      }
      return f.nom.substring(0, 3).toUpperCase();
    }).join('/');

    // Récupérer les emplois du temps
    const whereClause: Record<string, unknown> = { schoolId };
    if (ueCommuneOnly) {
      // Filtrer uniquement les UE Communes (emplois sans filière)
      whereClause.filiereId = null;
    } else if (filiereId) {
      // Une filière spécifique + les UE Communes
      whereClause.OR = [
        { filiereId: filiereId },
        { filiereId: null } // UE Communes incluses
      ];
    }
    // Si filiereId est undefined/null et pas ueCommuneOnly, on récupère tout

    const emplois = await prisma.emploiDuTemps.findMany({
      where: whereClause,
      include: {
        module: { include: { filiere: true } },
        enseignant: true,
        filiere: true
      },
      orderBy: [{ heureDebut: 'asc' }]
    });

    // Récupérer infos filière si filtré
    let filiereName = `TOUTES FILIÈRES : ${filieresAbbrev || 'Toutes'}`;
    let niveau = '';
    let semestre = '';
    
    if (ueCommuneOnly) {
      filiereName = `UE COMMUNES (${filieresAbbrev || 'Toutes filières'})`;
    } else if (filiereId) {
      const filiere = await prisma.filiere.findUnique({
        where: { id: filiereId },
        select: { nom: true }
      });
      filiereName = filiere?.nom || 'Filière';
    }

    // Extraire niveau et semestre des emplois
    if (emplois.length > 0) {
      niveau = emplois[0].niveau || '';
      semestre = emplois[0].semestre || '';
    }

    // Calculer le volume horaire total
    const totalVH = emplois.reduce((sum, e) => sum + (e.vh || 0), 0);

    // Collecter les salles uniques
    const sallesSet = new Set(emplois.map(e => e.salle).filter(Boolean));
    const salles = Array.from(sallesSet).join(', ') || '-';

    // Créer le PDF - Format paysage
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // ===== EN-TÊTE =====
    // Logo école (si disponible)
    if (school.logo) {
      try {
        doc.addImage(school.logo, 'PNG', margin, 5, 20, 20);
      } catch {
        // Logo non valide
      }
    }

    // Nom de l'école (en vert/bleu)
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0); // Vert
    doc.setFont('helvetica', 'bold');
    doc.text(school.name, margin + 25, 15);

    // "FORMATION CONTINUE" ou type à droite
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(schoolType === 'UNIVERSITY' ? 'FORMATION CONTINUE' : 'EMPLOI DU TEMPS', pageWidth - margin, 15, { align: 'right' });

    // Titre principal avec dates
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 5);
    
    const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }).toUpperCase();
    const year = today.getFullYear();

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(
      `EDT DU ${formatDate(weekStart)} AU ${formatDate(weekEnd)} ${year}`,
      pageWidth / 2,
      25,
      { align: 'center' }
    );

    // ===== LIGNE D'INFOS =====
    // Bordure sous l'en-tête
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    // Infos: Filières | Niveau-Semestre | Année | Salle | VH
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const infoY = 35;
    const colWidth = (pageWidth - 2 * margin) / 5;
    
    // TOUTES FILIÈRES (ou nom filière)
    doc.setTextColor(0, 0, 255); // Bleu pour lien
    doc.text(filiereName, margin, infoY);
    
    doc.setTextColor(0, 0, 0);
    // Niveau-Semestre
    doc.text(`${niveau}${semestre ? '-' + semestre : ''}`, margin + colWidth, infoY);
    
    // Année universitaire
    const academicYear = `${year}-${year + 1}`;
    doc.text(`Année : ${academicYear}`, margin + colWidth * 2, infoY);
    
    // Salle
    doc.text(`Salle : ${salles.substring(0, 20)}`, margin + colWidth * 3, infoY);
    
    // VH Total
    doc.text(`VH : ${totalVH}H`, margin + colWidth * 4, infoY);

    doc.line(margin, 38, pageWidth - margin, 38);

    // ===== ORGANISER LES DONNÉES PAR HORAIRE ET JOUR =====
    const daysOfWeek = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    
    // Collecter tous les créneaux horaires uniques
    const timeSlots = new Set<string>();
    emplois.forEach(e => {
      if (e.heureDebut && e.heureFin) {
        timeSlots.add(`${e.heureDebut}-${e.heureFin}`);
      }
    });
    const sortedTimeSlots = Array.from(timeSlots).sort();

    // Organiser par jour et horaire
    const schedule: Record<string, Record<string, typeof emplois[0] | null>> = {};
    sortedTimeSlots.forEach(slot => {
      schedule[slot] = {};
      daysOfWeek.forEach(day => {
        schedule[slot][day] = null;
      });
    });

    emplois.forEach(emploi => {
      try {
        const jours = JSON.parse(emploi.joursCours || '[]');
        const slot = `${emploi.heureDebut}-${emploi.heureFin}`;
        jours.forEach((jour: string) => {
          if (schedule[slot] && schedule[slot][jour] !== undefined) {
            schedule[slot][jour] = emploi;
          }
        });
      } catch {
        // Ignorer
      }
    });

    // Collecter les enseignants pour la légende
    const enseignantsMap = new Map<string, string>();
    emplois.forEach(e => {
      if (e.enseignant) {
        const abbrev = `${e.enseignant.prenom?.[0] || ''}. ${e.enseignant.nom}`.toUpperCase();
        const fullName = `${e.enseignant.prenom || ''} ${e.enseignant.nom}`.trim();
        enseignantsMap.set(abbrev, fullName);
      }
    });

    // ===== CRÉER LE TABLEAU =====
    // En-têtes avec dates
    const headerRow = ['Horaires'];
    daysOfWeek.forEach((day, idx) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + idx);
      headerRow.push(`${day.substring(0, 3)} ${dayDate.getDate().toString().padStart(2, '0')}`);
    });

    // Corps du tableau
    const tableBody: (string | { content: string; styles?: Record<string, unknown> })[][] = [];
    
    sortedTimeSlots.forEach(slot => {
      const row: (string | { content: string; styles?: Record<string, unknown> })[] = [];
      // Formater l'horaire
      const [start, end] = slot.split('-');
      row.push(`${start.replace(':', 'H')}-${end.replace(':', 'H')}`);
      
      daysOfWeek.forEach(day => {
        const emploi = schedule[slot][day];
        if (emploi) {
          const moduleName = emploi.module?.nom || '-';
          const enseignantAbbrev = emploi.enseignant 
            ? `${emploi.enseignant.prenom?.[0] || ''}. ${emploi.enseignant.nom}`.toUpperCase()
            : '';
          
          // Format: Module\nEnseignant
          row.push({
            content: `${moduleName}\n${enseignantAbbrev}`,
            styles: { halign: 'center', valign: 'middle' }
          });
        } else {
          row.push('');
        }
      });
      
      tableBody.push(row);
    });

    // Si aucun créneau, ajouter une ligne vide
    if (tableBody.length === 0) {
      tableBody.push(['Aucun cours', '', '', '', '', '', '']);
    }

    // Générer le tableau
    doc.autoTable({
      head: [headerRow],
      body: tableBody,
      startY: 42,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold', halign: 'center' }
      },
      didParseCell: (data: { section: string; column: { index: number } }) => {
        // Style personnalisé pour l'en-tête
        if (data.section === 'head' && data.column.index > 0) {
          // Colorer les jours
        }
      }
    });

    // ===== LÉGENDE DES ENSEIGNANTS =====
    let currentY = doc.lastAutoTable.finalY + 8;
    
    if (enseignantsMap.size > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      let legendText = '';
      enseignantsMap.forEach((fullName, abbrev) => {
        legendText += `${abbrev} : ${fullName}    `;
      });
      
      doc.text(legendText.trim(), margin, currentY);
      currentY += 8;
    }

    // ===== SIGNATURE =====
    // Date et lieu à droite
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const signatureX = pageWidth - margin - 60;
    doc.text(
      `Généré le ${today.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      signatureX,
      currentY
    );
    
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Le Chef de Département', signatureX, currentY);

    // ===== PIED DE PAGE =====
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Document généré automatiquement par ${school.name}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );

    // Retourner le PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="emploi-du-temps-${filiereName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating schedule PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
