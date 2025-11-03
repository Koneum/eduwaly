import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

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

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: email || `${student.studentNumber}@temp.edu`,
          password: hashedPassword,
          name: `${prenom} ${nom}`,
          role: 'STUDENT',
          schoolId: schoolId,
          isActive: true
        }
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

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: email || `parent-${parentId}@temp.edu`,
          password: hashedPassword,
          name: `${prenom} ${nom}`,
          role: 'PARENT',
          schoolId: schoolId,
          isActive: true
        }
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
