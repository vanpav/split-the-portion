import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/domain'
import { resources } from '../resources'

/** Every leaf key, plural suffixes dropped: «raw.count_few» and «raw.count_other» are one key. */
function keys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix.replace(/_(zero|one|two|few|many|other)$/, '')]
  return Object.entries(node).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
}

const unique = (list: string[]) => [...new Set(list)].sort()
const placeholders = (text: string) => unique(text.match(/{{\w+}}/g) ?? [])

function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]]
  return Object.entries(node as object).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k))
}

describe('the languages', () => {
  const ru = unique(keys(resources.ru.translation))

  it.each(LANGUAGES.filter((l) => l !== 'ru'))('%s has exactly the Russian keys', (lang) => {
    expect(unique(keys(resources[lang].translation))).toEqual(ru)
  })

  it.each(LANGUAGES.filter((l) => l !== 'ru'))('%s fills the same placeholders', (lang) => {
    const byKey = new Map(leaves(resources.ru.translation).map(([k, v]) => [k.replace(/_\w+$/, ''), placeholders(v)]))
    for (const [key, text] of leaves(resources[lang].translation)) {
      expect([key, placeholders(text)]).toEqual([key, byKey.get(key.replace(/_\w+$/, ''))])
    }
  })
})
