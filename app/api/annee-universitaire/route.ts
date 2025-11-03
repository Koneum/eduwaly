import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const anneesUniversitaires = await prisma.anneeUniversitaire.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(anneesUniversitaires);
  } catch (error) {
    console.error('Erreur lors de la récupération des années universitaires:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des années universitaires' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Vérifier les champs requis
    if (!data.annee || !data.dateDebut || !data.dateFin || !data.schoolId) {
      return NextResponse.json(
        { error: 'L\'année, la date de début, la date de fin et l\'école sont requises' },
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

    // Vérifier si l'année existe déjà pour cette école
    const anneeExistante = await prisma.anneeUniversitaire.findFirst({
      where: {
        annee: data.annee,
        schoolId: data.schoolId
      }
    });

    if (anneeExistante) {
      return NextResponse.json(
        { error: 'Cette année universitaire existe déjà pour cette école' },
        { status: 400 }
      );
    }

    // Créer l'année universitaire
    const anneeUniversitaire = await prisma.anneeUniversitaire.create({
      data: {
        annee: data.annee,
        schoolId: data.schoolId,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        estActive: data.estActive !== undefined ? data.estActive : false
      }
    });

    return NextResponse.json(anneeUniversitaire);
  } catch (error) {
    console.error('Erreur lors de la création de l\'année universitaire:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'année universitaire' },
      { status: 500 }
    );
  }
}
