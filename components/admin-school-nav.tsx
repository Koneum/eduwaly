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
  AlertTriangle,
  Megaphone
} from "lucide-react"
import { FaChartBar } from 'react-icons/fa';
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import NotificationCenter from "./notifications/NotificationCenter"

interface AdminSchoolNavProps {
  schoolId: string
  schoolName: string
  schoolType?: 'UNIVERSITY' | 'HIGH_SCHOOL'
}

export function AdminSchoolNav({ schoolId, schoolName, schoolType = 'UNIVERSITY' }: AdminSchoolNavProps) {
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
      href: `/admin/${schoolId}/emploi`,
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
        <div className="flex flex-col h-16 px-6 border-b border-border justify-center">
          <h1 className="text-xl font-bold text-foreground">Admin École</h1>
          <p className="text-xs text-muted-foreground truncate">{schoolName}</p>
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
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-16 px-6 border-b border-border justify-center">
              <h1 className="text-xl font-bold text-foreground">Admin École</h1>
              <p className="text-xs text-muted-foreground truncate">{schoolName}</p>
            </div>
            <nav className="px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]">
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
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>
        <div className="ml-4 flex-1">
          <h1 className="text-lg font-bold text-foreground">Admin École</h1>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{schoolName}</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}
