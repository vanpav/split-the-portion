import { useEffect } from 'react'
import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * A new version of the app waits for «Обновить» (docs/roadmap/11-pwa.md): a silent reload
 * could drop numbers being typed at the stove. Renders nothing; the prompt is a toast.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // A home-screen app is resumed rather than reloaded, so it looks for a new version each
      // time it comes back to the screen. Offline the check fails quietly.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => undefined)
      })
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast('Есть новая версия', {
      id: 'app-update',
      duration: Infinity,
      action: { label: 'Обновить', onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
