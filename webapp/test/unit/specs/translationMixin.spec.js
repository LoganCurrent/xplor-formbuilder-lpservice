import { mount } from '@vue/test-utils'
import { createTestI18n, VueI18n } from '../i18n-test-utils'
import translationMixin from '@/mixins/translationMixin'
import { createFlagUser, getFlagForUser } from '@/utils/featureFlags'

jest.mock('@/utils/featureFlags', () => ({
  createFlagUser: jest.fn(),
  getFlagForUser: jest.fn()
}))

const stubComponent = {
  mixins: [translationMixin],
  props: ['accountId'],
  template: '<div>{{ ts(tsKey, tsFallback, tsParams) }}</div>',
  data () {
    return {
      tsKey: 'labels.purchaseSuccessful',
      tsFallback: 'Your purchase was successful.',
      tsParams: {}
    }
  }
}

const buildWrapper = (overrides = {}) => mount(stubComponent, Object.assign({
  i18n: createTestI18n()
}, overrides))

describe('translationMixin', () => {
  beforeEach(() => {
    createFlagUser.mockReset()
    getFlagForUser.mockReset()
  })

  it('initializes with translationsEnabled defaulting to false', () => {
    const wrapper = buildWrapper()

    expect(wrapper.vm.translationsEnabled).toBe(false)
  })

  it('loadTranslationsFlag resolves the flag for the given account and updates translationsEnabled', async () => {
    createFlagUser.mockReturnValue({ identifier: 'acct-7' })
    getFlagForUser.mockResolvedValue(true)
    const wrapper = buildWrapper()

    await wrapper.vm.loadTranslationsFlag('acct-7')

    expect(createFlagUser).toHaveBeenCalledWith('acct-7')
    expect(getFlagForUser).toHaveBeenCalledWith(
      'landingPageTranslations',
      false,
      { identifier: 'acct-7' }
    )
    expect(wrapper.vm.translationsEnabled).toBe(true)
  })

  it('returns the fallback when translations are disabled', () => {
    const wrapper = buildWrapper({
      i18n: createTestI18n({
        en: { labels: { purchaseSuccessful: 'Your purchase was successful.' } },
        'fr-CA': { labels: { purchaseSuccessful: 'Achat réussi' } }
      }, 'fr-CA')
    })

    const result = wrapper.vm.ts('labels.purchaseSuccessful', 'Your purchase was successful.')

    expect(result).toBe('Your purchase was successful.')
  })

  it('returns the translated string when translations are enabled and the key resolves', () => {
    const wrapper = buildWrapper({
      i18n: createTestI18n({
        en: { labels: { purchaseSuccessful: 'Your purchase was successful.' } },
        'fr-CA': { labels: { purchaseSuccessful: 'Achat réussi' } }
      }, 'fr-CA')
    })
    wrapper.setData({ translationsEnabled: true })

    const result = wrapper.vm.ts('labels.purchaseSuccessful', 'Your purchase was successful.')

    expect(result).toBe('Achat réussi')
  })

  it('returns the fallback when translations are enabled but the key is missing in the active locale', () => {
    const wrapper = buildWrapper({
      i18n: createTestI18n({
        en: {},
        'fr-CA': {}
      }, 'fr-CA')
    })
    wrapper.setData({ translationsEnabled: true })

    const result = wrapper.vm.ts('labels.missingKey', 'My fallback')

    expect(result).toBe('My fallback')
  })

  it('interpolates {param} placeholders in the fallback when disabled', () => {
    const wrapper = buildWrapper()

    const result = wrapper.vm.ts(
      'labels.signInWithCredentials',
      'Sign In with your {brand} credentials',
      { brand: 'Acme' }
    )

    expect(result).toBe('Sign In with your Acme credentials')
  })

  it('interpolates {param} placeholders in the translated value when enabled', () => {
    const wrapper = buildWrapper({
      i18n: createTestI18n({
        en: { labels: { signInWithCredentials: 'Sign In with your {brand} credentials' } },
        'fr-CA': { labels: { signInWithCredentials: 'Connectez-vous avec vos identifiants {brand}' } }
      }, 'fr-CA')
    })
    wrapper.setData({ translationsEnabled: true })

    const result = wrapper.vm.ts(
      'labels.signInWithCredentials',
      'Sign In with your {brand} credentials',
      { brand: 'Acme' }
    )

    expect(result).toBe('Connectez-vous avec vos identifiants Acme')
  })

  it('falls back when $t is unavailable on the component instance', () => {
    const localComponent = {
      mixins: [translationMixin],
      template: '<div>{{ ts("labels.x", "fallback {n}", { n: 1 }) }}</div>'
    }
    const wrapper = mount(localComponent)
    wrapper.vm.translationsEnabled = true
    wrapper.vm.$t = undefined

    const result = wrapper.vm.ts('labels.x', 'fallback {n}', { n: 1 })

    expect(result).toBe('fallback 1')
  })
})

describe('translationMixin (without VueI18n plugin)', () => {
  it('VueI18n is registered globally for the suite', () => {
    expect(VueI18n).toBeDefined()
  })
})
