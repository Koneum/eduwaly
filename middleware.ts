import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Routes publiques
  const publicRoutes = ["/login", "/register", "/unauthorized", "/enroll", "/api/auth"]
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Vérifier la session via cookie
  const sessionToken = request.cookies.get("schooly.session_token")?.value

  if (!sessionToken) {
    // Pas de session, rediriger vers login
    if (path !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  // Récupérer les infos de session depuis l'API Better Auth
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: {
        cookie: `schooly.session_token=${sessionToken}`,
      },
    })

    if (!sessionResponse.ok) {
      // Session invalide
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const { user } = await sessionResponse.json()

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const role = user.role as string
    const schoolId = user.schoolId as string | null

    // Si connecté et sur /login ou /, rediriger vers le dashboard approprié
    if (path === "/login" || path === "/") {
      let dashboardUrl = "/"
      
      switch (role) {
        case "SUPER_ADMIN":
          dashboardUrl = "/super-admin"
          break
        case "SCHOOL_ADMIN":
        case "MANAGER":
        case "PERSONNEL":
        case "ASSISTANT":
        case "SECRETARY":
          dashboardUrl = `/admin/${schoolId}`
          break
        case "TEACHER":
          dashboardUrl = `/teacher/${schoolId}`
          break
        case "STUDENT":
          dashboardUrl = `/student/${schoolId}`
          break
        case "PARENT":
          dashboardUrl = `/parent/${schoolId}`
          break
      }
      
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // Protection des routes Super-Admin
    if (path.startsWith("/super-admin")) {
      if (role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      return NextResponse.next()
    }

    // Protection des routes Admin-School
    if (path.startsWith("/admin/")) {
      const pathSchoolId = path.split("/")[2]
      
      if (role === "SUPER_ADMIN") {
        return NextResponse.next()
      }
      
      // Autoriser les rôles de personnel à accéder au dashboard admin
      const allowedRoles = ["SCHOOL_ADMIN", "MANAGER", "PERSONNEL", "ASSISTANT", "SECRETARY"]
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      if (schoolId !== pathSchoolId) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      return NextResponse.next()
    }

    // Protection des routes Teacher
    if (path.startsWith("/teacher/")) {
      const pathSchoolId = path.split("/")[2]
      
      if (role !== "TEACHER" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      if (role === "TEACHER" && schoolId !== pathSchoolId) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      return NextResponse.next()
    }

    // Protection des routes Student
    if (path.startsWith("/student/")) {
      const pathSchoolId = path.split("/")[2]
      
      if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      if (role === "STUDENT" && schoolId !== pathSchoolId) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      return NextResponse.next()
    }

    // Protection des routes Parent
    if (path.startsWith("/parent/")) {
      const pathSchoolId = path.split("/")[2]
      
      if (role !== "PARENT" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      if (role === "PARENT" && schoolId !== pathSchoolId) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      
      return NextResponse.next()
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/super-admin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
  ],
}
