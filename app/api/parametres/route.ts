import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parametres = await prisma.parametre.findFirst({
      where: { schoolId: user.schoolId }
    });
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
    const user = await getAuthUser();
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();

    // Vérifier les champs requis
    if (!data.chefDepartement || !data.titre || !data.grade) {
      return NextResponse.json(
        { error: 'Le chef de département, le titre et le grade sont requis' },
        { status: 400 }
      );
    }

    // Chercher les paramètres existants pour cette école
    const existing = await prisma.parametre.findFirst({
      where: { schoolId: user.schoolId }
    });

    // Mettre à jour ou créer les paramètres
    const parametres = existing
      ? await prisma.parametre.update({
          where: { id: existing.id },
          data: {
            chefDepartement: data.chefDepartement,
            titre: data.titre,
            grade: data.grade,
            synchroniserDate: data.synchroniserDate ?? true,
            updatedAt: new Date()
          }
        })
      : await prisma.parametre.create({
          data: {
            schoolId: user.schoolId,
            chefDepartement: data.chefDepartement,
            titre: data.titre,
            grade: data.grade,
            synchroniserDate: data.synchroniserDate ?? true
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
