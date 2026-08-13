export const DEFAULT_LOCALE = 'en-US'

export const SUPPORTED_LOCALES = [
  'en-US',
  'fr-CA',
  'fr-FR',
  'es-LA',
  'pt-BR',
  'de-DE',
  'it-IT',
  'nl-NL',
  'sv-SE',
  'da-DK',
  'no-NO'
]

export const DEFAULT_REGION = {
  en: 'US',
  de: 'DE',
  it: 'IT',
  nl: 'NL',
  sv: 'SE',
  da: 'DK'
}

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export const CACHE_PREFIX = 'lp-i18n-'

export const CDN_LOCALE_PATH = {
  'de-DE': 'de',
  'it-IT': 'it',
  'nl-NL': 'nl',
  'da-DK': 'da',
  'no-NO': 'no',
  'fr-FR': 'fr',
  'es-LA': 'es-419'
}

export function getCdnLocalePath (locale) {
  return CDN_LOCALE_PATH[locale] || locale
}
