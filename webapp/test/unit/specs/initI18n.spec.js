import i18n, { initI18n } from '@/i18n'
import { detectLanguage } from '@/i18n/languageDetector'
import { loadTranslations } from '@/i18n/translationLoader'

jest.mock('@/i18n/languageDetector', () => ({
  detectLanguage: jest.fn()
}))

jest.mock('@/i18n/translationLoader', () => ({
  loadTranslations: jest.fn()
}))

describe('initI18n', () => {
  beforeEach(() => {
    detectLanguage.mockReset()
    loadTranslations.mockReset()
    i18n.setLocaleMessage('fr-CA', {})
    i18n.locale = 'en'
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does nothing when useTranslations is false', async () => {
    await initI18n(false)

    expect(detectLanguage).not.toHaveBeenCalled()
    expect(loadTranslations).not.toHaveBeenCalled()
    expect(i18n.locale).toBe('en')
  })

  it('skips loader when detected locale is the default (en-US)', async () => {
    detectLanguage.mockReturnValue('en-US')

    await initI18n(true)

    expect(detectLanguage).toHaveBeenCalledTimes(1)
    expect(loadTranslations).not.toHaveBeenCalled()
    expect(i18n.locale).toBe('en')
  })

  it('loads CDN messages and sets the active locale on success', async () => {
    detectLanguage.mockReturnValue('fr-CA')
    const messages = {
      labels: {
        purchaseSuccessful: 'Achat réussi',
        redirecting: 'Redirection dans 3 secondes...'
      }
    }
    loadTranslations.mockResolvedValue(messages)

    await initI18n(true)

    expect(loadTranslations).toHaveBeenCalledWith('fr-CA')
    expect(i18n.locale).toBe('fr-CA')
    expect(i18n.t('labels.purchaseSuccessful')).toBe('Achat réussi')
    expect(i18n.t('labels.redirecting')).toBe('Redirection dans 3 secondes...')
  })

  it('still sets the locale and falls back to English when CDN returns empty messages', async () => {
    detectLanguage.mockReturnValue('fr-CA')
    loadTranslations.mockResolvedValue({})

    await initI18n(true)

    expect(loadTranslations).toHaveBeenCalledWith('fr-CA')
    expect(i18n.locale).toBe('fr-CA')
    expect(i18n.t('labels.purchaseSuccessful')).toBe('Your purchase was successful.')
  })

  it('falls back to empty messages when CDN exceeds the 3s timeout', async () => {
    jest.useFakeTimers()
    detectLanguage.mockReturnValue('fr-CA')
    loadTranslations.mockReturnValue(new Promise(function () {}))

    const promise = initI18n(true)
    jest.advanceTimersByTime(3000)
    await promise

    expect(i18n.locale).toBe('fr-CA')
    expect(i18n.t('labels.purchaseSuccessful')).toBe('Your purchase was successful.')
  })
})
