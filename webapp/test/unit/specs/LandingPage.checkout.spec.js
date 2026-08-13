import { shallowMount } from '@vue/test-utils'
import LandingPage from '@/components/LandingPage.vue'
import EventBus from '@/event-bus'
import {
  fetchLandingPageConfig,
  captureCheckoutEvent,
  fetchMTConfig,
  fetchMTIframeConfig
} from '@/api'

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

describe('LandingPage checkout attribution', () => {
  const baseParameters = {
    name: 'Intro Offer',
    subdomain: 'demo',
    vanity: 'intro-offer',
    account_name: 'Demo Account',
    template: {
      'key-page-color': '#ffffff',
      'key-page-header-color': '#000000',
      'key-logo': 'https://example.com/logo.png',
      'key-logo-width': 120
    },
    product: { id: 14694, price: 100 },
    currency: 'USD',
    enableReachAdvancedIdentification: false,
    validateCheckoutProduct: false
  }

  beforeEach(() => {
    window.landingPageUuid = 'lp-uuid'
    global.landingPageUuid = 'lp-uuid'
    window.fbq = jest.fn()
    jest.clearAllMocks()
    fetchLandingPageConfig.mockResolvedValue({ parameters: { ...baseParameters } })
    fetchMTConfig.mockResolvedValue({
      is_custom_client_auth_enabled: false,
      custom_client_openid_connect_optional_create_account_endpoint: null,
      brand_name: 'Brand'
    })
    fetchMTIframeConfig.mockResolvedValue({ mtConfig: {} })
    captureCheckoutEvent.mockResolvedValue()
  })

  it('skips attribution when purchased product does not match landing page product', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    fetchLandingPageConfig.mockResolvedValue({
      parameters: { ...baseParameters, validateCheckoutProduct: true }
    })
    const wrapper = createWrapper()

    await wrapper.vm.getParameters()
    wrapper.vm.mtoauth = { getAccessToken: jest.fn(() => 'token'), isAuthenticated: jest.fn(() => false) }

    await window.MT_CONFIG.events.onCheckoutComplete({
      userId: '39078',
      order: {
        total: 20,
        orderLines: [{ productId: 55555, id: 'line-1' }]
      }
    })

    expect(EventBus.$emit).toHaveBeenCalledWith('show_success')
    expect(captureCheckoutEvent).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('records attribution for mismatched product when validateCheckoutProduct flag is off', async () => {
    fetchLandingPageConfig.mockResolvedValue({
      parameters: { ...baseParameters, validateCheckoutProduct: false }
    })
    const wrapper = createWrapper()

    await wrapper.vm.getParameters()
    wrapper.vm.mtoauth = { getAccessToken: jest.fn(() => 'token'), isAuthenticated: jest.fn(() => false) }

    const order = {
      total: 20,
      orderLines: [{ productId: 55555, id: 'line-1' }]
    }

    await window.MT_CONFIG.events.onCheckoutComplete({
      userId: '39078',
      order
    })

    expect(captureCheckoutEvent).toHaveBeenCalledWith(
      'lp-uuid',
      '39078',
      20,
      'line-1',
      'token',
      order,
      undefined
    )
  })

  it('records attribution with resolved product id when validateCheckoutProduct flag is on', async () => {
    fetchLandingPageConfig.mockResolvedValue({
      parameters: { ...baseParameters, validateCheckoutProduct: true }
    })
    const wrapper = createWrapper()

    await wrapper.vm.getParameters()
    wrapper.vm.mtoauth = { getAccessToken: jest.fn(() => 'token'), isAuthenticated: jest.fn(() => false) }

    const order = {
      total: 20,
      orderLines: [{ productId: 14694, id: 'line-1' }]
    }

    await window.MT_CONFIG.events.onCheckoutComplete({
      userId: '39078',
      order
    })

    expect(captureCheckoutEvent).toHaveBeenCalledWith(
      'lp-uuid',
      '39078',
      20,
      14694,
      'token',
      order,
      undefined
    )
  })

  it('records attribution with order line id when validateCheckoutProduct flag is off', async () => {
    const wrapper = createWrapper()

    await wrapper.vm.getParameters()
    wrapper.vm.mtoauth = { getAccessToken: jest.fn(() => 'token'), isAuthenticated: jest.fn(() => false) }

    const order = {
      total: 20,
      orderLines: [{ productId: 14694, id: 'line-1' }]
    }

    await window.MT_CONFIG.events.onCheckoutComplete({
      userId: '39078',
      order
    })

    expect(captureCheckoutEvent).toHaveBeenCalledWith(
      'lp-uuid',
      '39078',
      20,
      'line-1',
      'token',
      order,
      undefined
    )
  })
})
