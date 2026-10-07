/** Keeps a CSS animation's transform on the shape's own box, not on the whole drawing. */
const OWN_BOX = '[transform-box:fill-box] origin-center'
const drop = `${OWN_BOX} motion-safe:animate-box-drop`
const pop = 'motion-safe:animate-food-pop [transform-box:fill-box] origin-bottom'

/**
 * The logo (public/favicon.svg) coming together: three lunchboxes drop onto the stack one by one,
 * the food pops up in the open one, its lid leans against them. Drawn in the logo's own 100-unit grid.
 */
export function WelcomeBoxes() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="size-40">
      <rect width="100" height="100" rx="21.9" fill="var(--chart-foreground)" />
      <g transform="translate(1.54 17.7) scale(0.86)">
        {/* Bottom box and the lid on it, then the middle one, then the open one on top. */}
        <g className={`${drop} [animation-delay:100ms]`}>
          <rect x="25" y="66.5" width="50" height="11" rx="4" fill="var(--chart-3)" />
          <rect x="21.5" y="63" width="57" height="6.5" rx="3.25" fill="var(--logo-lid)" />
        </g>
        <g className={`${drop} [animation-delay:250ms]`}>
          <rect x="25" y="48.5" width="50" height="11" rx="4" fill="var(--chart-2)" />
          <rect x="21.5" y="45" width="57" height="6.5" rx="3.25" fill="var(--logo-lid)" />
        </g>
        <g className={`${pop} [animation-delay:700ms]`}>
          <circle cx="30.64" cy="30.01" r="5.94" fill="var(--chart-5)" />
          <circle cx="69.36" cy="30.01" r="5.94" fill="var(--chart-5)" />
          <circle cx="50" cy="29.02" r="7.92" fill="var(--chart-5)" />
        </g>
        <g className={`${pop} [animation-delay:800ms]`}>
          <rect x="-2.4" y="-17" width="4.8" height="17" rx="2.4" fill="var(--logo-carrot)" transform="translate(33.5 31) rotate(-26) scale(1.32)" />
          <rect x="-2.4" y="-17" width="4.8" height="17" rx="2.4" fill="var(--logo-carrot)" transform="translate(40.1 31) rotate(-10) scale(1.32)" />
        </g>
        <g className={`${pop} [animation-delay:900ms]`}>
          <g transform="translate(61 31) rotate(8) scale(1.43)" fill="var(--logo-leaf)">
            <path d="M-3.2 0L-2.2 -10H2.2L3.2 0Z" fill="var(--chart-3)" />
            <circle cx="-6.5" cy="-13" r="5.2" />
            <circle cx="6.5" cy="-13" r="5.2" />
            <circle cx="0" cy="-17.5" r="6.6" />
            <circle cx="-2.8" cy="-11.5" r="4.6" />
            <circle cx="3" cy="-11.5" r="4.6" />
          </g>
        </g>
        <g className={`${drop} [animation-delay:400ms]`}>
          <rect x="25" y="30" width="50" height="12" rx="4" fill="var(--chart-1)" />
        </g>
        {/* The open box's lid, leaning against the stack. */}
        <g className={`motion-safe:animate-lid-lean [transform-box:fill-box] origin-bottom [animation-delay:1100ms]`}>
          <rect x="-28.5" y="-3.5" width="57" height="7" rx="3.5" fill="var(--logo-lid)" transform="translate(82.8 49.25) rotate(79.6)" />
        </g>
      </g>
    </svg>
  )
}
