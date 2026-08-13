import {
  resolvePurchaseAmount,
  formatPurchaseAmount,
  shouldFetchOrderAmount,
} from '../../../src/utils/resolve-purchase-amount';

describe('resolvePurchaseAmount', () => {
  it('uses order total when present', () => {
    expect(resolvePurchaseAmount({ total: 100 })).toBe(100);
  });

  it('falls back to line total when order total is zero', () => {
    expect(resolvePurchaseAmount({
      total: 0,
      orderLines: [{ lineTotal: 100 }],
    })).toBe(100);
  });

  it('falls back to snake_case line total when order total is zero', () => {
    expect(resolvePurchaseAmount({
      total: 0,
      order_lines: [{ line_total: 75.5 }],
    })).toBe(75.5);
  });

  it('falls back to payment source amounts when order total is zero', () => {
    expect(resolvePurchaseAmount({
      total: 0,
      payment_sources: [{ amount: 40 }, { amount: 10 }],
    })).toBe(50);
  });

  it('returns zero for a legitimate free checkout', () => {
    expect(resolvePurchaseAmount({
      total: 0,
      orderLines: [{ lineTotal: 0 }],
      paymentSources: [{ amount: 0 }],
    })).toBe(0);
  });

  it('supports JSON:API order payloads', () => {
    expect(resolvePurchaseAmount({
      data: {
        attributes: {
          total: '125.00',
        },
      },
    })).toBe(125);
  });
});

describe('formatPurchaseAmount', () => {
  it('formats numeric values to two decimal places', () => {
    expect(formatPurchaseAmount(100)).toBe('100.00');
    expect(formatPurchaseAmount('75.5')).toBe('75.50');
  });
});

describe('shouldFetchOrderAmount', () => {
  it('returns true when amount is zero and order id is present', () => {
    expect(shouldFetchOrderAmount(0, 123)).toBe(true);
  });

  it('returns false when amount is non-zero', () => {
    expect(shouldFetchOrderAmount(100, 123)).toBe(false);
  });

  it('returns false when order id is missing', () => {
    expect(shouldFetchOrderAmount(0, null)).toBe(false);
  });
});
