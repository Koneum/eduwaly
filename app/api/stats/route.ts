import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Récupérer les statistiques de base
    const [emploisCount, filieresCount, modulesCount, enseignantsCount] = await Promise.all([
      prisma.emploiDuTemps.count(),
      prisma.filiere.count(),
      prisma.module.count(),
      prisma.enseignant.count()
    ]);

    return NextResponse.json({
      emploisCount,
      filieresCount,
      modulesCount,
      enseignantsCount
    });

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul des statistiques' },
      { status: 500 }
    );
  }
}

//route stats
