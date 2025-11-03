"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, School, CreditCard, Bell, LogOut, Menu, BarChart3, MessageSquare, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

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
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <div className="flex items-center h-16 px-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
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
            <span className="text-sm text-muted-foreground">Thème</span>
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
              <div className="flex items-center h-16 px-6 border-b border-border">
                <h1 className="text-xl font-bold text-foreground">Super Admin</h1>
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
          <h1 className="text-lg font-bold text-foreground">Super Admin</h1>
        </div>
        <ThemeToggle />
      </div>
    </>
  )
}
