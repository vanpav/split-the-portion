import { useState } from 'react'
import type { Id } from '@/domain'
import { useAppStore } from '@/store/store'
import { NewTareForm } from './NewTareForm'
import { TareRow } from './TareRow'

export function TaresSection() {
  const tares = useAppStore((s) => s.tares)
  // The row being edited; one at a time.
  const [openId, setOpenId] = useState<Id | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold">Тара</h2>
        <p className="text-sm text-muted-foreground">Вес пустой посуды — вычтем его сами.</p>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border">
        {tares.map((tare) => (
          <TareRow
            key={tare.id}
            tare={tare}
            open={openId === tare.id}
            onOpenChange={(open) => setOpenId(open ? tare.id : null)}
          />
        ))}
        <li className="px-4 py-3">
          <NewTareForm />
        </li>
      </ul>
    </section>
  )
}
