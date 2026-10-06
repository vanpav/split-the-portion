import { useSearchParams } from 'react-router'
import { LIST_TAB_PARAM } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import type { CookingKind } from '@/domain'
import { useAppStore } from '@/store/store'
import { DishKindList } from './DishKindList'
import { OpenGroupLink } from './OpenGroupLink'

/** Simple or composite dishes; which one is chosen in the tab bar and kept in the URL. */
export function DishListScreen() {
  const dishes = useAppStore((s) => s.dishes)
  const [params] = useSearchParams()
  const kind: CookingKind = params.get(LIST_TAB_PARAM) === 'composite' ? 'composite' : 'simple'
  const ofKind = [...dishes].filter((d) => d.kind === kind).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <>
      <ScreenHeader title={kind === 'simple' ? 'Простые блюда' : 'Составные блюда'} action={<OpenGroupLink />} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <DishKindList kind={kind} dishes={ofKind} />
      </main>
    </>
  )
}
