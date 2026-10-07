import { ChevronRightIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { settingsPath } from '@/app/paths'
import type { SettingsSectionId } from './sections'

interface HubLinkProps {
  to: SettingsSectionId
  Icon: LucideIcon
  title: string
  /** What the subsection is for, in a few words. */
  description: string
  /** A glance at what is inside: the companies with their lids, the tares with their weights. */
  children?: ReactNode
}

/** A row of the phone's settings hub leading to a subsection's screen. */
export function HubLink({ to, Icon, title, description, children }: HubLinkProps) {
  return (
    <Link
      to={settingsPath(to)}
      className="flex min-h-14 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60"
    >
      <Icon aria-hidden className="size-5 shrink-0 self-start text-muted-foreground mt-0.5" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
        {children}
      </span>
      <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
