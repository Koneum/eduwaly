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
    // Récupérer les statistiques publiques d'Educwaly
    const [
      totalSchools,
      totalStudents,
      totalTeachers,
      totalParents,
      activeSubscriptions
    ] = await Promise.all([
      prisma.school.count(),
      prisma.student.count(),
      prisma.enseignant.count(),
      prisma.parent.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } })
    ])

    // Calculer le total des utilisateurs
    const totalUsers = totalStudents + totalTeachers + totalParents

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
        activeSubscriptions,
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
