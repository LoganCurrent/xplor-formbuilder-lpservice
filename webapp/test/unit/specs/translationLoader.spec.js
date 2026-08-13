import {
  loadTranslations,
  clearTranslationCache
} from '@/i18n/translationLoader'

const FAKE_MESSAGES = { greeting: 'Bonjour', farewell: 'Au revoir' }

const originalCdnUrl = process.env.VUE_APP_CROWDIN_CDN_URL
const originalFetch = global.fetch

describe('translationLoader', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    process.env.VUE_APP_CROWDIN_CDN_URL = 'https://cdn.example.com/dist'

    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(FAKE_MESSAGES)
    })
    global.fetch = fetchMock

    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    global.fetch = originalFetch
  })

  afterAll(() => {
    process.env.VUE_APP_CROWDIN_CDN_URL = originalCdnUrl
  })

  it('fetches from CDN, caches result, and returns messages', async () => {
    const messages = await loadTranslations('fr-CA')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/dist/fr-CA/messages.json')
    expect(messages).toEqual(FAKE_MESSAGES)

    const cached = JSON.parse(localStorage.getItem('lp-i18n-fr-CA'))
    expect(cached.messages).toEqual(FAKE_MESSAGES)
    expect(typeof cached.timestamp).toBe('number')
  })

  it('returns cached data without calling fetch on cache hit', async () => {
    localStorage.setItem(
      'lp-i18n-fr-CA',
      JSON.stringify({ timestamp: Date.now(), messages: FAKE_MESSAGES })
    )

    const messages = await loadTranslations('fr-CA')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(messages).toEqual(FAKE_MESSAGES)
  })

  it('re-fetches after cache expires (24h TTL)', async () => {
    const expiredTimestamp = Date.now() - 24 * 60 * 60 * 1000 - 1
    localStorage.setItem(
      'lp-i18n-fr-CA',
      JSON.stringify({ timestamp: expiredTimestamp, messages: { old: true } })
    )

    const messages = await loadTranslations('fr-CA')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(messages).toEqual(FAKE_MESSAGES)
  })

  it('returns {} on network error without throwing', async () => {
    fetchMock.mockRejectedValue(new Error('Network failure'))

    const messages = await loadTranslations('fr-CA')

    expect(messages).toEqual({})
  })

  it('returns {} on HTTP 404', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 })

    const messages = await loadTranslations('fr-CA')

    expect(messages).toEqual({})
  })

  it('returns {} and skips fetch when CDN URL is missing', async () => {
    process.env.VUE_APP_CROWDIN_CDN_URL = ''

    const messages = await loadTranslations('fr-CA')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(messages).toEqual({})
  })

  it('short-circuits for en-US without fetch or localStorage access', async () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem')

    const messages = await loadTranslations('en-US')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(getItemSpy).not.toHaveBeenCalled()
    expect(messages).toEqual({})
  })

  it('still fetches when localStorage is unavailable', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    const messages = await loadTranslations('fr-CA')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(messages).toEqual(FAKE_MESSAGES)
  })

  it('treats malformed cache JSON as a cache miss', async () => {
    localStorage.setItem('lp-i18n-fr-CA', '{not-valid-json')

    const messages = await loadTranslations('fr-CA')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(messages).toEqual(FAKE_MESSAGES)
  })

  it('returns {} for null/undefined locale', async () => {
    expect(await loadTranslations(null)).toEqual({})
    expect(await loadTranslations(undefined)).toEqual({})
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('strips trailing slashes from CDN URL', async () => {
    process.env.VUE_APP_CROWDIN_CDN_URL = 'https://cdn.example.com/dist///'

    await loadTranslations('fr-CA')

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/dist/fr-CA/messages.json')
  })

  it('fetches using CDN locale alias but caches under canonical app locale', async () => {
    const messages = await loadTranslations('de-DE')

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/dist/de/messages.json')
    expect(messages).toEqual(FAKE_MESSAGES)

    const cached = JSON.parse(localStorage.getItem('lp-i18n-de-DE'))
    expect(cached.messages).toEqual(FAKE_MESSAGES)
    expect(localStorage.getItem('lp-i18n-de')).toBeNull()
  })

  it('uses es-419 CDN path for es-LA app locale', async () => {
    await loadTranslations('es-LA')

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/dist/es-419/messages.json')
  })

  describe('clearTranslationCache', () => {
    it('removes only lp-i18n-* keys from localStorage', () => {
      localStorage.setItem(
        'lp-i18n-fr-CA',
        JSON.stringify({ timestamp: Date.now(), messages: {} })
      )
      localStorage.setItem(
        'lp-i18n-es-LA',
        JSON.stringify({ timestamp: Date.now(), messages: {} })
      )
      localStorage.setItem('unrelated-key', 'keep-me')

      clearTranslationCache()

      expect(localStorage.getItem('lp-i18n-fr-CA')).toBeNull()
      expect(localStorage.getItem('lp-i18n-es-LA')).toBeNull()
      expect(localStorage.getItem('unrelated-key')).toBe('keep-me')
    })

    it('does not throw when localStorage is unavailable', () => {
      localStorage.setItem(
        'lp-i18n-fr-CA',
        JSON.stringify({ timestamp: Date.now(), messages: {} })
      )
      jest.spyOn(Storage.prototype, 'key').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      expect(() => clearTranslationCache()).not.toThrow()
    })
  })
})
