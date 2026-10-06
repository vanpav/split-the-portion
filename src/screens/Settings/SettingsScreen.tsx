import { ScreenHeader } from '@/components/ScreenHeader'
import { CompaniesSection } from './CompaniesSection'
import { DataSection } from './DataSection'
import { HoldSection } from './HoldSection'
import { TaresSection } from './TaresSection'

export function SettingsScreen() {
  return (
    <>
      <ScreenHeader title="Настройки" />
      {/* A phone stacks the lists; a desktop puts them side by side — tares are short, companies grow. */}
      <main className="mx-auto grid w-full max-w-2xl flex-1 grid-cols-[minmax(0,1fr)] content-start gap-10 p-4 lg:max-w-5xl lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-8 lg:py-8">
        <div className="flex flex-col gap-10">
          <TaresSection />
          <HoldSection />
          <DataSection />
        </div>
        <CompaniesSection />
      </main>
    </>
  )
}
