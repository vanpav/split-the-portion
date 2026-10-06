/**
 * One height for every calculator display row, «Сухой» and «Готовый» alike: room for the number and
 * a small line under it, so the rows stack evenly and «Готовый» does not stand out by its size.
 */
export const displayRowBox = (compact?: boolean) => (compact ? 'min-h-15 py-1' : 'min-h-20 py-2')
