import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Local types to avoid relying on Prisma's generated helpers which may not be
// available in the current setup. Keep these minimal and focused on the
// properties used by this endpoint.
type Emploi = {
  module?: { nom?: string; type?: string; isUeCommune?: boolean } | null;
  filiere?: { nom?: string } | null;
  vh?: number | null;
  semestre?: string | null;
  anneeUniv?: { annee?: string } | null;
};

type EnseignantWithEmplois = {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  matricule?: string | null;
  titre?: string | null;
  grade?: string | null;
  type?: string | null;
  telephone?: string | null;
  emplois: Emploi[];
};

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
    // Note: 'matricule' is not part of the generated WhereInput in some
    // Prisma schemas in this project, so omit it from the filter to avoid
    // TypeScript errors. If your schema contains 'matricule', re-add it and
    // regenerate Prisma client types.
    const enseignants = await prisma.enseignant.findMany({
      where: {
        OR: [
          { nom: { contains: query } },
          { prenom: { contains: query } },
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
    const results = (enseignants as EnseignantWithEmplois[]).map((enseignant) => ({
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      matricule: enseignant.matricule,
      titre: enseignant.titre,
      grade: enseignant.grade,
      type: enseignant.type,
      telephone: enseignant.telephone,
      modules: enseignant.emplois.map((emploi: Emploi) => ({
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
