import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { formatDateToFr, formatHourRange } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);

    if (!id) {
      return NextResponse.json(
        { error: 'ID du semestre manquant' },
        { status: 400 }
      );
    }

    // Récupérer les emplois du temps pour le semestre spécifié
    const emplois = await prisma.emploiDuTemps.findMany({
      where: {
        semestre: id
      },
      include: {
        module: true,
        enseignant: true,
        filiere: true,
        anneeUniv: true
      },
      orderBy: {
        heureDebut: 'asc'
      }
    });

    if (!emplois || emplois.length === 0) {
      return NextResponse.json(
        { error: 'Aucun emploi du temps trouvé pour ce semestre' },
        { status: 404 }
      );
    }

    // Créer un nouveau document PDF en paysage
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    // En-tête
    doc.fontSize(18).text(`Emploi du temps - Semestre ${id}`, { align: 'center' });
    doc.moveDown();

    // Paramètres du tableau
    const startX = 50;
    const startY = 150;
    const cellWidth = 120;
    const cellHeight = 60;
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const timeSlots = ['8h-10h', '10h-12h', '14h-16h', '16h-18h'];

    // Style des cellules
    const drawCell = (x: number, y: number, width: number, height: number, text: string, fontSize: number = 10) => {
      doc.rect(x, y, width, height).stroke();
      doc.fontSize(fontSize);
      doc.text(text, x + 5, y + 5, {
        width: width - 10,
        align: 'center',
        height: height - 10
      });
    };

    // Dessiner l'en-tête des colonnes (jours)
    doc.fontSize(12).font('Helvetica-Bold');
    daysOfWeek.forEach((day, index) => {
      const x = startX + (index + 1) * cellWidth;
      drawCell(x, startY, cellWidth, cellHeight / 2, day, 12);
    });

    // Dessiner les créneaux horaires
    doc.fontSize(10).font('Helvetica');
    timeSlots.forEach((time, index) => {
      const y = startY + (index + 0.5) * cellHeight;
      drawCell(startX, y, cellWidth, cellHeight, time);
    });

    // Fonction pour obtenir l'index du créneau horaire
    const getTimeSlotIndex = (time: string) => {
      const hour = parseInt(time.split(':')[0]);
      if (hour === 8) return 0;
      if (hour === 10) return 1;
      if (hour === 14) return 2;
      if (hour === 16) return 3;
      return -1;
    };

    // Remplir le tableau avec les emplois du temps
    emplois.forEach(emploi => {
      const joursCours = JSON.parse(emploi.joursCours);
      const timeSlotIndex = getTimeSlotIndex(emploi.heureDebut);
      
      if (timeSlotIndex !== -1) {
        joursCours.forEach((jour: string) => {
          const dayIndex = daysOfWeek.indexOf(jour);
          if (dayIndex !== -1) {
            const x = startX + (dayIndex + 1) * cellWidth;
            const y = startY + (timeSlotIndex + 0.5) * cellHeight;
            
            // Préparer le contenu de la cellule
            const cellContent = [
              emploi.module?.nom || 'Module non assigné',
              emploi.enseignant ? `${emploi.enseignant.nom} ${emploi.enseignant.prenom}` : 'Non assigné',
              emploi.filiere?.nom || 'Non assignée',
              emploi.salle || 'Salle non assignée'
            ].join('\n');

            // Dessiner la cellule avec un style différent
            doc.rect(x, y, cellWidth, cellHeight).fillAndStroke('#f3f4f6', '#000000');
            doc.fillColor('#000000');
            doc.fontSize(8);
            doc.text(cellContent, x + 5, y + 5, {
              width: cellWidth - 10,
              align: 'center'
            });
          }
        });
      }
    });

    // Ajouter une légende
    const legendY = startY + (timeSlots.length + 1) * cellHeight;
    doc.fontSize(10).font('Helvetica');
    doc.text('Légende:', startX, legendY);
    doc.moveDown(0.5);
    doc.text('• Les cours sont affichés avec : Module, Enseignant, Filière et Salle', startX + 20, doc.y);

    // Ajouter un pied de page
    doc.fontSize(8).font('Helvetica');
    const currentDate = new Date().toLocaleDateString('fr-FR');
    doc.text(`Document généré le ${currentDate}`, startX, doc.page.height - 50);

    // Finaliser le PDF
    doc.end();

    // Convertir le PDF en buffer
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const response = new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="emploi-semestre-${id}.pdf"`
          }
        });
        resolve(response);
      });
      
      doc.on('error', (err) => {
        console.error('Erreur lors de la génération du PDF:', err);
        reject(new NextResponse(JSON.stringify({ error: 'Erreur lors de la génération du PDF' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
