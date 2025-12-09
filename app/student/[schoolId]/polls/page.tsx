'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Loader2,
  CheckCircle,
  Vote
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistance } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PollOption {
  id: string
  text: string
  order: number
  responseCount: number
  percentage: number
  isSelected: boolean
}

interface Poll {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date
  isAnonymous: boolean
  allowMultiple: boolean
  totalResponses: number
  hasVoted: boolean
  userVotes: string[]
  options: PollOption[]
}

export default function StudentPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [votingPollId, setVotingPollId] = useState<string | null>(null)

  const fetchPolls = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/polls')
      if (response.ok) {
        const data = await response.json()
        setPolls(data.polls || [])
        
        // Initialiser les sélections avec les votes existants
        const initialSelections: Record<string, string[]> = {}
        data.polls?.forEach((poll: Poll) => {
          if (poll.hasVoted) {
            initialSelections[poll.id] = poll.userVotes
          }
        })
        setSelectedOptions(initialSelections)
      }
    } catch (error) {
      console.error('Erreur chargement sondages:', error)
      toast.error('Erreur lors du chargement des sondages')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPolls()
  }, [])

  const handleVote = async (pollId: string) => {
    const options = selectedOptions[pollId]
    if (!options || options.length === 0) {
      toast.error('Veuillez sélectionner au moins une option')
      return
    }

    setVotingPollId(pollId)
    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          optionIds: options
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Vote enregistré !')
      fetchPolls()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du vote')
    } finally {
      setVotingPollId(null)
    }
  }

  const handleOptionChange = (pollId: string, optionId: string, allowMultiple: boolean) => {
    setSelectedOptions(prev => {
      if (allowMultiple) {
        const current = prev[pollId] || []
        if (current.includes(optionId)) {
          return { ...prev, [pollId]: current.filter(id => id !== optionId) }
        }
        return { ...prev, [pollId]: [...current, optionId] }
      } else {
        return { ...prev, [pollId]: [optionId] }
      }
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-responsive-h1 font-bold text-foreground">Sondages</h1>
        <p className="text-responsive-sm text-muted-foreground mt-2">
          Participez aux sondages de votre établissement
        </p>
      </div>

      {/* Liste des sondages */}
      {polls.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Vote className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun sondage disponible</h3>
            <p className="text-sm text-muted-foreground">
              Les sondages de votre établissement apparaîtront ici
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {polls.map((poll) => {
            const isVoting = votingPollId === poll.id
            const currentSelections = selectedOptions[poll.id] || []
            const canVote = !poll.hasVoted || poll.allowMultiple
            const timeRemaining = formatDistance(new Date(poll.endDate), new Date(), { 
              addSuffix: true, 
              locale: fr 
            })

            return (
              <Card key={poll.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-responsive-lg">{poll.title}</CardTitle>
                      {poll.description && (
                        <CardDescription className="mt-1 text-responsive-sm">
                          {poll.description}
                        </CardDescription>
                      )}
                    </div>
                    {poll.hasVoted && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Voté
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{poll.totalResponses} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Fin {timeRemaining}</span>
                    </div>
                    {poll.isAnonymous && (
                      <Badge variant="outline" className="text-xs">Anonyme</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Options de vote */}
                  {poll.allowMultiple ? (
                    // Choix multiples avec Checkbox
                    <div className="space-y-3">
                      {poll.options.map((option) => (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`${poll.id}-${option.id}`}
                              checked={currentSelections.includes(option.id)}
                              onCheckedChange={() => handleOptionChange(poll.id, option.id, true)}
                              disabled={poll.hasVoted && !poll.allowMultiple}
                            />
                            <Label 
                              htmlFor={`${poll.id}-${option.id}`}
                              className="flex-1 text-responsive-sm cursor-pointer"
                            >
                              {option.text}
                            </Label>
                            <span className="text-responsive-sm font-medium">
                              {option.percentage}%
                            </span>
                          </div>
                          <Progress value={option.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Choix unique avec RadioGroup
                    <RadioGroup
                      value={currentSelections[0] || ''}
                      onValueChange={(value) => handleOptionChange(poll.id, value, false)}
                      disabled={poll.hasVoted}
                    >
                      <div className="space-y-3">
                        {poll.options.map((option) => (
                          <div key={option.id} className="space-y-2">
                            <div className="flex items-center gap-3">
                              <RadioGroupItem
                                value={option.id}
                                id={`${poll.id}-${option.id}`}
                                disabled={poll.hasVoted}
                              />
                              <Label 
                                htmlFor={`${poll.id}-${option.id}`}
                                className="flex-1 text-responsive-sm cursor-pointer"
                              >
                                {option.text}
                              </Label>
                              <span className="text-responsive-sm font-medium">
                                {option.percentage}%
                              </span>
                            </div>
                            <Progress value={option.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Bouton de vote */}
                  {canVote && !poll.hasVoted && (
                    <Button
                      className="w-full"
                      onClick={() => handleVote(poll.id)}
                      disabled={isVoting || currentSelections.length === 0}
                    >
                      {isVoting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Vote en cours...
                        </>
                      ) : (
                        <>
                          <Vote className="h-4 w-4 mr-2" />
                          Voter
                        </>
                      )}
                    </Button>
                  )}

                  {poll.hasVoted && !poll.allowMultiple && (
                    <p className="text-center text-responsive-xs text-muted-foreground">
                      Vous avez déjà participé à ce sondage
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
