export function productMatchesConfiguredProduct(
  configuredProductId: number | string | null | undefined,
  purchasedProductId: number | string | null | undefined
): boolean {
  if (configuredProductId == null) {
    return true;
  }

  if (purchasedProductId == null) {
    return false;
  }

  return Number(configuredProductId) === Number(purchasedProductId);
}
