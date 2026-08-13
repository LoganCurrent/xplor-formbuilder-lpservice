import {
  loadReachAttribution
} from '@/utils/reach'

jest.useFakeTimers()

describe('Reach Attribution', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''

    delete window.reach

    jest.clearAllTimers()

    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('loadReachAttribution', () => {
    it('should load the Reach script with correct URL', () => {
      loadReachAttribution({
        partnerId: 'test-partner-id',
        tenantExternalId: 'test-subdomain'
      })

      const script = document.getElementById('reach-attribution-script')
      expect(script).toBeTruthy()
      expect(script.src).toBe('https://public.embedreach.com/scripts/test-partner-id/test-subdomain/analytics.js')
      expect(script.async).toBe(true)
    })

    it('should not load script if partnerId is missing', () => {
      loadReachAttribution({
        tenantExternalId: 'test-subdomain'
      })

      const script = document.getElementById('reach-attribution-script')
      expect(script).toBeNull()
    })

    it('should not load script if tenantExternalId is missing', () => {
      loadReachAttribution({
        partnerId: 'test-partner-id'
      })

      const script = document.getElementById('reach-attribution-script')
      expect(script).toBeNull()
    })

    it('should not load script twice if already present', () => {
      loadReachAttribution({
        partnerId: 'test-partner-id',
        tenantExternalId: 'test-subdomain'
      })

      const firstScript = document.getElementById('reach-attribution-script')
      const firstScriptSrc = firstScript.src

      loadReachAttribution({
        partnerId: 'different-partner-id',
        tenantExternalId: 'different-subdomain'
      })

      const secondScript = document.getElementById('reach-attribution-script')
      expect(firstScript).toBe(secondScript)
      expect(secondScript.src).toBe(firstScriptSrc)
    })
  })
})
