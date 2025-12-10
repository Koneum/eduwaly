'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronDown, LucideIcon } from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  title: string
  icon: LucideIcon
  items: NavItem[]
  defaultOpen?: boolean
}

interface NavAccordionProps {
  groups: NavGroup[]
  pathname: string
  className?: string
}

interface NavAccordionGroupProps {
  group: NavGroup
  pathname: string
  isExpanded: boolean
  onToggle: () => void
}

function NavAccordionGroup({ group, pathname, isExpanded, onToggle }: NavAccordionGroupProps) {
  const Icon = group.icon
  const hasActiveItem = group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))

  return (
    <div className="space-y-1">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-responsive-sm font-medium transition-colors",
          hasActiveItem
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <span>{group.title}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Group Items */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pl-4 space-y-1">
          {group.items.map((item) => {
            const ItemIcon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-responsive-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <ItemIcon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function NavAccordion({ groups, pathname, className }: NavAccordionProps) {
  // Initialize expanded state based on defaultOpen and active items
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    groups.forEach(group => {
      if (group.defaultOpen) {
        initial.add(group.title)
      }
      // Also expand groups that have an active item
      if (group.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))) {
        initial.add(group.title)
      }
    })
    return initial
  })

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      {groups.map((group) => (
        <NavAccordionGroup
          key={group.title}
          group={group}
          pathname={pathname}
          isExpanded={expandedGroups.has(group.title)}
          onToggle={() => toggleGroup(group.title)}
        />
      ))}
    </div>
  )
}

// Simple nav items (non-grouped)
interface NavSimpleItemProps {
  item: NavItem
  pathname: string
}

export function NavSimpleItem({ item, pathname }: NavSimpleItemProps) {
  const Icon = item.icon
  const isActive = pathname === item.href

  return (
    <Link
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
}
