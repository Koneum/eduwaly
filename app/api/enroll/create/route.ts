import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { 
      enrollmentId, 
      userType, 
      nom, 
      prenom, 
      email, 
      phone, 
      password,
      studentId,
      parentId,
      schoolId
    } = await request.json()

    // Valider les données requises
    if (!enrollmentId || !userType || !nom || !prenom || !password) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    if (userType === 'student') {
      // Vérifier que l'étudiant existe et n'est pas déjà enrôlé
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      })

      if (!student) {
        return NextResponse.json(
          { error: 'Étudiant non trouvé' },
          { status: 404 }
        )
      }

      if (student.userId) {
        return NextResponse.json(
          { error: 'Étudiant déjà enrôlé' },
          { status: 400 }
        )
      }

      // Créer l'utilisateur avec Better Auth (gère le hashing automatiquement)
      const userEmail = email || `${student.studentNumber}@temp.edu`
      
      // Utiliser l'API Better Auth pour créer le compte
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: userEmail,
          password: password,
          name: `${prenom} ${nom}`,
          role: 'STUDENT',
        }
      })

      if (!signUpResult || !signUpResult.user) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du compte' },
          { status: 500 }
        )
      }

      const user = signUpResult.user

      // Mettre à jour l'utilisateur avec schoolId
      await prisma.user.update({
        where: { id: user.id },
        data: { schoolId }
      })

      // Mettre à jour l'étudiant
      await prisma.student.update({
        where: { id: studentId },
        data: {
          userId: user.id,
          phone: phone || student.phone
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Compte créé avec succès',
        userId: user.id
      })
    } else if (userType === 'parent') {
      // Vérifier que le parent existe et n'est pas déjà enrôlé
      const parent = await prisma.parent.findUnique({
        where: { id: parentId }
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent non trouvé' },
          { status: 404 }
        )
      }

      if (parent.userId) {
        return NextResponse.json(
          { error: 'Parent déjà enrôlé' },
          { status: 400 }
        )
      }

      // Créer l'utilisateur avec Better Auth (gère le hashing automatiquement)
      const userEmail = email || `parent-${parentId}@temp.edu`
      
      // Utiliser l'API Better Auth pour créer le compte
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: userEmail,
          password: password,
          name: `${prenom} ${nom}`,
          role: 'PARENT',
        }
      })

      if (!signUpResult || !signUpResult.user) {
        return NextResponse.json(
          { error: 'Erreur lors de la création du compte' },
          { status: 500 }
        )
      }

      const user = signUpResult.user

      // Mettre à jour l'utilisateur avec schoolId
      await prisma.user.update({
        where: { id: user.id },
        data: { schoolId }
      })

      // Mettre à jour le parent
      await prisma.parent.update({
        where: { id: parentId },
        data: {
          userId: user.id,
          phone: phone || parent.phone
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Compte créé avec succès',
        userId: user.id
      })
    }

    return NextResponse.json(
      { error: 'Type d\'utilisateur invalide' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
