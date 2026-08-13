const REACH_POLL_INTERVAL_MS = 150
const REACH_MAX_ATTEMPTS = 15

const REACH_SCRIPT_ID = 'reach-attribution-script'
const REACH_BASE_URL = 'https://public.embedreach.com/scripts'

export function loadReachAttribution ({ partnerId, tenantExternalId }) {
  if (!partnerId || !tenantExternalId) return

  if (document.getElementById(REACH_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = REACH_SCRIPT_ID
  script.async = true
  script.src = `${REACH_BASE_URL}/${partnerId}/${tenantExternalId}/analytics.js`

  document.head.appendChild(script)
}

export const getReachConfig = ({ partnerId, tenantExternalId }) => {
  if (!partnerId || !tenantExternalId) return null

  return {
    partnerId,
    tenantExternalId
  }
}

const getSessionStorage = () => {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage || null
  } catch (error) {
    return null
  }
}

const waitForReach = () => new Promise((resolve) => {
  if (typeof window === 'undefined') {
    resolve(null)
    return
  }

  if (window.reach && typeof window.reach.createIdentification === 'function') {
    resolve(window.reach)
    return
  }

  let attempts = 0
  const poller = setInterval(() => {
    attempts += 1
    if (window.reach && typeof window.reach.createIdentification === 'function') {
      clearInterval(poller)
      resolve(window.reach)
      return
    }

    if (attempts >= REACH_MAX_ATTEMPTS) {
      clearInterval(poller)
      resolve(null)
    }
  }, REACH_POLL_INTERVAL_MS)
})

export async function triggerReachIdentification ({ userId, email, phone, firstName, lastName, sourceId }) {
  if (!sourceId) {
    console.warn('SourceId is required for Reach identification')
    return false
  }

  const reach = await waitForReach()
  if (!reach) {
    return false
  }

  try {
    const normalizedEmail = typeof email === 'string' ? email.trim() : email
    reach.createIdentification({
      email: normalizedEmail || undefined,
      phone: phone || undefined,
      f_name: firstName || undefined,
      l_name: lastName || undefined,
      source_id: sourceId,
      user_id: userId
    })
    return true
  } catch (error) {
    console.warn('Reach identification failed', error)
    return false
  }
}

export async function handleReachIdentification ({ userId, email, phone, firstName, lastName, sourceId }) {
  if (!sourceId) {
    return triggerReachIdentification({
      email,
      phone,
      firstName,
      lastName,
      sourceId,
      userId
    })
  }

  const storage = getSessionStorage()
  const submissionKey = `reach_identification_${sourceId}_${userId}`
  const lastSubmission = storage && storage.getItem(submissionKey)

  if (lastSubmission) {
    return false
  }

  const success = await triggerReachIdentification({
    email,
    phone,
    firstName,
    lastName,
    sourceId,
    userId
  })

  if (success && storage) {
    storage.setItem(submissionKey, Date.now().toString())
  }
  return success
}
