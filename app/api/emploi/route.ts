import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const isRecent = url.searchParams.get('recent') === 'true';
    const schoolId = url.searchParams.get('schoolId');

  // Si schoolId est fourni, filtrer par école
  const whereClause: { schoolId?: string; anneeUnivId?: string } = {};
    
    if (schoolId) {
      whereClause.schoolId = schoolId;
    } else {
      // Récupérer l'année universitaire en cours si pas de schoolId
      const anneeUniv = await prisma.anneeUniversitaire.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      if (!anneeUniv) {
        return NextResponse.json(
          { error: 'Année universitaire non trouvée' },
          { status: 404 }
        );
      }
      whereClause.anneeUnivId = anneeUniv.id;
    }

    // Configuration de base pour la requête
    const baseQuery = {
      where: whereClause,
      include: {
        module: {
          include: {
            filiere: true
          }
        },
        filiere: true,
        enseignant: true,
        anneeUniv: true
      }
    };

    // Ajouter des conditions spécifiques pour les emplois récents
    if (isRecent) {
      const emplois = await prisma.emploiDuTemps.findMany({
        ...baseQuery,
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: 5
      });
      return NextResponse.json(emplois);
    }

    // Requête standard pour tous les emplois
    const emplois = await prisma.emploiDuTemps.findMany({
      ...baseQuery,
      orderBy: [
        { dateDebut: 'asc' },
        { heureDebut: 'asc' }
      ]
    });

    return NextResponse.json(emplois);
  } catch (error: unknown) {
    console.error('Erreur lors de la récupération des emplois du temps:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des emplois du temps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Vérifier les champs requis
    const requiredFields = {
      moduleId: 'Module',
      enseignantId: 'Enseignant',
      anneeUnivId: 'Année universitaire',
      dateDebut: 'Date de début',
      dateFin: 'Date de fin',
      heureDebut: 'Heure de début',
      heureFin: 'Heure de fin',
      vh: 'Volume horaire',
      joursCours: 'Jours de cours',
      semestre: 'Semestre',
      titre: 'Titre',
      salle: 'Salle',
      niveau: 'Niveau'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !data[field])
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Les champs suivants sont requis : ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Vérifier que les dates sont valides
    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      return NextResponse.json(
        { error: 'Les dates fournies ne sont pas valides' },
        { status: 400 }
      );
    }

    // Vérifier que la date de fin est après la date de début
    if (dateFin <= dateDebut) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    // Vérifier que le module existe et récupérer sa filière
    const moduleRecord = await prisma.module.findUnique({
      where: { id: data.moduleId }
    })

    if (!moduleRecord) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    // Vérifier que les jours de cours sont au format JSON valide
    let joursCours;
    try {
      joursCours = JSON.parse(data.joursCours);
      if (!Array.isArray(joursCours)) {
        throw new Error('Le format des jours de cours est invalide');
      }
    } catch {
      return NextResponse.json(
        { error: 'Le format des jours de cours est invalide' },
        { status: 400 }
      );
    }

    // Vérifier les chevauchements d'emploi du temps
    const emploisExistants = await prisma.emploiDuTemps.findMany({
      where: {
        enseignantId: data.enseignantId,
        anneeUnivId: data.anneeUnivId,
        OR: [
          {
            AND: [
              { dateDebut: { lte: dateDebut } },
              { dateFin: { gte: dateDebut } }
            ]
          },
          {
            AND: [
              { dateDebut: { lte: dateFin } },
              { dateFin: { gte: dateFin } }
            ]
          }
        ]
      }
    });

    if (emploisExistants.length > 0) {
      // Vérifier les chevauchements d'horaires
      type EmploiExistRow = { joursCours?: string | null; heureDebut?: string | number | null; heureFin?: string | number | null }
      const chevauchement = emploisExistants.some((emploi: EmploiExistRow) => {
        const joursCoursExistant = JSON.parse((emploi.joursCours as string) || '[]');
        return joursCours.some((jour: string) => 
          joursCoursExistant.includes(jour) &&
          emploi.heureDebut != null && emploi.heureFin != null && (
            (data.heureDebut >= emploi.heureDebut && data.heureDebut < emploi.heureFin) ||
            (data.heureFin > emploi.heureDebut && data.heureFin <= emploi.heureFin)
          )
        );
      });

      if (chevauchement) {
        return NextResponse.json(
          { error: 'Il y a un chevauchement avec un autre emploi du temps' },
          { status: 400 }
        );
      }
    }

    // Vérifier que schoolId est fourni
    if (!data.schoolId) {
      return NextResponse.json(
        { error: 'Le schoolId est requis' },
        { status: 400 }
      );
    }

    // Créer l'emploi du temps
    const emploi = await prisma.emploiDuTemps.create({
      data: {
        schoolId: data.schoolId,
        moduleId: data.moduleId,
        enseignantId: data.enseignantId,
        filiereId: moduleRecord.filiereId,
        anneeUnivId: data.anneeUnivId,
        dateDebut,
        dateFin,
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        vh: parseInt(data.vh.toString()),
        joursCours: data.joursCours,
        semestre: data.semestre,
        titre: data.titre,
        salle: data.salle,
        niveau: data.niveau,
        evaluation: data.evaluation || false,
        jourEvaluation: data.jourEvaluation || null
      },
      include: {
        module: {
          include: {
            filiere: true
          }
        },
        filiere: true,
        enseignant: true,
        anneeUniv: true
      }
    });

    return NextResponse.json(emploi);
  } catch (error: unknown) {
    console.error('Erreur lors de la création de l\'emploi du temps:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'emploi du temps' },
      { status: 500 }
    );
  }
}
