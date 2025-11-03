import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type EnseignantWithEmplois = Prisma.EnseignantGetPayload<{
  include: {
    emplois: {
      include: {
        module: true;
        filiere: true;
        anneeUniv: true;
      };
    };
  };
}>;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Paramètre de recherche manquant' },
        { status: 400 }
      );
    }

    // Rechercher les enseignants qui correspondent au terme de recherche
    const enseignants = await prisma.enseignant.findMany({
      where: {
        OR: [
          { nom: { contains: query } },
          { prenom: { contains: query } },
          { matricule: { contains: query } },
          { email: { contains: query } }
        ]
      },
      include: {
        emplois: {
          include: {
            module: true,
            filiere: true,
            anneeUniv: true
          },
          orderBy: {
            dateDebut: 'asc'
          }
        }
      },
      take: 10 // Limiter à 10 résultats
    });

    // Formater les résultats
    const results = enseignants.map((enseignant: EnseignantWithEmplois) => ({
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      matricule: enseignant.matricule,
      titre: enseignant.titre,
      grade: enseignant.grade,
      type: enseignant.type,
      telephone: enseignant.telephone,
      modules: enseignant.emplois.map(emploi => ({
        nom: emploi.module?.nom,
        type: emploi.module?.type,
        filiere: emploi.filiere?.nom || 'UE Commune',
        vh: emploi.vh,
        semestre: emploi.semestre,
        annee: emploi.anneeUniv?.annee
      }))
    }));

    return NextResponse.json(results);

  } catch (error) {
    console.error('Erreur lors de la recherche des enseignants:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche des enseignants' },
      { status: 500 }
    );
  }
}
