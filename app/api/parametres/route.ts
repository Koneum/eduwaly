import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const parametres = await prisma.parametre.findFirst();
    return NextResponse.json(parametres || {});
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // Vérifier les champs requis
    if (!data.chefDepartement || !data.titre || !data.grade) {
      return NextResponse.json(
        { error: 'Le chef de département, le titre et le grade sont requis' },
        { status: 400 }
      );
    }

    // Mettre à jour ou créer les paramètres
    const parametres = await prisma.parametre.upsert({
      where: {
        id: '1' // On utilise un ID fixe car on n'a qu'un seul enregistrement
      },
      update: {
        chefDepartement: data.chefDepartement,
        titre: data.titre,
        grade: data.grade,
        synchroniserDate: data.synchroniserDate ?? true,
        updatedAt: new Date()
      },
      create: {
        id: '1',
        chefDepartement: data.chefDepartement,
        titre: data.titre,
        grade: data.grade,
        synchroniserDate: data.synchroniserDate ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(parametres);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    );
  }
}
