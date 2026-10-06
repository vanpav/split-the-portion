import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { askPersistentStorage } from '@/store/idbStorage'
import { useAppStore } from '@/store/store'
import './index.css'

// Data lives in IndexedDB and is read asynchronously: render once it is in, so nothing typed
// meanwhile can overwrite it. A few milliseconds; the page is blank until then.
void useAppStore.ready.then(() => {
  askPersistentStorage()
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
