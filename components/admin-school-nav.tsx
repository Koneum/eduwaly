"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu,
  GraduationCap,
  Calendar,
  BookOpen,
  UserCog,
  CircleUser,
  Building2,
  Wallet,
  FileText,
  MessageSquare,
  Megaphone,
  Receipt,
  ClipboardList,
  FileBarChart
} from "lucide-react"
import { FaChartBar } from 'react-icons/fa';
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import NotificationCenter from "./notifications/NotificationCenter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminSchoolNavProps {
  schoolId: string
  schoolName: string
  schoolType?: 'UNIVERSITY' | 'HIGH_SCHOOL'
}

export function AdminSchoolNav({ schoolId, schoolName, schoolType = 'UNIVERSITY' }: AdminSchoolNavProps) {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const router = useRouter()

  const userInitials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    {
      title: "Dashboard",
      href: `/admin/${schoolId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Étudiants",
      href: `/admin/${schoolId}/students`,
      icon: Users,
    },
    {
      title: "Emplois du Temps",
      href: `/admin/${schoolId}/schedule`,
      icon: Calendar,
    },
    {
      title: schoolType === 'HIGH_SCHOOL' ? "Séries" : "Filières",
      href: `/admin/${schoolId}/filieres`,
      icon: GraduationCap,
    },
    {
      title: schoolType === 'HIGH_SCHOOL' ? "Matières" : "Modules",
      href: `/admin/${schoolId}/modules`,
      icon: BookOpen,
    },
    {
      title: schoolType === 'HIGH_SCHOOL' ? "Classes" : "Salles",
      href: `/admin/${schoolId}/rooms`,
      icon: Building2,
    },
    {
      title: "Enseignants",
      href: `/admin/${schoolId}/enseignants`,
      icon: UserCog,
    },
    {
      title: "Staff",
      href: `/admin/${schoolId}/staff`,
      icon: CircleUser,
    },
    {
      title: "Statistiques",
      href: `/admin/${schoolId}/statistiques`,
      icon: FaChartBar,
    },
    {
      title: "Rapports & Documents",
      href: `/admin/${schoolId}/reports`,
      icon: FileText,
    },
    {
      title: "Configuration Notation",
      href: `/admin/${schoolId}/settings/grading`, 
      icon: ClipboardList,
    },
    {
      title: "Bulletins de Notes",
      href: `/admin/${schoolId}/bulletins`,
      icon: FileBarChart,
    },
    {
      title: "Messages",
      href: `/admin/${schoolId}/messages`,
      icon: MessageSquare,
    },
    {
      title: "Annonces",
      href: `/admin/${schoolId}/announcements`,
      icon: Megaphone,
    },
    {
      title: "Finance & Scolarité",
      href: `/admin/${schoolId}/finance`,
      icon: DollarSign,
    },
    {
      title: "Prix & Bourses",
      href: `/admin/${schoolId}/finance-settings`,
      icon: CreditCard,
    },
    {
      title: "Templates de Reçu",
      href: `/admin/${schoolId}/receipt-templates`,
      icon: Receipt,
    },
    {
      title: "Abonnement",
      href: `/admin/${schoolId}/subscription`,
      icon: Wallet,
    },
    {
      title: "Paramètres",
      href: `/admin/${schoolId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <div className="flex items-center gap-3 h-16 px-6 border-b border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Admin'} />
            <AvatarFallback className="text-responsive-sm">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-lg font-bold text-foreground">Admin École</h1>
            <p className="text-responsive-xs text-muted-foreground truncate">{schoolName}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-responsive-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
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
          <Button onClick={handleSignOut} 
          variant="ghost" 
          className="w-full justify-start gap-3">
            <LogOut className="h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center px-4">
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
                <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Admin'} />
                <AvatarFallback className="text-responsive-sm">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-responsive-lg font-bold text-foreground">Admin École</h1>
                <p className="text-responsive-xs text-muted-foreground truncate">{schoolName}</p>
              </div>
            </div>
            <nav className="px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-12rem)]">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-responsive-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
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
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>
        <div className="ml-2 flex items-center gap-2 flex-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Admin'} />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-base font-bold text-foreground">Admin École</h1>
            <p className="text-responsive-xs text-muted-foreground truncate max-w-[140px] sm:max-w-[220px]">{schoolName}</p>
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
