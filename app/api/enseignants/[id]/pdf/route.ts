import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Importer l'extension autoTable
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EmploiDuTemps as EmploiDuTempsBase } from '@/types';

// Type adapté pour l'utilisation dans la génération PDF
interface EmploiDuTemps extends Omit<EmploiDuTempsBase, 'vh'> {
  vh: number;
}

// Étendre le type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Fonction pour formater le grade
function formatGrade(grade: string | null): string {
  if (!grade) return 'Non défini';
  
  const grades: { [key: string]: string } = {
    'ASSISTANT': 'ASSISTANT',
    'MAITRE_ASSISTANT': 'MAITRE_ASSISTANT',
    'MAITRE_CONFERENCE': 'MAITRE_CONFERENCE',
    'PROFESSEUR': 'PROFESSEUR',
    'DOCTEUR': 'DOCTEUR',
    'INGENIEUR': 'INGENIEUR',
    'TECHNICIEN': 'TECHNICIEN',
    'AUTRE': 'AUTRE'
  };
  
  return grades[grade] || grade;
}

// Fonction pour déterminer le semestre à partir d'une date
function getSemestreFromDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const month = date.getMonth() + 1; // Les mois commencent à 0
  return month >= 8 && month <= 12 ? 'S2' : 'S1';
}

// Selon la documentation Next.js 15, nous devons utiliser cette signature pour les routes API dynamiques
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer le semestre à partir du corps de la requête
    const { semestre = 'S2' } = await request.json();

  // Récupérer les paramètres de l'URL (id de l'enseignant)
  const { id } = await context.params;

    // Récupérer les données de l'enseignant
    const enseignant = await prisma.enseignant.findUnique({
      where: { id }, // Utiliser l'id après l'avoir attendu
      include: {
        emplois: {
          include: {
            module: true,
            filiere: true,
          },
        },
      },
    });

    if (!enseignant) {
      return NextResponse.json(
        { error: 'Enseignant non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer l'année universitaire en cours
    const anneeUniv = await prisma.anneeUniversitaire.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!anneeUniv) {
      return NextResponse.json(
        { error: 'Année universitaire non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer les paramètres (chef de département, etc.)
    const parametres = await prisma.parametre.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Définir manuellement les dates de début et fin pour l'année universitaire
    // en fonction de l'année universitaire récupérée et du semestre sélectionné
    let dateDebutAnnee, dateFinAnnee;
    
    // Extraire l'année de début et l'année de fin de l'année universitaire (format "2024-2025")
    const [anneeDebut, anneeFin] = anneeUniv.annee.split('-').map((a: string) => parseInt(a.trim()));
    
    if (semestre === 'S1') {
      // Premier semestre (janvier à août de l'année de fin)
      dateDebutAnnee = new Date(`${anneeFin}-01-01`);
      dateFinAnnee = new Date(`${anneeFin}-08-31`);
    } else {
      // Second semestre (septembre à décembre de l'année de début, janvier de l'année de fin)
      dateDebutAnnee = new Date(`${anneeDebut}-09-01`);
      dateFinAnnee = new Date(`${anneeDebut}-12-31`);
    }

    // Créer un nouveau document PDF (format portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Définir les positions du logo
    const logoWidth = 30;
    const logoHeight = 30;
    const logoX = 90; // Position X du logo (centré)
    const logoY = 10; // Position Y du logo (en haut)

    // Ajouter le logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = Buffer.from(logoData).toString('base64');
      
      // Ajuster la position du logo pour le format portrait (centré en haut)
      doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Erreur lors du chargement du logo:', error);
    }
    
    // Ajouter les titres
    doc.setFontSize(16);
    doc.setTextColor(0, 128, 0); // Vert
    doc.text('Institut Universitaire de Formation Professionnelle', 105, 45, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Noir
    doc.text(`EMPLOI DU TEMPS INDIVIDUEL Semestre ${semestre}`, 105, 52, { align: 'center' });

    // Définir les styles de texte
    const lineHeight = 7;
    let startY = 50;

    // Informations de l'enseignant
    startY += lineHeight * 2;
    doc.setFontSize(10);
    
    // Position des informations de l'enseignant
    const leftColX = 20;  // Position X de la colonne gauche
    const rightColX = 150; // Position X de la colonne droite
    
    // Positions Y pour les informations
    const infoStartY = startY;  // Position Y de départ
    const infoLineSpacing = lineHeight;  // Espacement entre les lignes
    
    // Colonne gauche (ajustée pour le format portrait)
    doc.text(`Nom : ${enseignant.nom}`, leftColX, infoStartY);
    doc.text(`Prénom : ${enseignant.prenom}`, leftColX, infoStartY + infoLineSpacing);
    doc.text(`N°Mle : -X`, leftColX, infoStartY + infoLineSpacing * 2);
    
    // Colonne droite (ajustée pour le format portrait)
    doc.text(`Statut : ${enseignant.type}`, rightColX, infoStartY);
    doc.text(`Grade/Diplôme : ${enseignant.grade}`, rightColX, infoStartY + infoLineSpacing);
    doc.text(`Année Universitaire : ${anneeUniv.annee}`, rightColX, infoStartY + infoLineSpacing * 2);

    // Configuration des colonnes du tableau
    const tableColumns = [
      'Semaine',
      'Module1(VH)/Classe',
      'Module2(VH)/Classe'
    ];

    // Fonction pour formater le nom du mois en français
    const formatMonth = (date: Date) => {
      const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ];
      return months[date.getMonth()];
    };

    // Générer les données du tableau
    const tableData = [];
    
    // Générer les semaines de l'année académique pour le semestre sélectionné
    let startDate, endDate;
    
    if (semestre === 'S1') {
      // Pour S1, s'assurer d'inclure la période du 24 au 28 février 2025
      startDate = new Date(`${anneeFin}-01-30`);
      endDate = new Date(`${anneeFin}-05-30`);
    } else {
      // Pour S2, commencer le 30 janvier et terminer le 30 mai (comme dans l'image)
      startDate = new Date(`${anneeFin}-01-30`);
      endDate = new Date(`${anneeFin}-05-30`);
    }
    
    // Ajuster au lundi de la première semaine
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 1) { // 1 = lundi
      // Si ce n'est pas un lundi, reculer au lundi précédent
      const daysToSubtract = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToSubtract);
    }
    
    const currentDate = new Date(startDate);

    // Créer un tableau pour stocker les modules par semaine
    const modulesBySemaine: { [key: string]: any[] } = {};

    // Organiser les modules par semaine et par semestre
    // D'abord, collecter toutes les dates d'emploi du temps pour cet enseignant et ce semestre
    const emploisSemestre = enseignant.emplois.filter((emploi: EmploiDuTemps) => {
      const emploiSemestre = getSemestreFromDate(emploi.dateDebut);
      return emploiSemestre === semestre;
    });

    // Collecter toutes les semaines importantes basées sur les emplois du temps
    const importantWeeks = new Set<string>();
    
    // Parcourir tous les emplois du temps pour trouver les semaines importantes
    emploisSemestre.forEach((emploi: EmploiDuTemps) => {
      const debutEmploi = new Date(emploi.dateDebut);
      const finEmploi = new Date(emploi.dateFin);
      
      // Trouver le lundi de la semaine de début
      const debutLundi = new Date(debutEmploi);
      const debutDayOfWeek = debutEmploi.getDay();
      if (debutDayOfWeek !== 1) { // 1 = lundi
        debutLundi.setDate(debutEmploi.getDate() - ((debutDayOfWeek === 0 ? 7 : debutDayOfWeek) - 1));
      }
      
      // Trouver le lundi de la semaine de fin
      const finLundi = new Date(finEmploi);
      const finDayOfWeek = finEmploi.getDay();
      if (finDayOfWeek !== 1) { // 1 = lundi
        finLundi.setDate(finEmploi.getDate() - ((finDayOfWeek === 0 ? 7 : finDayOfWeek) - 1));
      }
      
      // Ajouter toutes les semaines entre le début et la fin
      const currentLundi = new Date(debutLundi);
      while (currentLundi <= finLundi) {
        const weekEnd = new Date(currentLundi);
        weekEnd.setDate(currentLundi.getDate() + 4); // Du lundi au vendredi
        
        // Formater la clé de semaine
        const weekStartDay = currentLundi.getDate().toString().padStart(2, '0');
        const weekEndDay = weekEnd.getDate().toString().padStart(2, '0');
        const weekEndMonth = formatMonth(weekEnd);
        const weekEndYear = weekEnd.getFullYear();
        
        const weekKey = `${weekStartDay} au ${weekEndDay} ${weekEndMonth} ${weekEndYear}`;
        importantWeeks.add(weekKey);
        
        // Passer à la semaine suivante
        currentLundi.setDate(currentLundi.getDate() + 7);
      }
    });

    // Ajouter manuellement la semaine du 24 au 28 février 2025 pour S1 si elle n'est pas déjà incluse
    if (semestre === 'S1') {
      const specialWeekStart = new Date(2025, 1, 24); // 24 février 2025
      const specialWeekEnd = new Date(2025, 1, 28); // 28 février 2025
      
      const weekStartDay = specialWeekStart.getDate().toString().padStart(2, '0');
      const weekEndDay = specialWeekEnd.getDate().toString().padStart(2, '0');
      const weekEndMonth = formatMonth(specialWeekEnd);
      const weekEndYear = specialWeekEnd.getFullYear();
      
      const specialWeekKey = `${weekStartDay} au ${weekEndDay} ${weekEndMonth} ${weekEndYear}`;
      importantWeeks.add(specialWeekKey);
    }
    
    // Maintenant, organiser les modules par semaine
    enseignant.emplois
      .filter((emploi: EmploiDuTemps) => {
        // Toujours recalculer le semestre selon la nouvelle logique
        const emploiSemestre = getSemestreFromDate(emploi.dateDebut);
        return emploiSemestre === semestre;
      })
      .forEach((emploi: EmploiDuTemps) => {
        const debutEmploi = new Date(emploi.dateDebut);
        const finEmploi = new Date(emploi.dateFin);
        
        // Afficher les emplois du temps dans les semaines correspondantes
        const weekStart = new Date(startDate);
        while (weekStart <= endDate) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 4); // Du lundi au vendredi (5 jours)
          
          // Formater la clé de semaine
          const weekStartDay = weekStart.getDate().toString().padStart(2, '0');
          const weekEndDay = weekEnd.getDate().toString().padStart(2, '0');
          const weekEndMonth = formatMonth(weekEnd);
          const weekEndYear = weekEnd.getFullYear();
          
          const weekKey = `${weekStartDay} au ${weekEndDay} ${weekEndMonth} ${weekEndYear}`;
          
          // Vérifier si cette semaine est importante ou si l'emploi chevauche cette semaine
          if (importantWeeks.has(weekKey) || (debutEmploi <= weekEnd && finEmploi >= weekStart)) {
            if (!modulesBySemaine[weekKey]) {
              modulesBySemaine[weekKey] = [];
            }
            
            // N'ajouter l'emploi que s'il chevauche réellement cette semaine
            if (debutEmploi <= weekEnd && finEmploi >= weekStart) {
              modulesBySemaine[weekKey].push(emploi);
            }
          }
          
          weekStart.setDate(weekStart.getDate() + 7);
        }
      });

    // Générer les lignes du tableau
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 4); // Du lundi au vendredi (5 jours)
      
      // Format semaine: "DD au DD mois YYYY" avec les jours sur 2 chiffres
      const weekStartDay = weekStart.getDate().toString().padStart(2, '0');
      const weekEndDay = weekEnd.getDate().toString().padStart(2, '0');
      const weekEndMonth = formatMonth(weekEnd);
      const weekEndYear = weekEnd.getFullYear();
      
      const weekLabel = `${weekStartDay} au ${weekEndDay} ${weekEndMonth} ${weekEndYear}`;
      
      // Créer la ligne du tableau
      const weekRow = [weekLabel];
      
      // Récupérer les modules pour cette semaine
      const modulesCetteSemaine = modulesBySemaine[weekLabel] || [];
      
      // Ajouter les modules (maximum 2 par semaine)
      for (let i = 0; i < 2; i++) {
        const emploi = modulesCetteSemaine[i];
        weekRow.push(formatModuleCell(emploi));
      }
      
      tableData.push(weekRow);
      currentDate.setDate(currentDate.getDate() + 7); // Passer à la semaine suivante
    }

    // Fonction pour formater l'affichage d'un module dans une cellule
    function formatModuleCell(emploi: any): string {
      if (!emploi) return '';
      
      const moduleNom = emploi.module.nom || '';
      const moduleType = emploi.module.type || '';
      const moduleVH = emploi.vh || 0;
      const filiereNom = emploi.filiere?.nom || '';
      
      // Format: "CM_TD Anglais (15h) UE COMMUNE" si UE commune, sinon "CM_TD Anglais (15h) FILIERE"
      let cellContent = `${moduleType} ${moduleNom} (${moduleVH}h)`;
      
      if (emploi.module.isUeCommune) {
        cellContent += ' UE COMMUNE';
      } else if (filiereNom) {
        cellContent += ` ${filiereNom}`;
      }
      
      return cellContent;
    }

    // Définir la position Y du tableau
    const tableOffset = 15; // Décalage supplémentaire de 10px
    const tableStartY = startY + lineHeight * 2 + tableOffset; // Position Y de départ du tableau
    
    // Définir les marges du tableau
    const tableMarginLeft = 25; // Marge gauche du tableau
    const tableMarginRight = 20; // Marge droite du tableau
    
    // Ajouter le tableau au PDF avec le style approprié
    doc.autoTable({
      head: [tableColumns],
      body: tableData,
      startY: tableStartY,
      theme: 'grid',
      styles: {
        fontSize: 8,  // Augmenter légèrement la taille de police pour le format portrait
        cellPadding: 2,  // Revenir à un padding standard
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 30 },  // Semaine - ajusté
        1: { cellWidth: 60 },  // Module 1 - ajusté
        2: { cellWidth: 60 }   // Module 2 - ajusté
      },
      margin: { left: tableMarginLeft, right: tableMarginRight }  // Marges adaptées au format portrait
    });

    // Pied de page avec les totaux et signature
    // Récupérer la position Y finale du tableau
    const finalY = doc.lastAutoTable.finalY || 200;

    // Calculer les heures correctement pour le semestre sélectionné
    const totalVH = enseignant.emplois
      .filter((emploi: EmploiDuTemps) => {
        // Toujours recalculer le semestre selon la nouvelle logique
        const emploiSemestre = getSemestreFromDate(emploi.dateDebut);
        return emploiSemestre === semestre;
      })
      .reduce((sum: number, emploi: EmploiDuTemps) => sum + emploi.vh, 0);
    
    // Heures dues selon le type d'enseignant et le semestre
    const heuresDues = enseignant.type === 'PERMANENT' ? 56 : 28; // 56h pour un semestre (permanent)
    const heuresSupp = Math.max(0, totalVH - heuresDues);

    // Afficher les totaux (alignés à gauche) - ajusté pour le format portrait
    doc.setFontSize(10);
    doc.text(`Total d'heures dispensées : ${totalVH}h`, 20, finalY + 15);
    doc.text(`Heures dues : ${heuresDues}h`, 20, finalY + 20);
    doc.text(`Total d'heures supplémentaires : ${heuresSupp}h`, 20, finalY + 25);
    doc.text("VH: Volume horaire", 20, finalY + 30);

    // Date et signature (alignés à droite) - ajusté pour le format portrait
    const today = new Date();
    const formattedDate = `${today.getDate()} ${formatMonth(today)} ${today.getFullYear()}`;
    doc.text(`Ségou, le ${formattedDate}`, 180, finalY + 15, { align: 'right' });
    doc.text("Le Chef de Département", 180, finalY + 20, { align: 'right' });
    
    // Ajouter le nom du chef de département s'il est disponible
    if (parametres && parametres.chefDepartement) {
      doc.text(`Dr ${parametres.chefDepartement}`, 180, finalY + 30, { align: 'right' });
      doc.text(`${parametres.grade || 'MAITRE_ASSISTANT'}`, 180, finalY + 35, { align: 'right' });
    }

    // Retourner le PDF
    try {
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="enseignant-emploi-du-temps.pdf"`,
        },
      });
    } catch (error) {
      console.error('Error generating PDF buffer:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la génération du buffer PDF' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
