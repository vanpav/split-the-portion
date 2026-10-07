import type { ReactNode } from 'react'
import { CommandGroup } from '@/components/ui/command'

interface DishSearchGroupProps {
  heading: ReactNode
  /** The number of rows, on the right of the heading (the category sections). */
  count?: number
  children: ReactNode
}

/** A titled section of a dish list: the heading is 0.75rem, muted, aligned with the rows' text. */
export function DishSearchGroup({ heading, count, children }: DishSearchGroupProps) {
  return (
    <CommandGroup
      heading={
        count === undefined ? (
          heading
        ) : (
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate">{heading}</span>
            <span className="tabular-nums">{count}</span>
          </span>
        )
      }
      className="px-0 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-3 **:[[cmdk-group-heading]]:pb-1"
    >
      {children}
    </CommandGroup>
  )
}
