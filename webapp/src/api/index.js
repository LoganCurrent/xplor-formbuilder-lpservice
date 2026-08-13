import axios from 'axios'

const localAxiosInstance = axios.create({
  baseURL: `${process.env.API_BASE_URL}landing-pages/`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

export async function fetchLandingPageConfig (landingPageUUID) {
  const url = `${landingPageUUID}/params`
  let response = await localAxiosInstance.get(url)
  return response.data
}

export async function fetchMTConfig (subdomain) {
  const url = `https://${subdomain}.marianatek.com/api/customer/v1/config`
  let response = await axios.get(url)
  return response.data
}

export async function fetchMTIframeConfig (subdomain) {
  const url = `https://${subdomain}.marianaiframes.com/config`
  let response = await axios.get(url)
  return response.data
}

export async function calculateCartData (landingPageUUID, accessToken) {
  const payload = {
    accessToken
  }
  const getCartUrl = `${landingPageUUID}/calculate-cart-data`
  let results = await localAxiosInstance.post(getCartUrl, payload)

  return {
    cartLocationId: results.data.cartLocationId,
    childProductId: results.data.childProductId
  }
}

export async function buildCart (landingPageUUID, accessToken, locationId, childProductId) {
  const payload = {
    accessToken,
    locationId,
    childProductId
  }
  const getCartUrl = `${landingPageUUID}/build-cart`
  let cartData = await localAxiosInstance.post(getCartUrl, payload)
  return cartData.data.cart
}

export async function applyDiscount (landingPageUUID, accessToken, locationId) {
  const payload = {
    accessToken,
    locationId
  }
  const getCartUrl = `${landingPageUUID}/apply-discount`
  let cartData = await localAxiosInstance.post(getCartUrl, payload)
  return cartData.data.cart
}

export async function captureLandingPageViewEvent (landingPageUUID, accessToken) {
  try {
    const payload = {
      accessToken
    }
    const getCartUrl = `${landingPageUUID}/capture-view`
    await localAxiosInstance.post(getCartUrl, payload)
  } catch (error) {
    console.log(error)
    if (error.response && error.response.status === 400) {
      const data = error.response.data || {}
      const err = new Error(data.message)
      err.errorKey = data.error_key
      err.status = error.response.status
      throw err
    }
  }
}

export async function captureCheckoutEvent (
  landingPageUUID,
  mtUserId,
  purchaseAmount,
  productId,
  accessToken,
  order,
  orderId
) {
  try {
    const payload = {
      mtUserId,
      purchaseAmount,
      productId,
      accessToken,
      order,
      orderId
    }
    const getCartUrl = `${landingPageUUID}/capture-checkout`
    await localAxiosInstance.post(getCartUrl, payload)
  } catch (error) {
    console.log(error)
    if (error.response && error.response.status === 400) {
      const data = error.response.data || {}
      const err = new Error(data.message)
      err.errorKey = data.error_key
      err.status = error.response.status
      throw err
    }
  }
}
