export function backendErrorKeyToI18nKey (errorKey) {
  if (!errorKey || typeof errorKey !== 'string') return null
  return 'errors.' + errorKey.replace(/^error\./, '')
}
