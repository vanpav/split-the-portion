import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

/** A finished phase: one summary line, expands to edit (docs/UX.md, «Перевзвешивание»). */
export function PastPhase({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Collapsible className="group/phase flex flex-col gap-3">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="h-auto min-h-11 w-full justify-between px-2 text-left font-normal whitespace-normal">
          <span className="min-w-0">{label}</span>
          <ChevronRightIcon className="transition-transform group-data-[state=open]/phase:rotate-90" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4 border-l pl-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}
