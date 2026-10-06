import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The screen's main action. On a phone it sticks to the bottom, under the thumb, so it must be
 * the last child; from `lg` it is an ordinary row, and `className` may move it up with `order`.
 */
export function BottomBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-4 mt-auto flex gap-2 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
