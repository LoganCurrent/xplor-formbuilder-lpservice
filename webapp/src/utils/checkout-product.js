export function getConfiguredProductId (parameters) {
  if (!parameters || !parameters.product) {
    return null
  }

  const product = parameters.product
  if (product.id != null) {
    return product.id
  }
  if (product.productId != null) {
    return product.productId
  }
  if (product.product_id != null) {
    return product.product_id
  }

  return null
}

export function getPurchasedProductIds (order) {
  if (!order || !Array.isArray(order.orderLines)) {
    return []
  }

  return order.orderLines
    .map((line) => {
      if (!line) {
        return null
      }

      if (line.productId != null) {
        return line.productId
      }
      if (line.product_id != null) {
        return line.product_id
      }
      if (line.product && line.product.id != null) {
        return line.product.id
      }
      if (line.id != null) {
        return line.id
      }

      return null
    })
    .filter((id) => id != null)
}

export function purchaseMatchesConfiguredProduct (parameters, order) {
  const configuredProductId = getConfiguredProductId(parameters)
  if (configuredProductId == null) {
    return true
  }

  const purchasedProductIds = getPurchasedProductIds(order)
  if (!purchasedProductIds.length) {
    return false
  }

  const normalizedConfigured = String(configuredProductId)
  return purchasedProductIds.some((id) => String(id) === normalizedConfigured)
}

export function resolveAttributedProductId (parameters, order) {
  const configuredProductId = getConfiguredProductId(parameters)
  const purchasedProductIds = getPurchasedProductIds(order)

  if (configuredProductId != null) {
    const normalizedConfigured = String(configuredProductId)
    const matchingPurchasedId = purchasedProductIds.find(
      (id) => String(id) === normalizedConfigured
    )
    if (matchingPurchasedId != null) {
      return matchingPurchasedId
    }
    return configuredProductId
  }

  if (purchasedProductIds.length) {
    return purchasedProductIds[0]
  }

  return null
}
