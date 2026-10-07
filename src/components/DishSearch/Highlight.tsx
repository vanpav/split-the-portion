import { highlightRange } from '@/domain'

/** `text` with the query marked: a word start preferred, case and «ё» aside (`highlightRange`). */
export function Highlight({ text, query }: { text: string; query: string }) {
  const range = highlightRange(text, query)
  if (!range) return <>{text}</>
  return (
    <>
      {text.slice(0, range.start)}
      <mark className="rounded-sm bg-primary/15 font-medium text-inherit">{text.slice(range.start, range.end)}</mark>
      {text.slice(range.end)}
    </>
  )
}
