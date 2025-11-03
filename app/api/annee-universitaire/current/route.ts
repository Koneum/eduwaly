import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Récupérer l'année universitaire la plus récente
    const anneeUniversitaire = await prisma.anneeUniversitaire.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
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
        { error: 'Aucune année universitaire trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(anneeUniversitaire);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'année universitaire courante:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'année universitaire courante' },
      { status: 500 }
    );
  }
}
