/**
 * Each person's lid color (`--chart-1..10`), by their place in today's lineup; after ten the colors
 * repeat. Literal class names: Tailwind only generates what it finds in the source.
 */
const FILL = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'bg-chart-6',
  'bg-chart-7',
  'bg-chart-8',
  'bg-chart-9',
  'bg-chart-10',
] as const
/**
 * An own portion: the same lid, paler (light) or as an outline (dark), with its text color — fixed in grams,
 * not taking part in the split (`--chart-N-pale` in index.css).
 */
const PALE = [
  'bg-chart-1-pale text-chart-1-pale-foreground',
  'bg-chart-2-pale text-chart-2-pale-foreground',
  'bg-chart-3-pale text-chart-3-pale-foreground',
  'bg-chart-4-pale text-chart-4-pale-foreground',
  'bg-chart-5-pale text-chart-5-pale-foreground',
  'bg-chart-6-pale text-chart-6-pale-foreground',
  'bg-chart-7-pale text-chart-7-pale-foreground',
  'bg-chart-8-pale text-chart-8-pale-foreground',
  'bg-chart-9-pale text-chart-9-pale-foreground',
  'bg-chart-10-pale text-chart-10-pale-foreground',
] as const

export const lidFill = (place: number) => FILL[place % FILL.length]
export const lidPale = (place: number) => PALE[place % PALE.length]
