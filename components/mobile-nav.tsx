"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
}

interface MobileNavProps {
  items: NavItem[]
  logo?: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

/**
 * Navigation mobile avec menu burger et drawer latéral
 * 
 * @example
 * ```tsx
 * <MobileNav
 *   items={[
 *     { title: "Dashboard", href: "/dashboard", icon: <Home /> },
 *     { title: "Messages", href: "/messages", icon: <Mail />, badge: 3 },
 *   ]}
 *   logo={<Logo />}
 *   user={{ name: "John Doe", email: "john@example.com" }}
 * />
 * ```
 */
export function MobileNav({ items, logo, user }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between p-4 border-b lg:hidden">
        {/* Logo */}
        <div className="flex-1">{logo}</div>

        {/* Menu Burger */}
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header avec logo et bouton fermer */}
          <div className="flex items-center justify-between p-4 border-b">
            {logo}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {items.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Bottom navigation mobile (alternative au drawer)
 */
interface BottomNavProps {
  items: NavItem[]
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t lg:hidden z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span className="text-xs font-medium truncate max-w-full">
                {item.title}
              </span>
              {item.badge && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
