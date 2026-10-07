import type { ReactNode } from 'react'
import { CommandGroup } from '@/components/ui/command'

/** A titled section of a dish list: the heading is 0.75rem, muted, aligned with the rows' text. */
export function DishSearchGroup({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <CommandGroup
      heading={heading}
      className="px-0 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-3 **:[[cmdk-group-heading]]:pb-1"
    >
      {children}
    </CommandGroup>
  )
}
