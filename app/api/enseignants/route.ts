import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-utils';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    // Récupérer l'utilisateur authentifié
    const user = await getAuthUser();
    if (!user || !user.schoolId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const enseignants = await prisma.enseignant.findMany({
      where: {
        schoolId: user.schoolId
      },
      include: {
        emplois: {
          include: {
            module: {
              include: {
                filiere: true
              }
            }
          },
          orderBy: {
            dateDebut: 'asc'
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    const formattedEnseignants = enseignants.map(enseignant => ({
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      titre: enseignant.titre,
      grade: enseignant.grade,
      type: enseignant.type,
      email: enseignant.email,
      telephone: enseignant.telephone,
      emplois: enseignant.emplois.map(emploi => ({
        id: emploi.id,
        dateDebut: emploi.dateDebut,
        dateFin: emploi.dateFin,
        vh: emploi.vh,
        module: {
          id: emploi.module.id,
          nom: emploi.module.nom,
          type: emploi.module.type,
          filiere: emploi.module.filiere ? {
            nom: emploi.module.filiere.nom
          } : null
        }
      }))
    }));

    return NextResponse.json(formattedEnseignants);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des données' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Récupérer l'utilisateur authentifié
    const user = await getAuthUser();
    if (!user || !user.schoolId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 Données reçues:', body);
    const { nom, prenom, titre, telephone, email, type, grade } = body;

    // Validation des données
    if (!nom || !prenom || !titre || !telephone || !email || !type || !grade) {
      console.log('❌ Champs manquants:', { nom, prenom, titre, telephone, email, type, grade });
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'email est unique pour cette école
    const existingEnseignant = await prisma.enseignant.findUnique({
      where: { 
        email_schoolId: {
          email,
          schoolId: user.schoolId
        }
      },
    });

    if (existingEnseignant) {
      console.log('❌ Email déjà existant:', email);
      return NextResponse.json(
        { error: 'Un enseignant avec cet email existe déjà' },
        { status: 400 }
      );
    }

    console.log('✅ Création du compte utilisateur...');
    // Créer le compte utilisateur avec BetterAuth
    const newUser = await auth.api.signUpEmail({
      body: {
        email,
        password: 'password123', // Mot de passe par défaut
        name: `${prenom} ${nom}`,
      },
    });

    if (!newUser) {
      throw new Error('Erreur lors de la création du compte utilisateur');
    }

    console.log('✅ Compte créé, mise à jour du rôle et schoolId...');
    // Mettre à jour le rôle et le schoolId de l'utilisateur
    await prisma.user.update({
      where: { id: newUser.user.id },
      data: {
        role: 'TEACHER',
        schoolId: user.schoolId,
      },
    });

    console.log('✅ Création de l\'enseignant...');
    const enseignant = await prisma.enseignant.create({
      data: {
        nom,
        prenom,
        titre,
        telephone,
        email,
        type,
        grade,
        schoolId: user.schoolId,
        userId: newUser.user.id, // Lier au compte utilisateur
      },
    });

    console.log('✅ Enseignant créé avec succès:', enseignant.id);
    return NextResponse.json({
      ...enseignant,
      defaultPassword: 'password123', // Retourner le mot de passe par défaut pour l'afficher à l'admin
    });
  } catch (error) {
    console.error('❌ Error creating enseignant:', error);
    // Log plus détaillé de l'erreur
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error creating enseignant' },
      { status: 500 }
    );
  }
}
