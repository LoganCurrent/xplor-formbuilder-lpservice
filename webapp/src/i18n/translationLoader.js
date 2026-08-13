import {
  CACHE_PREFIX,
  CACHE_TTL_MS,
  DEFAULT_LOCALE,
  getCdnLocalePath
} from './localeConstants'

function getCacheKey (locale) {
  return CACHE_PREFIX + locale
}

function readCache (locale) {
  try {
    const raw = localStorage.getItem(getCacheKey(locale))
    if (!raw) return null

    const cached = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null

    return cached.messages
  } catch (err) {
    return null
  }
}

function writeCache (locale, messages) {
  try {
    localStorage.setItem(
      getCacheKey(locale),
      JSON.stringify({ timestamp: Date.now(), messages: messages })
    )
  } catch (err) {
    console.warn(
      'Translation cache write failed (localStorage full or unavailable):',
      err
    )
  }
}

export async function loadTranslations (locale) {
  if (!locale || locale === DEFAULT_LOCALE) return {}

  const cdnUrl = process.env.VUE_APP_CROWDIN_CDN_URL
  if (!cdnUrl) return {}

  const cached = readCache(locale)
  if (cached) return cached

  try {
    const base = cdnUrl.replace(/\/+$/, '')
    const cdnLocale = getCdnLocalePath(locale)
    const response = await fetch(base + '/' + cdnLocale + '/messages.json')
    if (!response.ok) return {}

    const messages = await response.json()
    writeCache(locale, messages)
    return messages
  } catch (err) {
    return {}
  }
}

export function clearTranslationCache () {
  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.indexOf(CACHE_PREFIX) === 0) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(function (key) { localStorage.removeItem(key) })
  } catch (err) {
    console.warn(
      'Translation cache clear failed (localStorage unavailable):',
      err
    )
  }
}
