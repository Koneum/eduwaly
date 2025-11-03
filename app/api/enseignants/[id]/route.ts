import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';
import { getAuthUser } from '@/lib/auth-utils';

// Définir les enums localement pour remplacer ceux de Prisma
enum TypeEnseignant {
  PERMANENT = 'PERMANENT',
  VACATAIRE = 'VACATAIRE',
  ADMINISTRATEUR = 'ADMINISTRATEUR'
}

enum Grade {
  PROFESSEUR = 'PROFESSEUR',
  MAITRE_CONFERENCE = 'MAITRE_CONFERENCE',
  MAITRE_ASSISTANT = 'MAITRE_ASSISTANT',
  ASSISTANT = 'ASSISTANT'
}

interface Module {
  id: string;
  nom: string;
  type: string;
  vh: number;
  semestre: 'S1' | 'S2';
  filiere: {
    id: string;
    nom: string;
  } | null;
}

interface EmploiDuTemps {
  id: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  vh: number;
  module: {
    id: string;
    nom: string;
    type: string;
    vh: number;
    semestre?: 'S1' | 'S2';
    filiere: {
      id: string;
      nom: string;
    } | null;
  };
  evaluation: boolean;
  jourEvaluation: string | null;
  joursCours: string | null;
  anneeUniv: {
    annee: string;
  } | null;
}

interface Enseignant {
  id: string;
  nom: string;
  prenom: string;
  titre: string;
  grade: string;
  type: string;
  emplois: EmploiDuTemps[];
}

// Définition du type pour les enseignants avec leurs emplois du temps
type EnseignantWithEmplois = {
  id: string;
  nom: string;
  prenom: string;
  titre: string;
  grade: string;
  type: string;
  emplois: Array<{
    id: string;
    dateDebut: string;
    dateFin: string;
    heureDebut: string;
    heureFin: string;
    vh: number;
    evaluation: boolean;
    jourEvaluation: string | null;
    joursCours: string | null;
    module: {
      id: string;
      nom: string;
      type: string;
      vh: number;
      semestre?: 'S1' | 'S2';
      filiere: {
        id: string;
        nom: string;
      } | null;
    };
    anneeUniv: {
      annee: string;
    } | null;
  }>;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'enseignant manquant" },
        { status: 400 }
      );
    }

    const enseignant = await prisma.enseignant.findUnique({
      where: { id },
      include: {
        emplois: {
          include: {
            module: {
              include: {
                filiere: true
              }
            },
            anneeUniv: true
          },
          orderBy: {
            dateDebut: 'asc'
          }
        }
      }
    }) as EnseignantWithEmplois | null;

    if (!enseignant) {
      return NextResponse.json(
        { error: 'Enseignant non trouvé' },
        { status: 404 }
      );
    }

    const formattedEnseignant: Enseignant = {
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      titre: enseignant.titre,
      grade: enseignant.grade,
      type: enseignant.type,
      emplois: enseignant.emplois.map((emploi) => ({
        id: emploi.id,
        dateDebut: format(new Date(emploi.dateDebut), 'dd/MM/yyyy'),
        dateFin: format(new Date(emploi.dateFin), 'dd/MM/yyyy'),
        heureDebut: emploi.heureDebut,
        heureFin: emploi.heureFin,
        vh: emploi.vh,
        evaluation: emploi.evaluation,
        jourEvaluation: emploi.jourEvaluation,
        joursCours: emploi.joursCours,
        module: {
          id: emploi.module.id,
          nom: emploi.module.nom,
          type: emploi.module.type,
          vh: emploi.module.vh,
          semestre: (emploi.module as any).semestre || 'S1',
          filiere: emploi.module.filiere ? {
            id: emploi.module.filiere.id,
            nom: emploi.module.filiere.nom
          } : null
        },
        anneeUniv: emploi.anneeUniv ? {
          annee: emploi.anneeUniv.annee
        } : null
      }))
    };

    return NextResponse.json(formattedEnseignant);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Récupérer l'utilisateur authentifié
    const user = await getAuthUser();
    if (!user || !user.schoolId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nom, prenom, titre, telephone, email, type, grade } = body;

    // Validation des données
    if (!nom || !prenom || !titre || !telephone || !email || !type || !grade) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'email est unique (sauf pour l'enseignant actuel)
    const existingEnseignant = await prisma.enseignant.findFirst({
      where: {
        email,
        schoolId: user.schoolId,
        NOT: {
          id,
        },
      },
    });

    if (existingEnseignant) {
      return NextResponse.json(
        { error: 'Un enseignant avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Validation du type d'enseignant
    if (!Object.values(TypeEnseignant).includes(type as TypeEnseignant)) {
      return NextResponse.json(
        { error: 'Type d\'enseignant invalide' },
        { status: 400 }
      );
    }

    // Validation du grade
    if (!Object.values(Grade).includes(grade as Grade)) {
      return NextResponse.json(
        { error: 'Grade invalide' },
        { status: 400 }
      );
    }

    const enseignant = await prisma.enseignant.update({
      where: { id },
      data: {
        nom,
        prenom,
        titre,
        telephone,
        email,
        type: type as TypeEnseignant,
        grade: grade as Grade,
      },
    });

    return NextResponse.json(enseignant);
  } catch (error) {
    console.error('Error updating enseignant:', error);
    return NextResponse.json(
      { error: 'Error updating enseignant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Récupérer l'utilisateur authentifié
    const user = await getAuthUser();
    if (!user || !user.schoolId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier si l'enseignant a des emplois du temps associés
    const emplois = await prisma.emploiDuTemps.findMany({
      where: { enseignantId: id },
    });

    if (emplois.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer l\'enseignant car il a des emplois du temps associés' },
        { status: 400 }
      );
    }

    // Vérifier que l'enseignant appartient à l'école de l'utilisateur
    const enseignant = await prisma.enseignant.findUnique({
      where: { id },
    });

    if (!enseignant || enseignant.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: 'Enseignant non trouvé' },
        { status: 404 }
      );
    }

    await prisma.enseignant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting enseignant:', error);
    return NextResponse.json(
      { error: 'Error deleting enseignant' },
      { status: 500 }
    );
  }
}
