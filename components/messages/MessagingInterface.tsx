'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Send, 
  Search, 
  MessageSquare, 
  Plus,
  MoreVertical,
  Archive,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NewConversationDialog } from './NewConversationDialog'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string | null
  schoolName?: string | null
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  content: string
  createdAt: string
  isRead: boolean
}

interface Conversation {
  id: string
  subject?: string | null
  type: string
  otherUsers: User[]
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
}

interface MessagingInterfaceProps {
  currentUserId: string
  schoolId: string
  onNewConversation?: () => void
}

export default function MessagingInterface({ 
  currentUserId,
  schoolId,
  onNewConversation 
}: MessagingInterfaceProps) {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Charger les conversations
  useEffect(() => {
    loadConversations()
  }, [])

  // Ouvrir automatiquement une conversation si passée en paramètre
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (conversationId && conversations.length > 0) {
      const exists = conversations.find(c => c.id === conversationId)
      if (exists) {
        setSelectedConversation(conversationId)
      }
    }
  }, [searchParams, conversations])

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch(
        `/api/messages/conversations/${selectedConversation}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage })
        }
      )

      if (response.ok) {
        const message = await response.json()
        setMessages([...messages, message])
        setNewMessage('')
        loadConversations() // Rafraîchir la liste
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    }
  }

  const archiveConversation = async (conversationId: string) => {
    try {
      await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'DELETE'
      })
      loadConversations()
      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.otherUsers[0]
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-12rem)]">
      {/* Liste des conversations */}
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-responsive-lg">Messages</CardTitle>
            <NewConversationDialog 
              schoolId={schoolId}
              onConversationCreated={(convId) => {
                loadConversations()
                setSelectedConversation(convId)
              }}
            />
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-responsive-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-22rem)] sm:h-[calc(100vh-20rem)]">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-responsive-sm">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune conversation</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv) => {
                  const otherUser = conv.otherUsers[0]
                  const isSelected = selectedConversation === conv.id
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-background/30 dark:bg-primary/10 border-l-4 border-primary'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage src={otherUser?.avatar || undefined} />
                          <AvatarFallback>
                            {otherUser?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-responsive-base truncate">
                                {otherUser?.name || 'Utilisateur'} 
                              </h4>
                              <p className="text-responsive-xs text-muted-foreground truncate">{otherUser?.role}</p>
                              {otherUser?.schoolName && (
                                <p className="text-responsive-xs text-muted-foreground truncate">
                                  {otherUser.schoolName}
                                </p>
                                
                              )}
                            </div>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="text-responsive-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-responsive-sm text-foreground dark:text-foreground font-medium truncate">
                            {conv.lastMessage?.content || 'Aucun message'}
                          </p>
                          <p className="text-responsive-xs text-muted-foreground mt-1">
                            {conv.lastMessage?.createdAt &&
                              formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                                addSuffix: true,
                                locale: fr
                              })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Zone de conversation */}
      <Card className="md:col-span-2">
        {selectedConv ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConv.otherUsers[0]?.avatar || undefined} />
                    <AvatarFallback>
                      {selectedConv.otherUsers[0]?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-responsive-base">
                      {selectedConv.otherUsers[0]?.name || 'Utilisateur'}
                    </h3>
                    {selectedConv.otherUsers[0]?.schoolName && (
                      <p className="text-responsive-xs text-muted-foreground">
                        {selectedConv.otherUsers[0].schoolName}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => archiveConversation(selectedConv.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archiver
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-30rem)] sm:h-[calc(100vh-28rem)] p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-responsive-sm">
                    <p>Aucun message. Commencez la conversation !</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderId === currentUserId
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwn
                                ? 'bg-background dark:bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-responsive-xs font-semibold mb-1">
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-responsive-sm whitespace-pre-wrap">{message.content}</p>
                            <p
                              className={`text-responsive-xs mt-1 ${
                                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {formatDistanceToNow(new Date(message.createdAt), {
                                addSuffix: true,
                                locale: fr
                              })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              <div className="border-t p-3 sm:p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="text-responsive-sm"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
