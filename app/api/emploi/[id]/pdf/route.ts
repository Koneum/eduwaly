import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Fonction pour formater la date en français
function formatDateFR(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();
}

// Petit type local pour limiter l'usage d'any' dans les helpers
type EmploiDays = { joursCours: string; evaluation?: boolean; jourEvaluation?: string | null };

// Fonction pour vérifier si c'est le jour du cours
function isCoursDay(emploi: EmploiDays, jour: string) {
  const joursCours = JSON.parse(emploi.joursCours);
  return joursCours.includes(jour);
}

// Fonction pour vérifier si c'est le jour de l'évaluation
function isEvaluationDay(emploi: EmploiDays, jour: string) {
  return !!emploi.evaluation && emploi.jourEvaluation === jour;
}

// Fonction pour formater l'heure
function formatHeure(heure: string) {
  return heure.split(':').slice(0, 2).join(':');
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer l'ID de l'emploi du temps après avoir attendu params
    const { id } = await context.params;
    
    // Récupérer l'emploi du temps
    const emploi = await prisma.emploiDuTemps.findUnique({
      where: { 
        id: id 
      },
      include: {
        module: true,
        enseignant: true,
        filiere: true,
        anneeUniv: true,
      },
    });

    if (!emploi) {
      return NextResponse.json(
        { error: 'Emploi du temps non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les paramètres (chef de département)
    const parametres = await prisma.parametre.findFirst();
    if (!parametres) {
      return NextResponse.json(
        { error: 'Paramètres non trouvés' },
        { status: 404 }
      );
    }

    // Créer un nouveau document PDF en mode paysage
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Ajouter le logo
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
      doc.addImage('data:image/png;base64,' + logoBase64, 'PNG', doc.internal.pageSize.width / 2 - 15, 10, 30, 30);
    }

    // En-tête centré
    doc.setFontSize(16);
    doc.text('Institut Universitaire de Formation Professionnelle', doc.internal.pageSize.width / 2, 50, { align: 'center' });
    doc.setFontSize(14);
    doc.text('FORMATION CONTINUE', doc.internal.pageSize.width / 2, 58, { align: 'center' });
    
    // Titre de l'emploi du temps
    doc.setFontSize(12);
    const dateDebut = formatDateFR(emploi.dateDebut);
    const dateFin = formatDateFR(emploi.dateFin);
    doc.text(
      `EDT DU ${dateDebut} AU ${dateFin}${emploi.module.isUeCommune ? ' - UE' : ''}`,
      doc.internal.pageSize.width / 2,
      66,
      { align: 'center' }
    );

    // Informations de l'emploi en grille
    const startY = 80;
    doc.setFontSize(10);
    
    // Ligne d'informations sur une seule ligne
    const anneeUniv = emploi.anneeUniv ? emploi.anneeUniv.annee : 'Non définie';
    doc.text(`FILIERES : ${emploi.module.isUeCommune ? 'UE COMMUNE' : emploi.filiere?.nom || 'Non définie'}`, 20, startY);
    doc.text(`NIVEAU : ${emploi.niveau}-${emploi.semestre}`, 80, startY);
    doc.text(`Salle CM : ${emploi.salle}`, 140, startY);
    doc.text(`VH : ${emploi.vh}`, 200, startY);
    doc.text(`ANNEE UNIV : ${anneeUniv}`, 230, startY);
    
    // Tableau des horaires
    const headers = [['Horaires', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']];
    
    // Créer les données du tableau avec la même logique que la page de visualisation
    const data = [
      [`${formatHeure(emploi.heureDebut)}-${formatHeure(emploi.heureFin)}`,
        ...['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(jour => {
          if (isCoursDay(emploi, jour)) {
            if (isEvaluationDay(emploi, jour)) {
              return { 
                content: '(Évaluation)', 
                styles: { 
                  textColor: [255, 0, 0] as [number, number, number]
                } 
              };
            } else {
              let cellContent = emploi.module.nom + '\n';
              cellContent += emploi.module.type + '\n';
              if (emploi.enseignant) {
                cellContent += emploi.enseignant.nom;
              }
              return cellContent;
            }
          }
          return '';
        })
      ]
    ];

    // Calculer la largeur disponible et ajuster les colonnes
    const pageWidth = doc.internal.pageSize.width;
    const margins = 20; // marges totales
    const availableWidth = pageWidth - (2 * margins);
    const horaireWidth = 20; // largeur fixe pour la colonne horaire
    const dayWidth = (availableWidth - horaireWidth) / 6; // répartir le reste entre les 6 jours

    // Configurer et dessiner le tableau
    autoTable(doc, {
      startY: startY + 10, // Ajuster la position de départ pour tenir compte des trois lignes d'en-tête
      head: headers,
      body: data,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.5,
        minCellHeight: 10,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      margin: { left: margins, right: margins },
      columnStyles: {
        0: { cellWidth: horaireWidth },
        1: { cellWidth: dayWidth },
        2: { cellWidth: dayWidth },
        3: { cellWidth: dayWidth },
        4: { cellWidth: dayWidth },
        5: { cellWidth: dayWidth },
        6: { cellWidth: dayWidth },
      },
    });

    // Signature avec les informations du chef de département
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    
    // Colonne de gauche avec le nom de l'enseignant
    if (emploi.enseignant) {
      doc.text(`${emploi.enseignant.titre || ''} ${emploi.enseignant.prenom} ${emploi.enseignant.nom}`, 20, finalY);
      doc.text(`Ségou, le ${formatDateFR(new Date())}`, 20, finalY + 10);
    }
    
    // Colonne de droite avec la date et signature  
    doc.text('Le Chef de Département', 240, finalY);
    doc.text(`${parametres.titre} ${parametres.chefDepartement}`, 240, finalY + 10);
    doc.text(parametres.grade, 240, finalY + 15);

    // Convertir le PDF en buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="emploi-${id}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
