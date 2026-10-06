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
/** An own portion: the same lid, paler — fixed in grams, not taking part in the split. */
const PALE = [
  'bg-chart-1/45',
  'bg-chart-2/45',
  'bg-chart-3/45',
  'bg-chart-4/45',
  'bg-chart-5/45',
  'bg-chart-6/45',
  'bg-chart-7/45',
  'bg-chart-8/45',
  'bg-chart-9/45',
  'bg-chart-10/45',
] as const

export const lidFill = (place: number) => FILL[place % FILL.length]
export const lidPale = (place: number) => PALE[place % PALE.length]
