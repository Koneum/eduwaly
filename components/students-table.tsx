"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Student {
  id: string
  name: string
  class: string
  paymentStatus: "paid" | "pending" | "late"
  amount: number
  lastPayment: string
  phone: string
}

const students: Student[] = [
  {
    id: "1",
    name: "Amadou Diallo",
    class: "Terminale S",
    paymentStatus: "paid",
    amount: 15000,
    lastPayment: "2025-10-01",
    phone: "+221 77 123 4567",
  },
  {
    id: "2",
    name: "Fatou Sow",
    class: "Première L",
    paymentStatus: "paid",
    amount: 12000,
    lastPayment: "2025-10-05",
    phone: "+221 76 234 5678",
  },
  {
    id: "3",
    name: "Moussa Ndiaye",
    class: "Seconde",
    paymentStatus: "late",
    amount: 10000,
    lastPayment: "2025-08-15",
    phone: "+221 78 345 6789",
  },
  {
    id: "4",
    name: "Aïssatou Ba",
    class: "Terminale ES",
    paymentStatus: "pending",
    amount: 15000,
    lastPayment: "2025-09-01",
    phone: "+221 77 456 7890",
  },
  {
    id: "5",
    name: "Ibrahima Fall",
    class: "Première S",
    paymentStatus: "paid",
    amount: 12000,
    lastPayment: "2025-10-10",
    phone: "+221 76 567 8901",
  },
]

export function StudentsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.class.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || student.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Statut de paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="paid">À jour</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="late">En retard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Dernier paiement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">{student.class}</TableCell>
                  <TableCell className="text-muted-foreground">{student.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.paymentStatus === "paid"
                          ? "default"
                          : student.paymentStatus === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {student.paymentStatus === "paid"
                        ? "À jour"
                        : student.paymentStatus === "pending"
                          ? "En attente"
                          : "En retard"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{student.amount.toLocaleString()} FCFA</TableCell>
                  <TableCell className="text-muted-foreground">{student.lastPayment}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Voir profil</DropdownMenuItem>
                        <DropdownMenuItem>Enregistrer paiement</DropdownMenuItem>
                        <DropdownMenuItem>Appliquer bourse</DropdownMenuItem>
                        <DropdownMenuItem>Envoyer rappel</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
