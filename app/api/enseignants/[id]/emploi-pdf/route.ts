import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import PDFDocument from 'pdfkit'; // Package non installé - nécessite: npm install pdfkit

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'enseignant manquant' },
        { status: 400 }
      );
    }

    // Fonctionnalité temporairement désactivée - nécessite pdfkit
    return NextResponse.json({
      error: 'Génération PDF temporairement désactivée',
      info: 'Pour activer cette fonctionnalité, installez le package pdfkit: npm install pdfkit',
      details: 'Cette fonctionnalité sera disponible dans une prochaine mise à jour'
    }, { status: 501 })

    /* Code commenté - nécessite pdfkit

    const enseignant = await prisma.enseignant.findUnique({
      where: { id },
      include: {
        emplois: {
          include: {
            module: true,
            filiere: true,
            anneeUniv: true
          }
        }
      }
    });

    if (!enseignant) {
      return NextResponse.json(
        { error: 'Enseignant non trouvé' },
        { status: 404 }
      );
    }

    // Créer un nouveau document PDF en paysage (horizontal)
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    // En-tête
    doc.fontSize(18).text('Emploi du temps individuel', { align: 'center' });
    doc.moveDown();

    // Informations de l'enseignant
    doc.fontSize(12);
    doc.text(`Enseignant: ${enseignant.nom} ${enseignant.prenom}`);
    doc.text(`Email: ${enseignant.email}`);
    doc.text(`Téléphone: ${enseignant.telephone}`);
    doc.moveDown();

    // Créer le tableau
    const startX = 50;
    const startY = 200;
    const cellWidth = 120;
    const cellHeight = 60;
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const timeSlots = ['8h-10h', '10h-12h', '14h-16h', '16h-18h'];

    // Dessiner l'en-tête des colonnes (jours)
    doc.fontSize(10);
    daysOfWeek.forEach((day, index) => {
      const x = startX + (index + 1) * cellWidth;
      doc.rect(x, startY, cellWidth, cellHeight / 2).stroke();
      doc.text(day, x + 5, startY + 10, {
        width: cellWidth - 10,
        align: 'center'
      });
    });

    // Dessiner les créneaux horaires
    timeSlots.forEach((time, index) => {
      const y = startY + (index + 0.5) * cellHeight;
      doc.rect(startX, y, cellWidth, cellHeight).stroke();
      doc.text(time, startX + 5, y + cellHeight / 3, {
        width: cellWidth - 10,
        align: 'center'
      });
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
    enseignant.emplois.forEach(emploi => {
      const joursCours = JSON.parse(emploi.joursCours);
      const timeSlotIndex = getTimeSlotIndex(emploi.heureDebut);
      
      if (timeSlotIndex !== -1) {
        joursCours.forEach((jour: string) => {
          const dayIndex = daysOfWeek.indexOf(jour);
          if (dayIndex !== -1) {
            const x = startX + (dayIndex + 1) * cellWidth;
            const y = startY + (timeSlotIndex + 0.5) * cellHeight;
            
            // Dessiner la cellule avec les informations du cours
            doc.rect(x, y, cellWidth, cellHeight).stroke();
            doc.fontSize(8);
            doc.text(
              `${emploi.module.nom}\n${emploi.filiere?.nom || 'Non assignée'}\n${emploi.salle}`,
              x + 5,
              y + 5,
              {
                width: cellWidth - 10,
                align: 'center'
              }
            );
          }
        });
      }
    });

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
            'Content-Disposition': `attachment; filename="emploi-enseignant-${id}.pdf"`
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
    */
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
