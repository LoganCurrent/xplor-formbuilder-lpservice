import {
  getConfiguredProductId,
  getPurchasedProductIds,
  purchaseMatchesConfiguredProduct,
  resolveAttributedProductId
} from '@/utils/checkout-product'

describe('checkout-product utils', () => {
  it('returns configured product id from landing page parameters', () => {
    expect(getConfiguredProductId({ product: { id: 14694 } })).toBe(14694)
  })

  it('extracts purchased product ids from order lines', () => {
    const order = {
      orderLines: [
        { productId: 14694, id: 'line-1' },
        { product_id: 999, id: 'line-2' }
      ]
    }

    expect(getPurchasedProductIds(order)).toEqual([14694, 999])
  })

  it('matches when purchased product equals configured product', () => {
    const parameters = { product: { id: 14694 } }
    const order = { orderLines: [{ productId: 14694, id: 'line-1' }] }

    expect(purchaseMatchesConfiguredProduct(parameters, order)).toBe(true)
  })

  it('does not match when purchased product differs from configured product', () => {
    const parameters = { product: { id: 14694 } }
    const order = { orderLines: [{ productId: 55555, id: 'line-1' }] }

    expect(purchaseMatchesConfiguredProduct(parameters, order)).toBe(false)
  })

  it('resolves attributed product id from matching order line', () => {
    const parameters = { product: { id: 14694 } }
    const order = { orderLines: [{ productId: 14694, id: 'line-1' }] }

    expect(resolveAttributedProductId(parameters, order)).toBe(14694)
  })
})
