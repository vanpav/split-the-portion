/** A unit of the phrase: grams, litres taken as grams, or a count with no weight. */
export type PhraseUnit = 'g' | 'kg' | 'l' | 'ml' | 'pieces' | 'spoons'

/** Grammatical gender of a noun, for the adjectives before it: «сливочного масла» → «сливочное масло». */
export type NounGender = 'm' | 'f' | 'n' | 'pl'

/**
 * Everything the phrase parser needs to know about a language (docs/SPEC.md §7а «Языки»): number words,
 * units, separators, filler words, the case dictionary, «не учитывать» by name. The parser itself does
 * not depend on the language; a new language is a new description. Only Russian for now.
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
  /** Number words: «шестьсот» → 600, «полтора» → 1.5. */
  numberWords: Readonly<Record<string, number>>
  /** Words multiplying what was said before by 1000: «две тысячи». */
  thousandWords: readonly string[]
  /** «с половиной» after a number: + 0.5. */
  andHalf: readonly [string, string]
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
  /** An adjective in an oblique case: it belongs to the noun after it. */
  adjectiveEnding: RegExp
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
  thousandWords: ['тысяча', 'тысячи', 'тысяч', 'тысячу'],
  andHalf: ['с', 'половиной'],
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

export const DEFAULT_PHRASE_LANGUAGE: PhraseLanguage = RU
