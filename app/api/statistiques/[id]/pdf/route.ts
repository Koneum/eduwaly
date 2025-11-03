import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { HEURES_DUES, SEMESTRES, TYPE_ENSEIGNANT } from '@/lib/constants';
import fs from 'fs/promises';
import path from 'path';

// Interface pour les emplois avec les informations du module
interface EmploiWithModule {
  dateDebut: Date;
  dateFin: Date;
  vh: number;
  module: {
    type: string;
    nom: string;
    filiere?: {
      nom: string;
    } | null;
  };
}

// Interface pour les totaux
interface Total {
  heuresDues: number;
  heuresEffectuees: number;
  heuresSupplementaires: number;
}

// Interface pour l'enseignant avec les emplois
interface EnseignantWithEmplois {
  id: string;
  nom: string;
  prenom: string;
  matricule: string | null;
  grade: string;
  type: string;
  emplois: Array<{
    dateDebut: Date;
    dateFin: Date;
    vh: number;
    module: {
      type: string;
      nom: string;
      filiere: {
        nom: string;
      } | null;
    };
  }>;
}

// Fonction pour formater une plage de dates
function formatDateRange(debut: Date, fin: Date): string {
  return `${format(debut, 'dd')} au ${format(fin, 'dd MMMM yyyy', { locale: fr })}`;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'enseignant
    const enseignant = await prisma.enseignant.findUnique({
      where: { id: params.id },
      include: {
        emplois: {
          include: {
            module: {
              include: {
                filiere: true
              }
            }
          }
        }
      }
    }) as EnseignantWithEmplois | null;

    if (!enseignant) {
      return NextResponse.json(
        { error: 'Enseignant non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les paramètres
    const parametres = await prisma.parametre.findFirst();
    if (!parametres) {
      return NextResponse.json(
        { error: 'Paramètres non trouvés' },
        { status: 404 }
      );
    }

    // Récupérer le semestre de la query string
    const url = new URL(request.url);
    const semestre = url.searchParams.get('semestre') || 'S1';
    const anneeUniv = url.searchParams.get('annee') || '2024-2025';

    // Créer un nouveau document PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Ajouter le logo
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    try {
      const logoBase64 = await fs.readFile(logoPath, { encoding: 'base64' });
      doc.addImage('data:image/png;base64,' + logoBase64, 'PNG', doc.internal.pageSize.width / 2 - 15, 10, 30, 30);
    } catch (error) {
      console.warn('Logo non trouvé:', logoPath);
    }

    // En-tête
    doc.setFontSize(16);
    doc.text('INSTITUT UNIVERSITAIRE DE LA FORMATION PROFESSIONNELLE', doc.internal.pageSize.width / 2, 50, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('STATISTIQUES DES HEURES EFFECTUÉES', doc.internal.pageSize.width / 2, 60, { align: 'center' });
    doc.text(`Semestre ${semestre} - Année ${anneeUniv}`, doc.internal.pageSize.width / 2, 70, { align: 'center' });

    // Informations enseignant
    doc.setFontSize(12);
    doc.text(`Enseignant: ${enseignant.nom} ${enseignant.prenom}`, 20, 90);
    doc.text(`Grade: ${enseignant.grade}`, 20, 100);
    doc.text(`Type: ${enseignant.type}`, 20, 110);

    // Filtrer les emplois du semestre
    const semestreMois = SEMESTRES[semestre as keyof typeof SEMESTRES];
    const emploisFiltered = enseignant.emplois.filter(emploi => {
      const dateDebut = new Date(emploi.dateDebut);
      const mois = dateDebut.getMonth();
      return mois >= semestreMois.DEBUT_MOIS && mois <= semestreMois.FIN_MOIS;
    });

    // Données du tableau
    const tableData = emploisFiltered.map(emploi => [
      formatDateRange(new Date(emploi.dateDebut), new Date(emploi.dateFin)),
      emploi.module.type,
      emploi.module.nom,
      emploi.module.filiere?.nom || 'N/A',
      emploi.vh.toString()
    ]);

    // Générer le tableau
    (doc as any).autoTable({
      startY: 130,
      head: [['Période', 'Type', 'Module', 'Filière', 'VH']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 128, 0] },
      styles: { fontSize: 10, cellPadding: 2 }
    });

    // Calcul des totaux
    const total = emploisFiltered.reduce((acc: Total, emploi) => ({
      heuresEffectuees: acc.heuresEffectuees + emploi.vh,
      heuresDues: enseignant.type === TYPE_ENSEIGNANT.PERMANENT ? HEURES_DUES : 0,
      heuresSupplementaires: enseignant.type === TYPE_ENSEIGNANT.PERMANENT ? 
        Math.max(0, acc.heuresEffectuees + emploi.vh - HEURES_DUES) : 0
    }), {
      heuresDues: 0,
      heuresEffectuees: 0,
      heuresSupplementaires: 0
    });

    // Afficher les totaux
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.text(`Total des heures effectuées: ${total.heuresEffectuees}h`, 20, finalY);
    if (enseignant.type === TYPE_ENSEIGNANT.PERMANENT) {
      doc.text(`Heures dues: ${total.heuresDues}h`, 20, finalY + 10);
      doc.text(`Heures supplémentaires: ${total.heuresSupplementaires}h`, 20, finalY + 20);
    }

    // Signature
    doc.text('Chef de Département', 20, finalY + 40);
    doc.text(parametres.chefDepartement, 20, finalY + 50);
    doc.text(parametres.grade, 20, finalY + 60);

    // Retourner le PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="statistiques-${enseignant.nom}-${semestre}.pdf"`
      }
    });

  } catch (error) {
    console.error('Erreur PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
