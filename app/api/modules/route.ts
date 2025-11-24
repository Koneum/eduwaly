import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

// Définir l'enum TypeModule pour correspondre au schéma Prisma
export enum TypeModule {
  CM = 'CM',
  TD = 'TD',
  CM_TD = 'CM_TD',
  TP = 'TP',
  PROJET = 'PROJET',
  STAGE = 'STAGE',
}

export async function GET() {
  try {
    // Récupérer l'utilisateur authentifié
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // ✅ OPTIMISÉ: Retirer emplois include, utiliser _count et select précis
    const modules = await prisma.module.findMany({
      where: {
        schoolId: user.schoolId || undefined
      },
      select: {
        id: true,
        nom: true,
        type: true,
        vh: true,
        semestre: true,
        isUeCommune: true,
        schoolId: true,
        filiereId: true,
        createdAt: true,
        updatedAt: true,
        filiere: {
          select: {
            id: true,
            nom: true
          }
        },
        _count: {
          select: {
            emplois: true,
            evaluations: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des modules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Vérifier les champs requis
    if (!data.nom || !data.vh || !data.schoolId) {
      return NextResponse.json(
        { error: 'Le nom, le volume horaire et l\'école sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si le module existe déjà dans la même filière
    const existingModule = await prisma.module.findFirst({
      where: {
        AND: [
          { nom: data.nom },
          { filiereId: data.filiereId || null }
        ]
      }
    });

    if (existingModule) {
      return NextResponse.json(
        { error: 'Ce module existe déjà dans cette filière' },
        { status: 400 }
      );
    }

    // Créer le nouveau module
    const createdModule = await prisma.module.create({
      data: {
        nom: data.nom,
        type: data.type || 'CM_TD',
        vh: data.vh,
        schoolId: data.schoolId,
        filiereId: data.filiereId || null,
        isUeCommune: data.isUeCommune || false,
        semestre: data.semestre || 'S1',
      },
      include: {
        filiere: true
      }
    });

    return NextResponse.json(createdModule);
  } catch (error) {
    console.error('Erreur lors de la création du module:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du module' },
      { status: 500 }
    );
  }
}
