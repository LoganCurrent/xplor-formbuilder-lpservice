import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES
} from '@/i18n/localeConstants'
import {
  detectLanguage,
  normalizeLanguageCode
} from '@/i18n/languageDetector'

describe('languageDetector', () => {
  describe('normalizeLanguageCode', () => {
    it('returns exact supported locales in canonical format', () => {
      expect(normalizeLanguageCode('en-US')).toBe('en-US')
      expect(normalizeLanguageCode('fr-ca')).toBe('fr-CA')
      expect(normalizeLanguageCode('es-LA')).toBe('es-LA')
      expect(normalizeLanguageCode('fr-FR')).toBe('fr-FR')
      expect(normalizeLanguageCode('pt-BR')).toBe('pt-BR')
      expect(normalizeLanguageCode('de-DE')).toBe('de-DE')
      expect(normalizeLanguageCode('it-IT')).toBe('it-IT')
      expect(normalizeLanguageCode('nl-NL')).toBe('nl-NL')
      expect(normalizeLanguageCode('sv-SE')).toBe('sv-SE')
      expect(normalizeLanguageCode('da-DK')).toBe('da-DK')
      expect(normalizeLanguageCode('no-NO')).toBe('no-NO')
    })

    it('maps language-only and variants to standardized locales', () => {
      expect(normalizeLanguageCode('en')).toBe('en-US')
      expect(normalizeLanguageCode('en-GB')).toBe('en-US')
      expect(normalizeLanguageCode('fr')).toBe('fr-CA')
      expect(normalizeLanguageCode('fr-BE')).toBe('fr-CA')
      expect(normalizeLanguageCode('fr_FR')).toBe('fr-FR')
      expect(normalizeLanguageCode('es')).toBe('es-LA')
      expect(normalizeLanguageCode('es-MX')).toBe('es-LA')
      expect(normalizeLanguageCode('pt')).toBe('pt-BR')
      expect(normalizeLanguageCode('pt-PT')).toBe('pt-BR')
      expect(normalizeLanguageCode('de')).toBe('de-DE')
      expect(normalizeLanguageCode('de-AT')).toBe('de-DE')
      expect(normalizeLanguageCode('it')).toBe('it-IT')
      expect(normalizeLanguageCode('it-CH')).toBe('it-IT')
      expect(normalizeLanguageCode('nl')).toBe('nl-NL')
      expect(normalizeLanguageCode('nl-BE')).toBe('nl-NL')
      expect(normalizeLanguageCode('sv')).toBe('sv-SE')
      expect(normalizeLanguageCode('da')).toBe('da-DK')
      expect(normalizeLanguageCode('no')).toBe('no-NO')
      expect(normalizeLanguageCode('nb-NO')).toBe('no-NO')
      expect(normalizeLanguageCode('nn-NO')).toBe('no-NO')
    })

    it('falls back to English for unsupported or invalid values', () => {
      expect(normalizeLanguageCode('pl-PL')).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode('')).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode('   ')).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode(undefined)).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode(null)).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode(123)).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode({})).toBe(DEFAULT_LOCALE)
    })

    it('rejects prototype keys (e.g. ?lang=constructor) and returns default locale', () => {
      expect(normalizeLanguageCode('constructor')).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode('toString')).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode('__proto__')).toBe(DEFAULT_LOCALE)
      expect(normalizeLanguageCode('hasOwnProperty')).toBe(DEFAULT_LOCALE)
    })
  })

  describe('detectLanguage', () => {
    it('rejects prototype keys in URL lang parameter', () => {
      expect(detectLanguage({ search: '?lang=constructor' })).toBe(DEFAULT_LOCALE)
      expect(detectLanguage({ search: '?lang=__proto__' })).toBe(DEFAULT_LOCALE)
    })

    it('uses URL lang override when provided', () => {
      const locale = detectLanguage({
        search: '?lang=fr-FR',
        languages: ['es-MX'],
        language: 'de-DE'
      })

      expect(locale).toBe('fr-FR')
    })

    it('normalizes URL lang override when supported', () => {
      expect(detectLanguage({ search: '?lang=pt-PT' })).toBe('pt-BR')
      expect(detectLanguage({ search: '?lang=fr_FR' })).toBe('fr-FR')
      expect(detectLanguage({ search: '?lang=NB-no' })).toBe('no-NO')
    })

    it('ignores unsupported URL lang and falls back to browser detection', () => {
      expect(
        detectLanguage({
          search: '?lang=pl-PL',
          languages: ['pl-PL', 'en-US'],
          language: 'pl-PL'
        })
      ).toBe('en-US')
    })

    it('preserves unrelated query params when reading lang', () => {
      const locale = detectLanguage({
        search: '?hidden=1&lang=fr-CA&_mt=/account',
        languages: ['en-US']
      })

      expect(locale).toBe('fr-CA')
    })

    it('uses the first supported locale from navigator.languages style list', () => {
      const locale = detectLanguage({
        languages: ['pl-PL', 'es-AR', 'de-DE'],
        language: 'fr-FR'
      })

      expect(locale).toBe('es-LA')
    })

    it('falls back to navigator.language when navigator.languages has no supported entries', () => {
      const locale = detectLanguage({
        languages: ['pl-PL', 'cs-CZ'],
        language: 'de-AT'
      })

      expect(locale).toBe('de-DE')
    })

    it('falls back to English when no supported value is available', () => {
      const locale = detectLanguage({
        languages: ['pl-PL', 'cs-CZ'],
        language: 'tr-TR'
      })

      expect(locale).toBe(DEFAULT_LOCALE)
    })

    it('treats empty options as defaults', () => {
      const locale = detectLanguage({
        search: '',
        languages: undefined,
        language: undefined
      })

      expect(locale).toBe(DEFAULT_LOCALE)
    })
  })

  it('uses SUPPORTED_LOCALES as single source of truth: each round-trips', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(11)
    SUPPORTED_LOCALES.forEach((locale) => {
      expect(normalizeLanguageCode(locale)).toBe(locale)
      expect(normalizeLanguageCode(locale.toLowerCase())).toBe(locale)
    })
  })
})
