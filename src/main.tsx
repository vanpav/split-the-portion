import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { openStartData, refreshGroups, resumeSync } from '@/sync/session'
import { accountReady, useAccountStore } from '@/store/account'
import { askPersistentStorage } from '@/store/idbStorage'
import { prefsReady } from '@/store/prefs'
import { useAppStore } from '@/store/store'
import './index.css'

// Data lives in IndexedDB and is read asynchronously: render once it is in, so nothing typed
// meanwhile can overwrite it. A few milliseconds; the page is blank until then.
void Promise.all([useAppStore.ready, accountReady, prefsReady]).then(async () => {
  askPersistentStorage()
  // Signed in: the default group's data, also offline (docs/ARCHITECTURE.md §10).
  await openStartData()
  // Still signed in? Offline the cached account stays; with nobody signed in there is nothing to ask.
  if (useAccountStore.getState().me) {
    void refreshGroups()
    resumeSync()
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {/* Light or dark follows the phone's setting: `.dark` on <html> (docs/ARCHITECTURE.md §6).
          Its inline script is for server rendering; here it never runs, so it is marked as data
          and React does not warn about it. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        scriptProps={{ type: 'application/json' }}
      >
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>,
  )
})
