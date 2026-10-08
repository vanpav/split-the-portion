import type { Language } from './language'

/** A unit of the phrase: grams, litres taken as grams, or a count with no weight. */
export type PhraseUnit = 'g' | 'kg' | 'l' | 'ml' | 'pieces' | 'spoons'

/** Grammatical gender of a noun, for the adjectives before it: «сливочного масла» → «сливочное масло». */
export type NounGender = 'm' | 'f' | 'n' | 'pl'

/**
 * Everything the phrase parser needs to know about a language (docs/SPEC.md §7а «Языки»): number words,
 * units, separators, filler words, the case dictionary, «не учитывать» by name. The parser itself does
 * not depend on the language; a new language is a new description. Russian, English, Spanish.
 */
export interface PhraseLanguage {
  /** BCP 47 tag for speech recognition. */
  speechLocale: string
  /** Locale for lower/upper case and plural rules. */
  locale: string
  /** Letters of the language as a regex character-class body: a segment with one of them has a name. */
  letters: string
  /**
   * Units in the order they are checked (spoons before litres: «ложки» starts with «л»). `pattern` is a
   * regex source matching the whole unit, typed or said, without its trailing dot.
   */
  units: readonly { unit: PhraseUnit; pattern: string }[]
  /** How a unit is written in the phrase; grams are never written. */
  unitShort: Readonly<Record<Exclude<PhraseUnit, 'g'>, string>>
  /** «по вкусу»: a product without weight on purpose. Lower case, words separated by one space. */
  toTaste: string
  /** Names «не учитывать» by default, lower case. */
  excludedNames: readonly string[]

  // What was said → the phrase.
  /** Number words: «шестьсот» → 600, «полтора» → 1.5; «thirty-five» → 35. */
  numberWords: Readonly<Record<string, number>>
  /** Words multiplying what was said before: «две тысячи» (1000), «two hundred» (100). */
  multipliers: Readonly<Record<string, number>>
  /** A word between tens and units: «treinta y cinco» → 35. `null` where the units are one word. */
  tensJoiner: string | null
  /** «с половиной» after a number: + 0.5; «and a half» («two and a half kilos»). Empty if the language has none. */
  andHalf: readonly string[]
  /** Words before a product that carry no name: «de» in «200 gramos de harina», «of» in «200 grams of rice». */
  linkWords: readonly string[]
  /** «пол» before a unit («пол литра») is 0.5; «пол-литра» is read as «поллитра». */
  halfPrefix: string
  /** One-word halves: «полкило» → 0.5 kg. */
  halfWords: Readonly<Record<string, PhraseUnit>>
  /** «столовые», «чайные» before «ложки». */
  spoonAdjectives: readonly string[]
  /** Words between products, besides the comma: «и», «потом». */
  separators: readonly string[]
  /** Words thrown away and shown: «ну», «значит». */
  fillers: readonly string[]
  /**
   * Words that are not food («я», «говорю», «потому»): a said part without a quantity that has one is
   * not a product and is skipped; in a product with a quantity they are removed from the name.
   */
  stopWords: readonly string[]
  /** «600 грамм курицы»: the noun's case form → its nominative and gender. */
  nouns: Readonly<Record<string, { nominative: string; gender: NounGender }>>
  /**
   * An adjective in an oblique case: it belongs to the noun after it. `null` — the language has no such
   * endings: a name after a quantity runs until a separator or the next quantity.
   */
  adjectiveEnding: RegExp | null
  /** «сливочного» + n → «сливочное». */
  adjectiveToNominative: (word: string, gender: NounGender) => string
}

const nouns: Record<string, { nominative: string; gender: NounGender }> = {}
;(
  'курицы курица f|картошки картошка f|картофеля картофель m|моркови морковь f|морковки морковка f|лука лук m|риса рис m|' +
  'гречки гречка f|воды вода f|соли соль f|фарша фарш m|муки мука f|сахара сахар m|масла масло n|молока молоко n|' +
  'сметаны сметана f|капусты капуста f|свеклы свекла f|свёклы свёкла f|макарон макароны pl|говядины говядина f|' +
  'свинины свинина f|индейки индейка f|булгура булгур m|перловки перловка f|пшена пшено n|овсянки овсянка f|гороха горох m|' +
  'фасоли фасоль f|чечевицы чечевица f|сыра сыр m|творога творог m|грибов грибы pl|шампиньонов шампиньоны pl|' +
  'помидоров помидоры pl|томатов томаты pl|огурцов огурцы pl|кабачков кабачки pl|филе филе n|бедра бедро n|грудки грудка f|' +
  'чеснока чеснок m|перца перец m|специй специи pl|кускуса кускус m|лапши лапша f|пасты паста f|тыквы тыква f|' +
  'брокколи брокколи f|яиц яйца pl|сливок сливки pl|бульона бульон m|кефира кефир m|йогурта йогурт m|овощей овощи pl|' +
  'зелени зелень f|укропа укроп m|петрушки петрушка f|лосося лосось m|рыбы рыба f|трески треска f|минтая минтай m|' +
  'креветок креветки pl|сметанки сметанка f'
)
  .split('|')
  .forEach((entry) => {
    const [form, nominative, gender] = entry.split(' ')
    nouns[form] = { nominative, gender: gender as NounGender }
  })

export const RU: PhraseLanguage = {
  speechLocale: 'ru-RU',
  locale: 'ru',
  letters: 'a-zа-яё',
  units: [
    { unit: 'spoons', pattern: 'ложк[аиу]|ложек|ст\\.?\\s?л|ч\\.?\\s?л' },
    { unit: 'kg', pattern: 'килограмм(?:а|ов|ы)?|кило|кг' },
    { unit: 'g', pattern: 'грамм(?:а|ов|ы)?|гр|г' },
    { unit: 'ml', pattern: 'миллилитр(?:а|ов|ы)?|мл' },
    { unit: 'l', pattern: 'литр(?:а|ов|ы)?|л' },
    { unit: 'pieces', pattern: 'штук[аи]?|штучк[аи]|шт' },
  ],
  unitShort: { kg: 'кг', l: 'л', ml: 'мл', pieces: 'шт', spoons: 'ложки' },
  toTaste: 'по вкусу',
  excludedNames: ['вода', 'соль', 'специи', 'перец', 'лавровый лист'],

  numberWords: {
    ноль: 0, один: 1, одна: 1, одну: 1, одно: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7,
    восемь: 8, девять: 9, десять: 10, одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14,
    пятнадцать: 15, шестнадцать: 16, семнадцать: 17, восемнадцать: 18, девятнадцать: 19, двадцать: 20,
    тридцать: 30, сорок: 40, пятьдесят: 50, шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
    сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500, шестьсот: 600, семьсот: 700,
    восемьсот: 800, девятьсот: 900, полтора: 1.5, полторы: 1.5,
  },
  multipliers: { тысяча: 1000, тысячи: 1000, тысяч: 1000, тысячу: 1000 },
  tensJoiner: null,
  andHalf: ['с', 'половиной'],
  linkWords: [],
  halfPrefix: 'пол',
  halfWords: { полкило: 'kg', полкилограмма: 'kg', поллитра: 'l', поллитр: 'l' },
  spoonAdjectives: ['столовая', 'столовые', 'столовых', 'столовую', 'чайная', 'чайные', 'чайных', 'чайную'],
  separators: ['и', 'плюс', 'ещё', 'еще', 'потом', 'затем', 'дальше', 'также', 'запятая', 'точка'],
  fillers: [
    'ну', 'значит', 'так', 'вот', 'э', 'ээ', 'эээ', 'эм', 'мм', 'короче', 'типа', 'это', 'там', 'а', 'ага', 'сейчас',
    'у', 'нас', 'меня', 'положили', 'положил', 'положила', 'кладём', 'кладем', 'взяли', 'взял', 'взяла', 'добавили',
    'добавил', 'добавила',
  ],
  stopWords: [
    'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они', 'его', 'её', 'ее', 'их', 'мне', 'меня', 'тебе', 'тебя', 'нам', 'вам',
    'им', 'ей', 'ему', 'мой', 'моя', 'моё', 'мое', 'мои', 'свой', 'сам', 'сама', 'себе',
    'что', 'что-то', 'чего', 'кто', 'где', 'когда', 'если', 'потому', 'поэтому', 'почему', 'чтобы', 'как', 'будто',
    'который', 'которая', 'которое', 'такое', 'такой', 'тут', 'здесь', 'теперь', 'сегодня', 'уже', 'всё', 'все',
    'или', 'но', 'да', 'нет', 'не', 'ни',
    'быть', 'был', 'была', 'было', 'были', 'будет', 'буду', 'должно', 'должен', 'должна', 'должны', 'можно', 'нужно',
    'надо', 'может', 'наверное', 'кажется',
    'говорю', 'говорит', 'сказал', 'сказала', 'думаю', 'хочу', 'знаю', 'слушай', 'смотри', 'давай', 'блин',
    'просто', 'очень', 'вообще', 'ладно', 'окей', 'хорошо', 'почище', 'продукт', 'продукты', 'продукта',
    'записано', 'записать', 'запиши', 'положить', 'положу', 'получилось',
  ],
  nouns,
  adjectiveEnding: /(ого|его|ой|ей|ых|их)$/,
  adjectiveToNominative: (word, gender) => {
    if (gender === 'pl') return word.replace(/ых$/, 'ые').replace(/их$/, 'ие')
    if (gender === 'f') return word.replace(/([жшчщ])ей$/, '$1ая').replace(/ей$/, 'яя').replace(/ой$/, 'ая')
    if (gender === 'n') return word.replace(/ого$/, 'ое').replace(/его$/, 'ее')
    return word.replace(/ого$/, 'ый').replace(/его$/, 'ий')
  },
}

const numberDigits: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
}

const englishNumbers: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
}
// «thirty-five» is one word for the tokenizer: 21–99 with a hyphen.
for (const tens of ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']) {
  for (const [word, value] of Object.entries(numberDigits)) englishNumbers[`${tens}-${word}`] = englishNumbers[tens] + value
}

export const EN: PhraseLanguage = {
  speechLocale: 'en-US',
  locale: 'en',
  letters: 'a-z',
  units: [
    { unit: 'spoons', pattern: 'tablespoons?|tbsps?|teaspoons?|tsps?|spoons?' },
    { unit: 'kg', pattern: 'kilograms?|kilos?|kgs?' },
    { unit: 'g', pattern: 'grams?|grs?|g' },
    { unit: 'ml', pattern: 'milliliters?|millilitres?|mls?' },
    { unit: 'l', pattern: 'liters?|litres?|ls?' },
    { unit: 'pieces', pattern: 'pieces?|pcs?|units?' },
  ],
  unitShort: { kg: 'kg', l: 'l', ml: 'ml', pieces: 'pcs', spoons: 'spoons' },
  toTaste: 'to taste',
  excludedNames: ['water', 'salt', 'spices', 'pepper', 'bay leaf'],

  numberWords: englishNumbers,
  multipliers: { hundred: 100, thousand: 1000 },
  tensJoiner: null,
  andHalf: ['and', 'a', 'half'],
  halfPrefix: 'half',
  halfWords: {},
  spoonAdjectives: [],
  separators: ['and', 'plus', 'then', 'also', 'next', 'comma', 'period'],
  fillers: [
    'so', 'well', 'um', 'uh', 'like', 'okay', 'ok', 'now', 'a', 'an', 'the', 'we', 'i', 'got', 'have', 'had', 'put',
    'putting', 'add', 'added', 'there', 'is', 'are', 'some', 'just', 'in',
  ],
  stopWords: [
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'them', 'my', 'our', 'his', 'their', 'that',
    'which', 'what', 'when', 'if', 'because', 'why', 'but', 'or', 'not', 'no', 'yes', 'was', 'be',
    'were', 'should', 'must', 'can', 'could', 'would', 'maybe', 'think', 'say', 'said', 'want', 'know',
    'good', 'fine', 'really', 'very', 'product', 'products', 'ingredient', 'ingredients', 'noted', 'write', 'wrote',
  ],
  linkWords: ['of'],
  nouns: {},
  adjectiveEnding: null,
  adjectiveToNominative: (word) => word,
}

const spanishTens: Record<string, number> = {
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16,
  diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiún: 21, veintiun: 21, veintiuno: 21,
  veintiuna: 21, veintidós: 22, veintidos: 22, veintitrés: 23, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiséis: 26, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300,
  cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500, seiscientos: 600,
  seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800,
  novecientos: 900, novecientas: 900,
}

export const ES: PhraseLanguage = {
  speechLocale: 'es-ES',
  locale: 'es',
  letters: 'a-zñáéíóúü',
  units: [
    { unit: 'spoons', pattern: 'cucharadas?|cucharaditas?|cucharas?|cdas?|cdtas?' },
    { unit: 'kg', pattern: 'kilogramos?|kilos?|kgs?' },
    { unit: 'g', pattern: 'gramos?|grs?|g' },
    { unit: 'ml', pattern: 'mililitros?|mls?' },
    { unit: 'l', pattern: 'litros?|ls?' },
    { unit: 'pieces', pattern: 'piezas?|unidades?|uds?' },
  ],
  unitShort: { kg: 'kg', l: 'l', ml: 'ml', pieces: 'uds', spoons: 'cucharadas' },
  toTaste: 'al gusto',
  excludedNames: ['agua', 'sal', 'especias', 'pimienta', 'hoja de laurel'],

  numberWords: {
    ...spanishTens,
    cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  },
  multipliers: { mil: 1000 },
  tensJoiner: 'y',
  andHalf: ['y', 'medio'],
  halfPrefix: 'medio',
  halfWords: {},
  spoonAdjectives: [],
  separators: ['y', 'más', 'luego', 'después', 'además', 'coma', 'punto'],
  fillers: [
    'eh', 'em', 'mm', 'bueno', 'pues', 'o', 'sea', 'este', 'esto', 'ya', 'ah', 'así', 'entonces', 'vale', 'vamos',
    'tengo', 'pongo', 'puse', 'pusimos', 'añadí', 'añado', 'agregué', 'echo', 'echamos', 'tenemos', 'hay', 'es',
    'sopera', 'soperas', 'rasa', 'rasas', 'colmada', 'colmadas',
  ],
  stopWords: [
    'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'me', 'te', 'se', 'mi', 'mis', 'su', 'sus', 'que', 'qué', 'cuando',
    'si', 'como', 'porque', 'pero', 'no', 'sí', 'ser', 'estar', 'son', 'era', 'fue', 'debe', 'puedo', 'quiero',
    'creo', 'digo', 'dije', 'hablo', 'muy', 'bien', 'poco', 'producto', 'productos', 'ingrediente', 'ingredientes',
    'anoto', 'apunto', 'escribo',
  ],
  linkWords: ['de'],
  nouns: {},
  adjectiveEnding: null,
  adjectiveToNominative: (word) => word,
}

/** The description of the phrase language for a UI language (docs/ARCHITECTURE.md §11). */
export function phraseLanguageOf(language: Language): PhraseLanguage {
  switch (language) {
    case 'en':
      return EN
    case 'es':
      return ES
    case 'ru':
      return RU
  }
}

export const DEFAULT_PHRASE_LANGUAGE: PhraseLanguage = RU
