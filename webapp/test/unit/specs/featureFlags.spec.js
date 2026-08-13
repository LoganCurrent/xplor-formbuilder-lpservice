jest.mock('configcat-js-ssr', () => ({
  getClient: jest.fn(),
  User: jest.fn(function User (identifier, email, country, custom) {
    this.identifier = identifier
    this.email = email
    this.country = country
    this.custom = custom
  })
}))

describe('featureFlags utility', () => {
  let featureFlags
  let configcat
  let mockClient
  const originalSdkKey = process.env.CONFIGCAT_SDK_KEY

  const loadModule = () => {
    jest.resetModules()
    configcat = require('configcat-js-ssr')
    mockClient = { getValueAsync: jest.fn() }
    configcat.getClient.mockReturnValue(mockClient)
    featureFlags = require('@/utils/featureFlags')
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.CONFIGCAT_SDK_KEY = 'test-sdk-key'
    loadModule()
  })

  afterAll(() => {
    process.env.CONFIGCAT_SDK_KEY = originalSdkKey
  })

  it('initializes configcat client once and reuses it', () => {
    const firstClient = featureFlags.initFeatureFlags()
    const secondClient = featureFlags.initFeatureFlags()

    expect(configcat.getClient).toHaveBeenCalledTimes(1)
    expect(configcat.getClient).toHaveBeenCalledWith('test-sdk-key')
    expect(firstClient).toBe(mockClient)
    expect(secondClient).toBe(firstClient)
  })

  it('creates a user object for account targeting', () => {
    const user = featureFlags.createFlagUser('acct-123')

    expect(configcat.User).toHaveBeenCalledWith('acct-123', '', '', { account_id: 'acct-123' })
    expect(user).toEqual({
      identifier: 'acct-123',
      email: '',
      country: '',
      custom: { account_id: 'acct-123' }
    })
  })

  it('returns null user when account id is missing', () => {
    const user = featureFlags.createFlagUser()

    expect(user).toBeNull()
    expect(configcat.User).not.toHaveBeenCalled()
  })

  it('returns evaluated flag value for a user', async () => {
    const user = { identifier: 'acct-123' }
    mockClient.getValueAsync.mockResolvedValue(true)

    const value = await featureFlags.getFlagForUser('landingPageTranslations', false, user)

    expect(value).toBe(true)
    expect(mockClient.getValueAsync).toHaveBeenCalledWith('landingPageTranslations', false, user)
  })

  it('returns default when sdk key is missing', async () => {
    process.env.CONFIGCAT_SDK_KEY = ''
    loadModule()

    const value = await featureFlags.getFlagForUser('landingPageTranslations', false, { identifier: 'acct-123' })

    expect(value).toBe(false)
    expect(configcat.getClient).not.toHaveBeenCalled()
  })

  it('returns default when flag lookup throws', async () => {
    mockClient.getValueAsync.mockRejectedValue(new Error('lookup failed'))

    const value = await featureFlags.getFlagForUser('landingPageTranslations', false, { identifier: 'acct-123' })

    expect(value).toBe(false)
  })
})
