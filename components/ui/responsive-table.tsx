"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-media-query"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
  mobileLabel?: string // Label à afficher sur mobile
  priority?: 'high' | 'medium' | 'low' // Priorité pour affichage mobile
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  emptyMessage?: string
  className?: string
}

/**
 * Table responsive qui se transforme en cards sur mobile
 * 
 * @example
 * ```tsx
 * <ResponsiveTable
 *   data={users}
 *   columns={[
 *     { header: "Nom", accessor: "name", priority: "high" },
 *     { header: "Email", accessor: "email", priority: "medium" },
 *     { header: "Rôle", accessor: "role", priority: "low" },
 *   ]}
 *   keyExtractor={(user) => user.id}
 *   actions={(user) => <Button>Modifier</Button>}
 * />
 * ```
 */
export function ResponsiveTable<T = any>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  actions,
  emptyMessage = "Aucune donnée disponible",
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  // Vue Desktop: Table classique
  if (!isMobile) {
    return (
      <div className={cn("rounded-md border overflow-x-auto", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {actions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, index) => (
                  <TableCell key={index} className={column.className}>
                    {typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : String(row[column.accessor] ?? '-')}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Vue Mobile: Cards
  // Filtrer les colonnes par priorité pour mobile
  const mobileColumns = columns.filter(
    (col) => !col.priority || col.priority === 'high' || col.priority === 'medium'
  )

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((row) => (
        <Card
          key={keyExtractor(row)}
          className={cn(
            "overflow-hidden",
            onRowClick && "cursor-pointer active:scale-98 transition-transform"
          )}
          onClick={() => onRowClick?.(row)}
        >
          <CardContent className="p-4">
            <div className="space-y-2">
              {mobileColumns.map((column, index) => {
                const value = typeof column.accessor === 'function'
                  ? column.accessor(row)
                  : String(row[column.accessor] ?? '-')

                return (
                  <div key={index} className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                      {column.mobileLabel || column.header}
                    </span>
                    <span className="text-sm text-right flex-1">
                      {value}
                    </span>
                  </div>
                )
              })}
            </div>

            {actions && (
              <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                {actions(row)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Variante: Liste mobile simple (sans cards)
 */
export function ResponsiveList<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  actions,
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()

  if (!isMobile) {
    return (
      <ResponsiveTable
        data={data}
        columns={columns}
        keyExtractor={keyExtractor}
        onRowClick={onRowClick}
        actions={actions}
        className={className}
      />
    )
  }

  return (
    <div className={cn("divide-y", className)}>
      {data.map((row) => (
        <div
          key={keyExtractor(row)}
          className={cn(
            "py-4 px-2",
            onRowClick && "cursor-pointer active:bg-muted"
          )}
          onClick={() => onRowClick?.(row)}
        >
          <div className="space-y-1">
            {columns.slice(0, 2).map((column, index) => {
              const value = typeof column.accessor === 'function'
                ? column.accessor(row)
                : String(row[column.accessor] ?? '-')

              return (
                <div key={index}>
                  {index === 0 ? (
                    <div className="font-medium">{value}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">{value}</div>
                  )}
                </div>
              )
            })}
          </div>

          {actions && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              {actions(row)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
