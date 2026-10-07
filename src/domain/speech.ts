import type { PhraseLanguage } from './phraseLanguage'

/*
 * What was said (the mic button or the phone keyboard's dictation) → the phrase «курица 600, вода 2 л»
 * (docs/SPEC.md §7а «Сказанное → фраза»). Contract for the editor (stage 18); the bodies are filled in with tests.
 */

export interface SpokenPhrase {
  /** The phrase, first letter capital: «Курица 600, картошка 400, вода 2 л, соль по вкусу». */
  text: string
  /** Products in it, for «Добавлено голосом: 4 продукта». */
  count: number
  /** Filler words thrown away («ну», «значит»), each once, in order. */
  dropped: string[]
}

export function spokenToPhrase(said: string, language?: PhraseLanguage): SpokenPhrase {
  void said
  void language
  throw new Error('spokenToPhrase: not implemented yet')
}

/** The field's text looks dictated (number words, more products than separators): normalize on blur. */
export function looksSpoken(text: string, language?: PhraseLanguage): boolean {
  void text
  void language
  throw new Error('looksSpoken: not implemented yet')
}
