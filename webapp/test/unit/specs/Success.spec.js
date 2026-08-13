import { mount } from '@vue/test-utils'
import { createTestI18n } from '../i18n-test-utils'
import Success from '@/components/Success.vue'
import { createFlagUser, getFlagForUser } from '@/utils/featureFlags'

jest.mock('@/utils/featureFlags', () => ({
  createFlagUser: jest.fn(),
  getFlagForUser: jest.fn()
}))

const flushPromises = () => new Promise(function (resolve) { setTimeout(resolve, 0) })

describe('Success.vue', () => {
  let setTimeoutSpy

  beforeEach(() => {
    createFlagUser.mockReset()
    getFlagForUser.mockReset()
    createFlagUser.mockReturnValue({ identifier: 'acct-7' })
    getFlagForUser.mockResolvedValue(false)
    setTimeoutSpy = jest.spyOn(global, 'setTimeout')
  })

  afterEach(() => {
    setTimeoutSpy.mockRestore()
  })

  it('renders English fallback strings when translations are disabled', () => {
    const wrapper = mount(Success, {
      i18n: createTestI18n(),
      propsData: {
        parameters: { redirect: true, link: 'example.com', account_id: 'acct-7' }
      }
    })

    expect(wrapper.text()).toContain('Your purchase was successful.')
    expect(wrapper.text()).toContain('You will be redirected in 3 seconds...')
  })

  it('invokes the per-account flag loader on mount', async () => {
    mount(Success, {
      i18n: createTestI18n(),
      propsData: {
        parameters: { redirect: true, link: 'example.com', account_id: 'acct-7' }
      }
    })

    await flushPromises()

    expect(createFlagUser).toHaveBeenCalledWith('acct-7')
    expect(getFlagForUser).toHaveBeenCalledWith('landingPageTranslations', false, { identifier: 'acct-7' })
  })

  it('renders translated strings when translations are enabled and the locale has matching messages', async () => {
    getFlagForUser.mockResolvedValue(true)

    const wrapper = mount(Success, {
      i18n: createTestI18n({
        en: {
          labels: {
            purchaseSuccessful: 'Your purchase was successful.',
            redirecting: 'You will be redirected in 3 seconds...'
          }
        },
        'fr-CA': {
          labels: {
            purchaseSuccessful: 'Achat réussi.',
            redirecting: 'Redirection dans 3 secondes...'
          }
        }
      }, 'fr-CA'),
      propsData: {
        parameters: { redirect: true, link: 'example.com', account_id: 'acct-7' }
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Achat réussi.')
    expect(wrapper.text()).toContain('Redirection dans 3 secondes...')
  })

  it('renders parameters.success and skips redirect when redirect is falsy', () => {
    const wrapper = mount(Success, {
      i18n: createTestI18n(),
      propsData: {
        parameters: { redirect: false, success: 'All set.', account_id: 'acct-7' }
      }
    })

    expect(wrapper.text()).toContain('All set.')
    expect(wrapper.text()).not.toContain('Your purchase was successful.')
    expect(wrapper.text()).not.toContain('You will be redirected in 3 seconds...')
  })
})
