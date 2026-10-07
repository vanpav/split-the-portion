/**
 * Everything the phrase parser needs to know about a language (docs/SPEC.md §7а «Языки»): number words,
 * units, separators, filler words, the case dictionary, «не учитывать» by name. The parser itself does
 * not depend on the language; a new language is a new description. Only Russian for now.
 */
export interface PhraseLanguage {
  /** BCP 47 tag for speech recognition. */
  speechLocale: string
}

export const RU: PhraseLanguage = {
  speechLocale: 'ru-RU',
}

export const DEFAULT_PHRASE_LANGUAGE: PhraseLanguage = RU
