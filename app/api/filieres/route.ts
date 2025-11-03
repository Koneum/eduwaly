import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const filieres = await prisma.filiere.findMany({
      include: {
        modules: true,
        emplois: {
          include: {
            module: true,
            enseignant: true,
            anneeUniv: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    return NextResponse.json(filieres);
  } catch (error) {
    console.error('Erreur lors de la récupération des filières:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des filières' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Vérifier que le nom et schoolId sont présents
    if (!data.nom || !data.schoolId) {
      return NextResponse.json(
        { error: 'Le nom de la filière et l\'école sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si la filière existe déjà
    const existingFiliere = await prisma.filiere.findFirst({
      where: {
        nom: data.nom
      }
    });

    if (existingFiliere) {
      return NextResponse.json(
        { error: 'Cette filière existe déjà' },
        { status: 400 }
      );
    }

    // Créer la nouvelle filière
    const filiere = await prisma.filiere.create({
      data: {
        nom: data.nom,
        schoolId: data.schoolId,
      }
    });

    return NextResponse.json(filiere);
  } catch (error) {
    console.error('Erreur lors de la création de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la filière' },
      { status: 500 }
    );
  }
}
