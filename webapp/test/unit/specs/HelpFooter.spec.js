import { mount } from '@vue/test-utils'
import HelpFooter from '@/components/HelpFooter.vue'
import { createTestI18n } from '../i18n-test-utils'

jest.mock('@/utils/featureFlags', () => ({
  createFlagUser: jest.fn(() => ({ identifier: 'acct-1' })),
  getFlagForUser: jest.fn(() => Promise.resolve(false)),
  initFeatureFlags: jest.fn(() => null)
}))

const featureFlags = require('@/utils/featureFlags')
const flushPromises = () => new Promise((resolve) => setImmediate(resolve))

beforeEach(() => {
  featureFlags.getFlagForUser.mockReset()
  featureFlags.getFlagForUser.mockResolvedValue(false)
})

describe('HelpFooter.vue', () => {
  const buildWrapper = (propsData, i18n = createTestI18n()) => mount(HelpFooter, {
    propsData,
    i18n
  })

  describe('email-only branch', () => {
    it('renders the email fallback in English when flag is OFF', () => {
      const wrapper = buildWrapper({ email: 'help@example.com', phone: '', accountId: 'acct-1' })

      const footer = wrapper.find('.footer')
      expect(footer.exists()).toBe(true)
      expect(footer.text()).toContain('Need help? Email us at')
      expect(footer.html()).toContain('href="mailto:help@example.com"')
      expect(footer.text()).toContain('help@example.com')
    })

    it('renders the translated email line when flag is ON', async () => {
      featureFlags.getFlagForUser.mockResolvedValue(true)
      const i18n = createTestI18n({
        en: { labels: {} },
        'fr-CA': {
          labels: { needHelpEmail: 'Besoin d\u2019aide? Écrivez-nous à' }
        }
      }, 'fr-CA')
      const wrapper = buildWrapper({ email: 'help@example.com', phone: '', accountId: 'acct-1' }, i18n)
      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.footer').text()).toContain('Besoin d\u2019aide? Écrivez-nous à')
    })
  })

  describe('phone-only branch', () => {
    it('renders the phone fallback in English when flag is OFF', () => {
      const wrapper = buildWrapper({ email: '', phone: '5551234567', accountId: 'acct-1' })

      const footer = wrapper.find('.footer')
      expect(footer.exists()).toBe(true)
      expect(footer.text()).toContain('Need help? Call us at')
      expect(footer.html()).toContain('href="tel:5551234567"')
      expect(footer.text()).toContain('5551234567')
    })
  })

  describe('email + phone branch', () => {
    it('renders the combined English fallback with both anchors when flag is OFF', () => {
      const wrapper = buildWrapper({ email: 'help@example.com', phone: '5551234567', accountId: 'acct-1' })

      const footer = wrapper.find('.footer')
      expect(footer.exists()).toBe(true)
      const html = footer.html()
      expect(footer.text()).toContain('Need help? Email us at')
      expect(footer.text()).toContain('or call us at')
      expect(html).toContain('href="mailto:help@example.com"')
      expect(html).toContain('href="tel:5551234567"')
    })

    it('renders the combined translated text with anchors substituted into the slots', async () => {
      featureFlags.getFlagForUser.mockResolvedValue(true)
      const i18n = createTestI18n({
        en: { labels: {} },
        'fr-CA': {
          labels: {
            needHelpEmailAndCall: 'Besoin d\u2019aide? Écrivez-nous à {email} ou appelez-nous au {phone}'
          }
        }
      }, 'fr-CA')
      const wrapper = buildWrapper({ email: 'help@example.com', phone: '5551234567', accountId: 'acct-1' }, i18n)
      await flushPromises()
      await wrapper.vm.$nextTick()

      const html = wrapper.find('.footer').html()
      expect(wrapper.find('.footer').text()).toContain('Besoin d\u2019aide?')
      expect(wrapper.find('.footer').text()).toContain('ou appelez-nous au')
      expect(html).toContain('href="mailto:help@example.com"')
      expect(html).toContain('href="tel:5551234567"')
    })
  })

  it('renders nothing when neither email nor phone is provided', () => {
    const wrapper = buildWrapper({ email: '', phone: '', accountId: 'acct-1' })

    expect(wrapper.find('.footer').exists()).toBe(false)
  })

  it('calls loadTranslationsFlag with the provided accountId on mount', async () => {
    const featureFlags = require('@/utils/featureFlags')
    buildWrapper({ email: 'help@example.com', phone: '', accountId: 'acct-42' })
    await flushPromises()

    expect(featureFlags.createFlagUser).toHaveBeenCalledWith('acct-42')
    expect(featureFlags.getFlagForUser).toHaveBeenCalledWith(
      'landingPageTranslations',
      false,
      expect.anything()
    )
  })
})
