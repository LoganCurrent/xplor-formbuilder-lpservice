import { createFlagUser, getFlagForUser } from '@/utils/featureFlags'

const LANDING_PAGE_TRANSLATIONS_FLAG = 'landingPageTranslations'

export default {
  data () {
    return {
      translationsEnabled: false
    }
  },
  methods: {
    async loadTranslationsFlag (accountId) {
      const user = createFlagUser(accountId)
      this.translationsEnabled = await getFlagForUser(
        LANDING_PAGE_TRANSLATIONS_FLAG,
        false,
        user
      )
    },
    ts (key, fallback, params = {}) {
      const interpolate = (str) => Object.keys(params).reduce(
        (acc, name) => acc.split('{' + name + '}').join(String(params[name])),
        str
      )
      if (!this.translationsEnabled) return interpolate(fallback)
      if (!this.$t) return interpolate(fallback)
      const translated = this.$t(key, params)
      return translated === key ? interpolate(fallback) : translated
    }
  }
}
