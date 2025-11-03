"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Calendar, Users, BookOpen, ClipboardList, LogOut, Menu, FileText, CheckSquare, FileBarChart, MessageSquare, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import NotificationCenter from "@/components/notifications/NotificationCenter"

interface TeacherNavProps {
  schoolId: string
  schoolName: string
}

export function TeacherNav({ schoolId, schoolName }: TeacherNavProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    {
      title: "Dashboard",
      href: `/teacher/${schoolId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Annonces",
      href: `/teacher/${schoolId}/announcements`,
      icon: Megaphone,
    },
    {
      title: "Emploi du Temps",
      href: `/teacher/${schoolId}/schedule`,
      icon: Calendar,
    },
    {
      title: "Mes Cours",
      href: `/teacher/${schoolId}/courses`,
      icon: BookOpen,
    },
    {
      title: "Devoirs",
      href: `/teacher/${schoolId}/homework-management`,
      icon: FileText,
    },
    {
      title: "Présences",
      href: `/teacher/${schoolId}/attendance-management`,
      icon: CheckSquare,
    },
    {
      title: "Mes Étudiants",
      href: `/teacher/${schoolId}/students`,
      icon: Users,
    },
    {
      title: "Notes & Évaluations",
      href: `/teacher/${schoolId}/grades`,
      icon: ClipboardList,
    },
    {
      title: "Rapports & Documents",
      href: `/teacher/${schoolId}/reports`,
      icon: FileBarChart,
    },
    {
      title: "Messages",
      href: `/teacher/${schoolId}/messages`,
      icon: MessageSquare,
    },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <div className="flex flex-col h-16 px-6 border-b border-border justify-center">
          <h1 className="text-xl font-bold text-foreground">Espace Enseignant</h1>
          <p className="text-xs text-muted-foreground truncate">{schoolName}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between px-4">
            <NotificationCenter />
            <ThemeToggle />
          </div>
          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start gap-3">
            <LogOut className="h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-16 px-6 border-b border-border justify-center">
                <h1 className="text-xl font-bold text-foreground">Espace Enseignant</h1>
                <p className="text-xs text-muted-foreground truncate">{schoolName}</p>
              </div>
              <nav className="px-4 py-6 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.title}
                    </Link>
                  )
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start gap-3">
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div>
            <h1 className="text-lg font-bold text-foreground">Espace Enseignant</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{schoolName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}
