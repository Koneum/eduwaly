import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Filtrer par schoolId de l'utilisateur (sauf SUPER_ADMIN qui voit tout)
    const whereClause = user.role === 'SUPER_ADMIN' 
      ? {} 
      : { schoolId: user.schoolId! };

    const filieres = await prisma.filiere.findMany({
      where: whereClause,
      select: {
        id: true,
        nom: true,
        schoolId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            modules: true,
            emplois: true,
            students: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    return NextResponse.json(filieres);
  } catch (error) {
    console.error('Erreur lors de la récupération des filières:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des filières' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    console.log('[FILIERES POST] Data reçue:', data);
    console.log('[FILIERES POST] User schoolId:', user.schoolId);

    // Utiliser le schoolId de l'utilisateur si non fourni
    const schoolId = data.schoolId || user.schoolId;

    if (!data.nom) {
      return NextResponse.json(
        { error: 'Le nom de la filière est requis' },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Aucune école associée à votre compte' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé à cette école' }, { status: 403 });
    }

    // Vérifier si la filière existe déjà DANS CETTE ÉCOLE
    const existingFiliere = await prisma.filiere.findFirst({
      where: {
        nom: data.nom,
        schoolId: schoolId
      }
    });

    if (existingFiliere) {
      console.log('[FILIERES POST] Filière existante trouvée:', existingFiliere);
      return NextResponse.json(
        { error: `La filière "${data.nom}" existe déjà dans votre établissement` },
        { status: 400 }
      );
    }

    const filiere = await prisma.filiere.create({
      data: {
        nom: data.nom,
        schoolId: schoolId,
      }
    });

    console.log('[FILIERES POST] Filière créée:', filiere);
    return NextResponse.json(filiere);
  } catch (error) {
    console.error('Erreur lors de la création de la filière:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la filière' },
      { status: 500 }
    );
  }
}
