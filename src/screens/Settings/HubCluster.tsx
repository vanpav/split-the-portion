import type { ReactNode } from 'react'

/** A cluster of the phone's settings hub: a heading over one white box of rows, an optional footer under it. */
export function HubCluster({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">{children}</div>
      {footer}
    </section>
  )
}
