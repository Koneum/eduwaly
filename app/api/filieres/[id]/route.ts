import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la filière manquant' },
        { status: 400 }
      );
    }

    const filiere = await prisma.filiere.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            emplois: {
              include: {
                enseignant: true,
                anneeUniv: true
              }
            }
          }
        },
        emplois: {
          include: {
            module: true,
            enseignant: true,
            anneeUniv: true
          }
        }
      }
    });

    if (!filiere) {
      return NextResponse.json(
        { error: 'Filière non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(filiere);
  } catch (error) {
    console.error('Erreur lors de la récupération de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la filière' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la filière manquant' },
        { status: 400 }
      );
    }

    if (!data.nom) {
      return NextResponse.json(
        { error: 'Le nom de la filière est requis' },
        { status: 400 }
      );
    }

    // Vérifier si le nom existe déjà (sauf pour la filière en cours de modification)
    const existingFiliere = await prisma.filiere.findFirst({
      where: {
        AND: [
          { nom: data.nom },
          { id: { not: id } }
        ]
      }
    });

    if (existingFiliere) {
      return NextResponse.json(
        { error: 'Une filière avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    const filiere = await prisma.filiere.update({
      where: { id },
      data: {
        nom: data.nom,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(filiere);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la filière' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la filière manquant' },
        { status: 400 }
      );
    }

    // Vérifier si la filière a des modules ou des emplois du temps associés
    const filiereWithDependencies = await prisma.filiere.findUnique({
      where: { id },
      include: {
        modules: true,
        emplois: true
      }
    });

    if (filiereWithDependencies && (
      filiereWithDependencies.modules.length > 0 ||
      filiereWithDependencies.emplois.length > 0
    )) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une filière qui a des modules ou des emplois du temps associés' },
        { status: 400 }
      );
    }

    await prisma.filiere.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Filière supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la filière' },
      { status: 500 }
    );
  }
}
