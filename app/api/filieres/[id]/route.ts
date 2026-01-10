import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la filière manquant' },
        { status: 400 }
      );
    }

    const filiere = await prisma.filiere.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            emplois: {
              include: {
                enseignant: true,
                anneeUniv: true
              }
            }
          }
        },
        emplois: {
          include: {
            module: true,
            enseignant: true,
            anneeUniv: true
          }
        }
      }
    });

    if (!filiere) {
      return NextResponse.json(
        { error: 'Filière non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette filière (même école)
    if (user.role !== 'SUPER_ADMIN' && filiere.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    return NextResponse.json(filiere);
  } catch (error) {
    console.error('Erreur lors de la récupération de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la filière' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la filière manquant' },
        { status: 400 }
      );
    }

    // Vérifier que la filière existe et appartient à l'école de l'utilisateur
    const existingFiliereById = await prisma.filiere.findUnique({
      where: { id }
    });

    if (!existingFiliereById) {
      return NextResponse.json({ error: 'Filière non trouvée' }, { status: 404 });
    }

    if (user.role !== 'SUPER_ADMIN' && existingFiliereById.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    if (!data.nom) {
      return NextResponse.json(
        { error: 'Le nom de la filière est requis' },
        { status: 400 }
      );
    }

    // Vérifier si le nom existe déjà DANS CETTE ÉCOLE (sauf pour la filière en cours)
    const existingFiliere = await prisma.filiere.findFirst({
      where: {
        nom: data.nom,
        schoolId: existingFiliereById.schoolId,
        id: { not: id }
      }
    });

    if (existingFiliere) {
      return NextResponse.json(
        { error: 'Une filière avec ce nom existe déjà dans votre établissement' },
        { status: 400 }
      );
    }

    const filiere = await prisma.filiere.update({
      where: { id },
      data: {
        nom: data.nom,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(filiere);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la filière' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la filière manquant' },
        { status: 400 }
      );
    }

    // Vérifier si la filière a des dépendances
    const filiereWithDependencies = await prisma.filiere.findUnique({
      where: { id },
      include: {
        modules: true,
        emplois: true,
        students: true
      }
    });

    if (!filiereWithDependencies) {
      return NextResponse.json(
        { error: 'Filière non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier l'accès par schoolId
    if (user.role !== 'SUPER_ADMIN' && filiereWithDependencies.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const hasModules = filiereWithDependencies.modules.length > 0;
    const hasEmplois = filiereWithDependencies.emplois.length > 0;
    const hasStudents = filiereWithDependencies.students.length > 0;

    // Si des étudiants sont associés, refuser la suppression
    if (hasStudents) {
      return NextResponse.json(
        { 
          error: `Impossible de supprimer: ${filiereWithDependencies.students.length} étudiant(s) sont inscrits dans cette filière. Réaffectez-les d'abord.`,
          studentsCount: filiereWithDependencies.students.length
        },
        { status: 400 }
      );
    }

    // Si des modules/emplois existent et cascade n'est pas demandé
    if ((hasModules || hasEmplois) && !cascade) {
      return NextResponse.json(
        { 
          error: `Cette filière a ${filiereWithDependencies.modules.length} module(s) et ${filiereWithDependencies.emplois.length} emploi(s) du temps associés. Utilisez ?cascade=true pour supprimer tout.`,
          modulesCount: filiereWithDependencies.modules.length,
          emploisCount: filiereWithDependencies.emplois.length,
          canCascade: true
        },
        { status: 400 }
      );
    }

    // Suppression en cascade si demandé
    if (cascade) {
      await prisma.$transaction(async (tx) => {
        // Supprimer les emplois du temps liés aux modules de cette filière
        await tx.emploiDuTemps.deleteMany({
          where: { filiereId: id }
        });
        
        // Supprimer les modules
        await tx.module.deleteMany({
          where: { filiereId: id }
        });
        
        // Supprimer la filière
        await tx.filiere.delete({
          where: { id }
        });
      });
    } else {
      await prisma.filiere.delete({
        where: { id }
      });
    }

    return NextResponse.json({
      message: 'Filière supprimée avec succès',
      cascade: cascade
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la filière' },
      { status: 500 }
    );
  }
}
