'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  DollarSign,
  GraduationCap,
  AlertTriangle,
  BookOpen,
  Megaphone,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER'
  category: 'MESSAGE' | 'PAYMENT' | 'GRADE' | 'ABSENCE' | 'HOMEWORK' | 'ANNOUNCEMENT' | 'SYSTEM' | 'OTHER'
  isRead: boolean
  actionUrl?: string | null
  actionLabel?: string | null
  createdAt: string
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'MESSAGE':
      return <MessageSquare className="h-4 w-4" />
    case 'PAYMENT':
      return <DollarSign className="h-4 w-4" />
    case 'GRADE':
      return <GraduationCap className="h-4 w-4" />
    case 'ABSENCE':
      return <AlertTriangle className="h-4 w-4" />
    case 'HOMEWORK':
      return <BookOpen className="h-4 w-4" />
    case 'ANNOUNCEMENT':
      return <Megaphone className="h-4 w-4" />
    case 'SYSTEM':
      return <Settings className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'SUCCESS':
      return 'text-success bg-green-50 dark:bg-green-950'
    case 'WARNING':
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    case 'ERROR':
      return 'text-red-600 bg-red-50 dark:bg-red-950'
    case 'REMINDER':
      return 'text-[var(--link)] bg-blue-50 dark:bg-blue-950'
    default:
      return 'text-muted-foreground bg-background dark:bg-gray-950'
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    }
  }, [])

  useEffect(() => {
    // Schedule initial load asynchronously to avoid synchronous setState inside effect
    const timeout = setTimeout(() => {
      void loadNotifications()
    }, 0)
    // Polling toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [loadNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })
      loadNotifications()
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })
      loadNotifications()
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?ids=${notificationId}`, {
        method: 'DELETE'
      })
      loadNotifications()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    // Ne rediriger que si actionUrl est valide et non vide
    if (notification.actionUrl && notification.actionUrl.trim() !== '') {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[95vw] sm:w-96 p-0">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h3 className="font-semibold text-responsive-base">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-responsive-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[60vh] sm:h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-responsive-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 transition-colors ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  } ${
                    notification.actionUrl ? 'hover:bg-accent cursor-pointer' : ''
                  }`}
                  onClick={() => notification.actionUrl && handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      {getCategoryIcon(notification.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-responsive-sm">{notification.title}</h4>
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-primary rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-responsive-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-responsive-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </p>
                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="h-7 px-2"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
