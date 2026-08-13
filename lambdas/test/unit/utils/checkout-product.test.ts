import { productMatchesConfiguredProduct } from '../../../src/utils/checkout-product';

describe('checkout-product utils', () => {
  it('matches when purchased and configured product ids are equal', () => {
    expect(productMatchesConfiguredProduct(14694, 14694)).toBe(true);
    expect(productMatchesConfiguredProduct('14694', 14694)).toBe(true);
  });

  it('does not match when purchased and configured product ids differ', () => {
    expect(productMatchesConfiguredProduct(14694, 55555)).toBe(false);
  });

  it('allows checkout when configured product id is missing', () => {
    expect(productMatchesConfiguredProduct(null, 55555)).toBe(true);
  });
});
