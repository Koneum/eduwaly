import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const emploi = await prisma.emploiDuTemps.findUnique({
      where: { id },
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

    if (!emploi) {
      return NextResponse.json(
        { error: "Emploi du temps non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(emploi);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'emploi du temps" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!data[field]) {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Les champs suivants sont requis : ${missingFields.join(', ')}`
        },
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

    // Vérifier le format des heures
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(data.heureDebut) || !timeRegex.test(data.heureFin)) {
      return NextResponse.json(
        { error: 'Format d\'heure invalide (HH:mm)' },
        { status: 400 }
      );
    }

    // Convertir les heures en minutes pour la comparaison
    const [heureDebutH, heureDebutM] = data.heureDebut.split(':').map(Number);
    const [heureFinH, heureFinM] = data.heureFin.split(':').map(Number);
    const minutesDebut = heureDebutH * 60 + heureDebutM;
    const minutesFin = heureFinH * 60 + heureFinM;

    if (minutesDebut >= minutesFin) {
      return NextResponse.json(
        { error: 'L\'heure de début doit être antérieure à l\'heure de fin' },
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

    // Vérifier les chevauchements d'emploi du temps (sauf avec l'emploi actuel)
    const emploisExistants = await prisma.emploiDuTemps.findMany({
      where: {
        AND: [
          { id: { not: id } },
          { enseignantId: data.enseignantId },
          { anneeUnivId: data.anneeUnivId },
          {
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
        ]
      }
    });

    for (const emploi of emploisExistants) {
      const joursCoursExistant = JSON.parse(emploi.joursCours);
      
      const joursCommuns = joursCoursExistant.filter((jour: string) => 
        joursCours.includes(jour)
      );

      if (joursCommuns.length > 0) {
        const [emploiDebutH, emploiDebutM] = emploi.heureDebut.split(':').map(Number);
        const [emploiFinH, emploiFinM] = emploi.heureFin.split(':').map(Number);
        const emploiMinutesDebut = emploiDebutH * 60 + emploiDebutM;
        const emploiMinutesFin = emploiFinH * 60 + emploiFinM;

        if (
          (minutesDebut >= emploiMinutesDebut && minutesDebut < emploiMinutesFin) ||
          (minutesFin > emploiMinutesDebut && minutesFin <= emploiMinutesFin) ||
          (minutesDebut <= emploiMinutesDebut && minutesFin >= emploiMinutesFin)
        ) {
          return NextResponse.json(
            { error: 'Il y a un chevauchement avec un autre emploi du temps' },
            { status: 400 }
          );
        }
      }
    }

    const emploi = await prisma.emploiDuTemps.update({
      where: { id },
      data: {
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
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'emploi du temps" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await prisma.emploiDuTemps.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Emploi du temps supprimé avec succès" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'emploi du temps" },
      { status: 500 }
    );
  }
}
