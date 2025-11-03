import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'année universitaire manquant' },
        { status: 400 }
      );
    }

    const anneeUniversitaire = await prisma.anneeUniversitaire.findUnique({
      where: { id },
      include: {
        emplois: {
          include: {
            module: {
              include: {
                filiere: true
              }
            },
            filiere: true,
            enseignant: true
          }
        }
      }
    });

    if (!anneeUniversitaire) {
      return NextResponse.json(
        { error: 'Année universitaire non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(anneeUniversitaire);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'année universitaire' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'année universitaire manquant' },
        { status: 400 }
      );
    }

    // Vérifier les champs requis
    if (!data.annee || !data.dateDebut || !data.dateFin) {
      return NextResponse.json(
        { error: 'L\'année, la date de début et la date de fin sont requises' },
        { status: 400 }
      );
    }

    // Vérifier le format de l'année (2024-2025)
    const anneePattern = /^\d{4}-\d{4}$/;
    if (!anneePattern.test(data.annee)) {
      return NextResponse.json(
        { error: 'Le format de l\'année doit être YYYY-YYYY (ex: 2024-2025)' },
        { status: 400 }
      );
    }

    // Vérifier que la deuxième année est l'année suivante
    const [anneeDebut, anneeFin] = data.annee.split('-').map(Number);
    if (anneeFin !== anneeDebut + 1) {
      return NextResponse.json(
        { error: 'L\'année de fin doit être l\'année suivante (ex: 2024-2025)' },
        { status: 400 }
      );
    }

    // Vérifier que la date de fin est après la date de début
    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);

    if (dateFin <= dateDebut) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    // Vérifier si l'année existe déjà pour un autre ID
    const anneeExistante = await prisma.anneeUniversitaire.findFirst({
      where: {
        AND: [
          { annee: data.annee },
          { id: { not: id } }
        ]
      }
    });

    if (anneeExistante) {
      return NextResponse.json(
        { error: 'Cette année universitaire existe déjà' },
        { status: 400 }
      );
    }

    const anneeUniversitaire = await prisma.anneeUniversitaire.update({
      where: { id },
      data: {
        annee: data.annee,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin)
      }
    });

    return NextResponse.json(anneeUniversitaire);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'année universitaire' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de l\'année universitaire manquant' },
        { status: 400 }
      );
    }

    // Vérifier si l'année a des emplois du temps
    const anneeUniversitaire = await prisma.anneeUniversitaire.findUnique({
      where: { id },
      include: {
        emplois: true
      }
    });

    if (!anneeUniversitaire) {
      return NextResponse.json(
        { error: 'Année universitaire non trouvée' },
        { status: 404 }
      );
    }

    if (anneeUniversitaire.emplois.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une année universitaire qui a des emplois du temps' },
        { status: 400 }
      );
    }

    await prisma.anneeUniversitaire.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Année universitaire supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'année universitaire' },
      { status: 500 }
    );
  }
}
