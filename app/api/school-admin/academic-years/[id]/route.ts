import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const annee = await prisma.anneeUniversitaire.findUnique({
      where: { id }
    });

    if (!annee) {
      return NextResponse.json(
        { error: 'Année universitaire non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(annee);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'année universitaire' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Vérifier si l'année existe
    const existingAnnee = await prisma.anneeUniversitaire.findUnique({
      where: { id }
    });

    if (!existingAnnee) {
      return NextResponse.json(
        { error: 'Année universitaire non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si une autre année avec le même nom existe pour cette école
    if (data.annee && data.annee !== existingAnnee.annee) {
      const duplicateAnnee = await prisma.anneeUniversitaire.findFirst({
        where: {
          annee: data.annee,
          schoolId: existingAnnee.schoolId,
          id: { not: id }
        }
      });

      if (duplicateAnnee) {
        return NextResponse.json(
          { error: 'Cette année universitaire existe déjà pour cette école' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'année universitaire
    const annee = await prisma.anneeUniversitaire.update({
      where: { id },
      data: {
        annee: data.annee,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
        estActive: data.estActive
      }
    });

    return NextResponse.json(annee);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'année universitaire' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si l'année existe
    const existingAnnee = await prisma.anneeUniversitaire.findUnique({
      where: { id }
    });

    if (!existingAnnee) {
      return NextResponse.json(
        { error: 'Année universitaire non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si des emplois du temps utilisent cette année
    const emploisCount = await prisma.emploiDuTemps.count({
      where: { anneeUnivId: id }
    });

    if (emploisCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer cette année car ${emploisCount} emploi(s) du temps l'utilisent` },
        { status: 400 }
      );
    }

    // Supprimer l'année universitaire
    await prisma.anneeUniversitaire.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Année universitaire supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'année universitaire' },
      { status: 500 }
    );
  }
}
