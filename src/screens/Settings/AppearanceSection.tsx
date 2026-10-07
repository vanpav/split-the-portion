import { HintsSetting } from './HintsSetting'
import { ThemeSetting } from './ThemeSetting'

/**
 * «Оформление»: the theme and the hints, both settings of this device (docs/UX.md «Настройки»).
 * On a phone the hub shows the same controls in place.
 */
export function AppearanceSection() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-semibold">Тема</h2>
          <p className="text-sm text-muted-foreground">Выбор хранится на этом устройстве.</p>
        </div>
        <ThemeSetting />
      </section>
      <div className="overflow-hidden rounded-xl border bg-card">
        <HintsSetting />
      </div>
    </div>
  )
}
