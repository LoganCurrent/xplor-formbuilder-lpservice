import Vue from 'vue'
import VueI18n from 'vue-i18n'
import en from './locales/en.json'
import { detectLanguage } from './languageDetector'
import { loadTranslations } from './translationLoader'
import { DEFAULT_LOCALE } from './localeConstants'

Vue.use(VueI18n)

export const defaultLocale = 'en'

const INIT_TIMEOUT_MS = 3000

const i18n = new VueI18n({
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: {
    en
  }
})

export async function initI18n (useTranslations) {
  if (!useTranslations) return

  const locale = detectLanguage()
  if (locale === DEFAULT_LOCALE) return

  const messages = await Promise.race([
    loadTranslations(locale),
    new Promise(function (resolve) {
      setTimeout(function () { resolve({}) }, INIT_TIMEOUT_MS)
    })
  ])

  i18n.mergeLocaleMessage(locale, en)
  i18n.mergeLocaleMessage(locale, messages)
  i18n.locale = locale
}

export default i18n
