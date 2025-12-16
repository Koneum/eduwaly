import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// CORS headers for cross-origin requests from umdynastie.com
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  try {
    // Dates pour les calculs de période
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    const startOfSemester = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Récupérer les statistiques publiques d'Educwaly
    const [
      totalSchools,
      totalStudents,
      totalTeachers,
      totalParents,
      activeSubscriptions,
      // Inscriptions écoles par période
      schoolsThisMonth,
      schoolsThisQuarter,
      schoolsThisSemester,
      schoolsThisYear,
      // Inscriptions étudiants par période
      studentsThisMonth,
      studentsThisQuarter,
      studentsThisSemester,
      studentsThisYear,
      // Abonnements par période
      subscriptionsThisMonth,
      subscriptionsThisQuarter,
      subscriptionsThisSemester,
      subscriptionsThisYear,
      // Désabonnements
      cancelledSubscriptions,
      // Utilisateurs actifs (connexion dans les 30 derniers jours)
      activeTeachers,
      activeParents,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.student.count(),
      prisma.enseignant.count(),
      prisma.parent.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      // Inscriptions écoles par période
      prisma.school.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.school.count({ where: { createdAt: { gte: startOfQuarter } } }),
      prisma.school.count({ where: { createdAt: { gte: startOfSemester } } }),
      prisma.school.count({ where: { createdAt: { gte: startOfYear } } }),
      // Inscriptions étudiants par période
      prisma.student.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.student.count({ where: { createdAt: { gte: startOfQuarter } } }),
      prisma.student.count({ where: { createdAt: { gte: startOfSemester } } }),
      prisma.student.count({ where: { createdAt: { gte: startOfYear } } }),
      // Abonnements par période
      prisma.subscription.count({ where: { createdAt: { gte: startOfMonth }, status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { createdAt: { gte: startOfQuarter }, status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { createdAt: { gte: startOfSemester }, status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { createdAt: { gte: startOfYear }, status: 'ACTIVE' } }),
      // Désabonnements
      prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      // Utilisateurs actifs
      prisma.enseignant.count({ where: { updatedAt: { gte: last30Days } } }),
      prisma.parent.count({ where: { updatedAt: { gte: last30Days } } }),
    ])

    // Calculer le total des utilisateurs
    const totalUsers = totalStudents + totalTeachers + totalParents
    const activeUsers = activeTeachers + activeParents

    // Stats agrégées
    const stats = {
      app: 'educwaly',
      version: '3.0',
      updatedAt: new Date().toISOString(),
      metrics: {
        totalSchools,
        totalStudents,
        totalTeachers,
        totalParents,
        totalUsers,
        activeUsers,
        activeSubscriptions,
        // Inscriptions écoles par période
        schoolRegistrations: {
          month: schoolsThisMonth,
          quarter: schoolsThisQuarter,
          semester: schoolsThisSemester,
          year: schoolsThisYear,
        },
        // Inscriptions étudiants par période
        studentRegistrations: {
          month: studentsThisMonth,
          quarter: studentsThisQuarter,
          semester: studentsThisSemester,
          year: studentsThisYear,
        },
        // Abonnements par période
        newSubscriptions: {
          month: subscriptionsThisMonth,
          quarter: subscriptionsThisQuarter,
          semester: subscriptionsThisSemester,
          year: subscriptionsThisYear,
        },
        // Désabonnements
        cancelledSubscriptions,
      },
      status: 'operational'
    }

    return NextResponse.json(stats, { 
      headers: corsHeaders,
      status: 200 
    })

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques Educwaly:', error)
    return NextResponse.json(
      { 
        app: 'educwaly',
        error: 'Erreur lors du calcul des statistiques',
        status: 'error'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
