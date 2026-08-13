import { DEFAULT_LOCALE, DEFAULT_REGION } from './localeConstants'

function resolveSupportedLocale (value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim().replace(/_/g, '-').toLowerCase()
  if (!normalized) return null

  const parts = normalized.split('-')
  const language = parts[0]
  const region = parts[1]

  if (language === 'fr') {
    return region === 'fr' ? 'fr-FR' : 'fr-CA'
  }
  if (language === 'es') return 'es-LA'
  if (language === 'pt') return 'pt-BR'
  if (language === 'no' || language === 'nb' || language === 'nn') return 'no-NO'

  if (Object.prototype.hasOwnProperty.call(DEFAULT_REGION, language)) {
    return language + '-' + DEFAULT_REGION[language]
  }

  return null
}

export function normalizeLanguageCode (value) {
  return resolveSupportedLocale(value) || DEFAULT_LOCALE
}

function getQueryParamLanguage (search) {
  if (typeof search !== 'string' || !search.trim()) return null

  const params = new URLSearchParams(search)
  const langParam = params.get('lang')
  if (!langParam) return null

  return resolveSupportedLocale(langParam)
}

export function detectLanguage (options) {
  const opts = options || {}
  const hasWindow = typeof window !== 'undefined' && !!window.location
  const hasNavigator = typeof navigator !== 'undefined'

  const search = opts.search !== undefined
    ? opts.search
    : (hasWindow ? window.location.search : '')

  const queryParamLanguage = getQueryParamLanguage(search)
  if (queryParamLanguage) {
    return queryParamLanguage
  }

  const browserLanguages = opts.languages !== undefined
    ? opts.languages
    : (hasNavigator ? navigator.languages : undefined)

  if (Array.isArray(browserLanguages)) {
    for (let i = 0; i < browserLanguages.length; i++) {
      const normalized = resolveSupportedLocale(browserLanguages[i])
      if (normalized) {
        return normalized
      }
    }
  }

  const browserLanguage = opts.language !== undefined
    ? opts.language
    : (hasNavigator ? navigator.language : undefined)

  const normalizedBrowserLanguage = resolveSupportedLocale(browserLanguage)
  if (normalizedBrowserLanguage) {
    return normalizedBrowserLanguage
  }

  return DEFAULT_LOCALE
}
