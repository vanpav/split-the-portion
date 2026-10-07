import { useState } from 'react'
import { TareForm } from '@/components/TareForm'
import type { Id } from '@/domain'
import { useAppStore } from '@/store/store'
import { TareRow } from './TareRow'

export function TaresSection() {
  const tares = useAppStore((s) => s.tares)
  // The row being edited; one at a time.
  const [openId, setOpenId] = useState<Id | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold max-md:sr-only">Тара</h2>
        <p className="text-sm text-muted-foreground">Вес пустой посуды — вычтем его сами.</p>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {tares.map((tare) => (
          <TareRow
            key={tare.id}
            tare={tare}
            open={openId === tare.id}
            onOpenChange={(open) => setOpenId(open ? tare.id : null)}
          />
        ))}
        {/* The same form as «Добавить тару» in the calculator; a new tare shows up as a row above it. */}
        <li className="flex flex-col gap-3 px-4 py-4">
          <h3 className="font-medium">Новая тара</h3>
          <TareForm />
        </li>
      </ul>
    </section>
  )
}
