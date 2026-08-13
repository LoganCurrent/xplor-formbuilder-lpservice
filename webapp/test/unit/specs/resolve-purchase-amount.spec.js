import { resolvePurchaseAmount } from '@/utils/resolve-purchase-amount'

describe('resolvePurchaseAmount', () => {
  it('uses order total when present', () => {
    expect(resolvePurchaseAmount({ total: 100 })).toBe(100)
  })

  it('falls back to line total when order total is zero', () => {
    expect(resolvePurchaseAmount({
      total: 0,
      orderLines: [{ lineTotal: 100 }]
    })).toBe(100)
  })

  it('returns zero for a legitimate free checkout', () => {
    expect(resolvePurchaseAmount({
      total: 0,
      orderLines: [{ lineTotal: 0 }],
      paymentSources: [{ amount: 0 }]
    })).toBe(0)
  })
})
