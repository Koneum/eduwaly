"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Calendar, BookOpen, DollarSign, LogOut, Menu, GraduationCap, UserX, MessageSquare, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import NotificationCenter from "@/components/notifications/NotificationCenter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StudentNavProps {
  schoolId: string
  schoolName: string
  isEnrolled: boolean
}

export function StudentNav({ schoolId, schoolName, isEnrolled }: StudentNavProps) {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const router = useRouter()

  const userInitials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ET'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    {
      title: "Dashboard",
      href: `/student/${schoolId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Emploi du Temps",
      href: `/student/${schoolId}/schedule`,
      icon: Calendar,
    },
    {
      title: "Mes Cours",
      href: `/student/${schoolId}/courses`,
      icon: BookOpen,
    },
    {
      title: "Mes Notes",
      href: `/student/${schoolId}/grades`,
      icon: GraduationCap,
    },
    {
      title: "Absences",
      href: `/student/${schoolId}/absences`,
      icon: UserX,
    },
    {
      title: "Devoirs",
      href: `/student/${schoolId}/homework`,
      icon: ClipboardList,
    },
    {
      title: "Messages",
      href: `/student/${schoolId}/messages`,
      icon: MessageSquare,
    },
    {
      title: "Scolarité",
      href: `/student/${schoolId}/payments`,
      icon: DollarSign,
    },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border pt-4">
        <div className="flex items-center gap-3 px-6 pb-3 border-b border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Étudiant'} />
            <AvatarFallback className="text-responsive-sm">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-lg font-bold text-foreground">Espace Étudiant</h1>
            <p className="text-responsive-xs text-muted-foreground truncate">{schoolName}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isPaymentsItem = item.href.endsWith('/payments')
            const isDisabled = !isEnrolled && !isPaymentsItem
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-responsive-sm font-medium transition-colors",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed pointer-events-none text-muted-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-disabled={isDisabled}
              >
                <Icon className="icon-responsive" />
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
                <Menu className="icon-responsive-lg" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="flex items-center gap-3 h-16 px-6 border-b border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Étudiant'} />
                  <AvatarFallback className="text-responsive-sm">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-responsive-lg font-bold text-foreground">Espace Étudiant</h1>
                  <p className="text-responsive-xs text-muted-foreground truncate">{schoolName}</p>
                </div>
              </div>
              <nav className="px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-12rem)]">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  const isPaymentsItem = item.href.endsWith('/payments')
                  const isDisabled = !isEnrolled && !isPaymentsItem
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-responsive-sm font-medium transition-colors",
                        isDisabled
                          ? "opacity-50 cursor-not-allowed pointer-events-none text-muted-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                      aria-disabled={isDisabled}
                    >
                      <Icon className="icon-responsive" />
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
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Étudiant'} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-responsive-base font-bold text-foreground">Espace Étudiant</h1>
              <p className="text-responsive-xs text-muted-foreground truncate max-w-[140px] sm:max-w-[220px]">{schoolName}</p>
            </div>
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
