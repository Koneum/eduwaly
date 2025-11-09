"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, School, CreditCard, Bell, LogOut, Menu, BarChart3, MessageSquare, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  {
    title: "Dashboard",
    href: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    title: "Écoles",
    href: "/super-admin/schools",
    icon: School,
  },
  {
    title: "Abonnements",
    href: "/super-admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    href: "/super-admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Messages",
    href: "/super-admin/messages",
    icon: MessageSquare,
  },
  {
    title: "Annonces",
    href: "/super-admin/announcements",
    icon: Megaphone,
  },
  {
    title: "Notifications & Signalements",
    href: "/super-admin/notifications",
    icon: Bell,
  },
]

export function SuperAdminNav() {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const router = useRouter()

  const userInitials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SA'

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <div className="flex items-center gap-3 h-16 px-6 border-b border-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Super Admin'} />
            <AvatarFallback className="text-responsive-sm">{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-responsive-lg font-bold text-foreground">Super Admin</h1>
          </div>
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
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-responsive-sm font-medium transition-colors",
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
            <span className="text-responsive-sm text-muted-foreground">Thème</span>
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
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="flex items-center gap-3 h-16 px-6 border-b border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Super Admin'} />
                  <AvatarFallback className="text-responsive-sm">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-responsive-lg font-bold text-foreground">Super Admin</h1>
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
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'Super Admin'} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
            <h1 className="text-responsive-base font-bold text-foreground">Super Admin</h1>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </>
  )
}
