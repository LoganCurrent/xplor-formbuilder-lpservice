import { shallowMount } from '@vue/test-utils'
import LandingPage from '@/components/LandingPage.vue'
import EventBus from '@/event-bus'
import {
  fetchLandingPageConfig,
  captureCheckoutEvent,
  fetchMTConfig,
  fetchMTIframeConfig
} from '@/api'
import {
  getReachConfig,
  handleReachIdentification,
  loadReachAttribution
} from '@/utils/reach'

jest.mock('@/api', () => ({
  fetchLandingPageConfig: jest.fn(),
  captureCheckoutEvent: jest.fn(),
  fetchMTConfig: jest.fn(),
  fetchMTIframeConfig: jest.fn()
}))

jest.mock('@/event-bus', () => ({
  $emit: jest.fn(),
  $on: jest.fn(),
  $off: jest.fn()
}))

jest.mock('@/utils/reach', () => ({
  getReachConfig: jest.fn(),
  handleReachIdentification: jest.fn(),
  loadReachAttribution: jest.fn()
}))

const createWrapper = () => shallowMount(LandingPage, {
  stubs: {
    Summary: true,
    ActFast: true,
    MTLogin: true,
    MTSignUp: true,
    MTCheckout: true,
    Success: true,
    Hidden: true,
    CircleSpinner: true
  },
  mocks: {
    $message: { error: jest.fn() }
  }
})

describe('LandingPage Reach events', () => {
  const baseParameters = {
    name: 'LP Name',
    subdomain: 'demo',
    vanity: 'test-vanity-slug',
    account_name: 'Demo Account',
    template: {
      'key-page-color': '#ffffff',
      'key-page-header-color': '#000000',
      'key-logo': 'https://example.com/logo.png',
      'key-logo-width': 120
    },
    product: { price: 100 },
    currency: 'USD',
    button_color: '#000',
    pixel: { id: 'pixel-id', purchase: false, lead: true },
    enableReachAdvancedIdentification: true
  }

  beforeEach(() => {
    window.landingPageUuid = 'lp-uuid'
    global.landingPageUuid = 'lp-uuid'
    window.fbq = jest.fn()
    localStorage.clear()
    jest.clearAllMocks()
    fetchLandingPageConfig.mockResolvedValue({ parameters: { ...baseParameters } })
    fetchMTConfig.mockResolvedValue({
      is_custom_client_auth_enabled: false,
      custom_client_openid_connect_optional_create_account_endpoint: null,
      brand_name: 'Brand'
    })
    fetchMTIframeConfig.mockResolvedValue({
      mtConfig: {
        xplorAdsPartnerId: 'partner-id',
        xplorAdsPartnerHash: true
      }
    })
  })

  it('normalizes reach identity from alias fields', () => {
    const wrapper = createWrapper()
    const identity = wrapper.vm.normalizeReachIdentity({
      userId: 'user-123',
      email_address: 'user@example.com',
      phone_number: '1234567890',
      first_name: 'Jane',
      last_name: 'Doe'
    })

    expect(identity).toEqual({
      userId: 'user-123',
      email: 'user@example.com',
      phone: '1234567890',
      firstName: 'Jane',
      lastName: 'Doe'
    })
  })

  it('uses cached identity from MT storage when available', () => {
    const wrapper = createWrapper()
    wrapper.setData({ parameters: { ...baseParameters } })
    localStorage.setItem(
      'mt.https://demo.marianatek.com',
      JSON.stringify({ user: { userId: 'cached-user', email: 'cached@example.com', first_name: 'Alex' } })
    )

    const identity = wrapper.vm.getCachedReachIdentity()

    expect(identity).toEqual({
      userId: 'cached-user',
      email: 'cached@example.com',
      phone: null,
      firstName: 'Alex',
      lastName: null
    })
  })

  it('sends reach identification with cached fallback identity', async () => {
    const wrapper = createWrapper()
    wrapper.setData({
      parameters: { ...baseParameters },
      reachConfig: { partnerId: 'partner-id', tenantExternalId: 'demo' },
      enableReachAdvancedIdentification: true
    })
    localStorage.setItem(
      'mt.https://demo.marianatek.com',
      JSON.stringify({ user: { userId: 'cached-user', email: 'cached@example.com' } })
    )

    await wrapper.vm.sendReachIdentification({ phone: '999' }, 'LP Source')

    expect(handleReachIdentification).toHaveBeenCalledWith({
      userId: 'cached-user',
      email: 'cached@example.com',
      phone: '999',
      firstName: null,
      lastName: null,
      sourceId: 'LP Source'
    })
  })

  it('fires reach identification on checkout complete', async () => {
    fetchLandingPageConfig.mockResolvedValue({ parameters: { ...baseParameters } })
    fetchMTConfig.mockResolvedValue({
      is_custom_client_auth_enabled: false,
      custom_client_openid_connect_optional_create_account_endpoint: null,
      brand_name: 'Brand'
    })
    fetchMTIframeConfig.mockResolvedValue({
      mtConfig: {
        xplorAdsPartnerId: 'partner-id',
        xplorAdsPartnerHash: true
      }
    })
    getReachConfig.mockReturnValue({ partnerId: 'partner-id', tenantExternalId: 'demo' })
    captureCheckoutEvent.mockResolvedValue()

    const wrapper = createWrapper()
    jest.spyOn(wrapper.vm, 'sendReachIdentification').mockResolvedValue(true)

    await wrapper.vm.getParameters()
    wrapper.vm.mtoauth = { getAccessToken: jest.fn(() => 'token'), isAuthenticated: jest.fn(() => false) }

    const payload = {
      userId: '39078',
      email: 'checkout@example.com',
      order: {
        id: '10044',
        number: 'TEST-1',
        currency: 'USD',
        total: 20,
        orderLines: [{ id: 'line-1', productName: 'Yearly Membership' }],
        orderDetails: [{ brokerName: 'Taylor Lee' }]
      }
    }

    await window.MT_CONFIG.events.onCheckoutComplete(payload)

    expect(EventBus.$emit).toHaveBeenCalledWith('show_success')
    expect(captureCheckoutEvent).toHaveBeenCalledWith(
      'lp-uuid',
      '39078',
      20,
      'line-1',
      'token',
      payload.order,
      '10044'
    )
    expect(loadReachAttribution).toHaveBeenCalledWith({ partnerId: 'partner-id', tenantExternalId: 'demo' })
    expect(wrapper.vm.sendReachIdentification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '39078',
        email: 'checkout@example.com'
      }),
      'test-vanity-slug'
    )
    const checkoutIdentity = wrapper.vm.sendReachIdentification.mock.calls[0][0]
    expect(checkoutIdentity.order).toBeUndefined()
    expect(checkoutIdentity.firstName).toBe('Taylor')
    expect(checkoutIdentity.lastName).toBe('Lee')
  })

  it('fires reach identification on account creation', async () => {
    fetchLandingPageConfig.mockResolvedValue({ parameters: { ...baseParameters } })
    fetchMTConfig.mockResolvedValue({
      is_custom_client_auth_enabled: false,
      custom_client_openid_connect_optional_create_account_endpoint: null,
      brand_name: 'Brand'
    })
    fetchMTIframeConfig.mockResolvedValue({
      mtConfig: {
        xplorAdsPartnerId: 'partner-id',
        xplorAdsPartnerHash: true
      }
    })
    getReachConfig.mockReturnValue({ partnerId: 'partner-id', tenantExternalId: 'demo' })

    const wrapper = createWrapper()
    jest.spyOn(wrapper.vm, 'sendReachIdentification').mockResolvedValue(true)

    await wrapper.vm.getParameters()
    window.fbq.mockClear()

    await window.MT_CONFIG.events.onCreateAccountComplete({
      userId: '39078', email: 'new@example.com', first_name: 'New', last_name: 'User'
    })

    expect(EventBus.$emit).toHaveBeenCalledWith('show_mt_checkout')
    expect(window.fbq).toHaveBeenCalledWith('track', 'Lead')
    expect(wrapper.vm.sendReachIdentification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '39078',
        email: 'new@example.com'
      }),
      'test-vanity-slug'
    )
  })
})
