import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const schoolId = url.searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Le schoolId est requis' },
        { status: 400 }
      );
    }

    const annees = await prisma.anneeUniversitaire.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(annees);
  } catch (error) {
    console.error('Erreur lors de la récupération des années universitaires:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des années universitaires' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('📝 Données reçues pour création année:', data);

    // Vérifier les champs requis
    if (!data.annee) {
      console.log('❌ Erreur: champ "annee" manquant');
      return NextResponse.json(
        { error: 'Le champ "annee" est requis' },
        { status: 400 }
      );
    }

    if (!data.schoolId) {
      console.log('❌ Erreur: schoolId manquant');
      return NextResponse.json(
        { error: 'Le schoolId est requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'année existe déjà pour cette école
    const existingAnnee = await prisma.anneeUniversitaire.findFirst({
      where: {
        annee: data.annee,
        schoolId: data.schoolId
      }
    });

    if (existingAnnee) {
      console.log('❌ Erreur: année déjà existante', existingAnnee);
      return NextResponse.json(
        { error: 'Cette année universitaire existe déjà pour cette école' },
        { status: 400 }
      );
    }

    // Créer l'année universitaire
    const annee = await prisma.anneeUniversitaire.create({
      data: {
        annee: data.annee,
        schoolId: data.schoolId,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
        estActive: data.estActive !== undefined ? data.estActive : true
      }
    });

    console.log('✅ Année universitaire créée avec succès:', annee);
    return NextResponse.json(annee, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'année universitaire' },
      { status: 500 }
    );
  }
}
