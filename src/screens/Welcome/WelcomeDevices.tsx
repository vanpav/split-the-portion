/** A phone with the logo's stack of lunchboxes on its screen. */
const phone = (x: number) => (
  <g transform={`translate(${x} 14)`}>
    <rect width="44" height="72" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
    <rect x="10" y="24" width="24" height="7" rx="2.5" fill="var(--chart-1)" />
    <rect x="10" y="34" width="24" height="7" rx="2.5" fill="var(--chart-2)" />
    <rect x="10" y="44" width="24" height="7" rx="2.5" fill="var(--chart-3)" />
  </g>
)

/**
 * The account: the same lunchboxes on two phones, kept in step through the account between them —
 * the dashes run toward both phones.
 */
export function WelcomeDevices() {
  return (
    <svg viewBox="0 0 200 100" aria-hidden className="h-36 w-72">
      <g fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round">
        <path d="M86 50H64" className="motion-safe:animate-sync-dash" />
        <path d="M114 50H136" className="motion-safe:animate-sync-dash" />
      </g>
      {phone(18)}
      {phone(138)}
      {/* The cloud (lucide «cloud»), in the middle. */}
      <g transform="translate(86 36) scale(1.17)" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </g>
    </svg>
  )
}
