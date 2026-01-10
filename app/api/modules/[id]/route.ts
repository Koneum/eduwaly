import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du module manquant' },
        { status: 400 }
      );
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { id },
      include: {
        filiere: true,
        emplois: {
          include: {
            enseignant: true,
            anneeUniv: true
          }
        }
      }
    });

    if (!moduleRecord) {
      return NextResponse.json(
        { error: 'Module non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier l'accès par schoolId
    if (user.role !== 'SUPER_ADMIN' && moduleRecord.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    return NextResponse.json(moduleRecord);
  } catch (error) {
    console.error('Erreur lors de la récupération du module:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du module' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID du module manquant' },
        { status: 400 }
      );
    }

    // Vérifier que le module existe et appartient à l'école de l'utilisateur
    const existingModuleById = await prisma.module.findUnique({
      where: { id }
    });

    if (!existingModuleById) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    if (user.role !== 'SUPER_ADMIN' && existingModuleById.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Vérifier les champs requis
    if (!data.nom || !data.type || !data.vh) {
      return NextResponse.json(
        { error: 'Le nom, le type et le volume horaire sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si le nom existe déjà DANS CETTE ÉCOLE et filière
    const existingModule = await prisma.module.findFirst({
      where: {
        nom: data.nom,
        schoolId: existingModuleById.schoolId,
        filiereId: data.filiereId || null,
        id: { not: id }
      }
    });

    if (existingModule) {
      return NextResponse.json(
        { error: 'Un module avec ce nom existe déjà dans cette filière' },
        { status: 400 }
      );
    }

    const updatedModule = await prisma.module.update({
      where: { id },
      data: {
        nom: data.nom,
        type: data.type,
        vh: data.vh,
        filiereId: data.filiereId || null,
        isUeCommune: data.isUeCommune || false,
        updatedAt: new Date()
      },
      include: {
        filiere: true
      }
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du module:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du module' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du module manquant' },
        { status: 400 }
      );
    }

    // Vérifier si le module existe et a des emplois du temps associés
    const moduleWithEmplois = await prisma.module.findUnique({
      where: { id },
      include: {
        emplois: true
      }
    });

    if (!moduleWithEmplois) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    // Vérifier l'accès par schoolId
    if (user.role !== 'SUPER_ADMIN' && moduleWithEmplois.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    if (moduleWithEmplois.emplois.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un module qui a des emplois du temps associés' },
        { status: 400 }
      );
    }

    await prisma.module.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Module supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du module:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du module' },
      { status: 500 }
    );
  }
}
