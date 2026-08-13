import { getClient, User } from 'configcat-js-ssr'

let configCatClient

export const initFeatureFlags = () => {
  if (configCatClient) {
    return configCatClient
  }

  const sdkKey = process.env.CONFIGCAT_SDK_KEY
  if (!sdkKey) {
    return null
  }

  configCatClient = getClient(sdkKey)
  return configCatClient
}

export const createFlagUser = (accountId) => {
  if (!accountId) {
    return null
  }

  const id = String(accountId)
  // Match lambdas standardUser: Identifier + custom account_id for ConfigCat targeting
  return new User(id, '', '', { account_id: id })
}

export const getFlagForUser = async (flag, defaultValue, user) => {
  if (!flag) {
    return defaultValue
  }

  const client = initFeatureFlags()
  if (!client) {
    return defaultValue
  }

  try {
    return await client.getValueAsync(flag, defaultValue, user)
  } catch (error) {
    return defaultValue
  }
}
