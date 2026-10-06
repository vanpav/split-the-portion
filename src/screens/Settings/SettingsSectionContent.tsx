import { AccountSection } from './AccountSection'
import { AppearanceSection } from './AppearanceSection'
import { CompaniesSection } from './CompaniesSection'
import { DataSection } from './DataSection'
import { GroupSection } from './GroupSection'
import { HoldSection } from './HoldSection'
import { PresetsSection } from './PresetsSection'
import type { SettingsSectionId } from './sections'
import { TaresSection } from './TaresSection'

/** What a settings subsection shows. «Убрать человека» is about people, so it lives under the companies. */
export function SettingsSectionContent({ id }: { id: SettingsSectionId }) {
  switch (id) {
    case 'account':
      return <AccountSection />
    case 'group':
      return <GroupSection />
    case 'tares':
      return <TaresSection />
    case 'companies':
      return (
        <div className="flex flex-col gap-10">
          <CompaniesSection />
          <HoldSection />
        </div>
      )
    case 'presets':
      return <PresetsSection />
    case 'data':
      return <DataSection />
    case 'appearance':
      return <AppearanceSection />
  }
}
