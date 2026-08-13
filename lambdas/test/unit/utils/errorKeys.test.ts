import { ERROR_KEYS, buildErrorBody } from '../../../src/utils/errorKeys';

describe('errorKeys', () => {
  describe('ERROR_KEYS catalog', () => {
    it('exposes all expected dot-notation keys', () => {
      expect(ERROR_KEYS.LP_PERMISSION_DENIED).toBe(
        'error.lp.permission_denied'
      );
      expect(ERROR_KEYS.LP_CAPTURE_VIEW_FAILED).toBe(
        'error.lp.capture_view_failed'
      );
      expect(ERROR_KEYS.LP_CAPTURE_CHECKOUT_FAILED).toBe(
        'error.lp.capture_checkout_failed'
      );
      expect(ERROR_KEYS.LP_CART_BUILD_FAILED).toBe(
        'error.lp.cart_build_failed'
      );
      expect(ERROR_KEYS.LP_DISCOUNT_FAILED).toBe('error.lp.discount_failed');
      expect(ERROR_KEYS.LP_NOT_FOUND).toBe('error.lp.not_found');
      expect(ERROR_KEYS.LP_PRODUCT_MISMATCH).toBe('error.lp.product_mismatch');
      expect(ERROR_KEYS.SERVER_ERROR).toBe('error.server');
    });

    it('is frozen so values cannot be mutated', () => {
      expect(Object.isFrozen(ERROR_KEYS)).toBe(true);
    });
  });

  describe('buildErrorBody', () => {
    it('omits error_key when useErrorKeys is false', () => {
      const body = buildErrorBody({
        message: 'Could not capture LP view.',
        errorKey: ERROR_KEYS.LP_CAPTURE_VIEW_FAILED,
        useErrorKeys: false,
      });
      expect(body).toEqual({ message: 'Could not capture LP view.' });
      expect(body).not.toHaveProperty('error_key');
    });

    it('includes error_key when useErrorKeys is true and errorKey is set', () => {
      const body = buildErrorBody({
        message: 'Could not capture LP view.',
        errorKey: ERROR_KEYS.LP_CAPTURE_VIEW_FAILED,
        useErrorKeys: true,
      });
      expect(body).toEqual({
        message: 'Could not capture LP view.',
        error_key: 'error.lp.capture_view_failed',
      });
    });

    it('omits error_key when useErrorKeys is true but errorKey is undefined', () => {
      const body = buildErrorBody({
        message: 'whatever',
        errorKey: undefined,
        useErrorKeys: true,
      });
      expect(body).toEqual({ message: 'whatever' });
      expect(body).not.toHaveProperty('error_key');
    });

    it('omits error_key when useErrorKeys is true but errorKey is empty string', () => {
      const body = buildErrorBody({
        message: 'm',
        errorKey: '',
        useErrorKeys: true,
      });
      expect(body).toEqual({ message: 'm' });
      expect(body).not.toHaveProperty('error_key');
    });

    it('uses a custom field name when `field` is provided', () => {
      const body = buildErrorBody({
        field: 'error',
        message: 'Bad input.',
        useErrorKeys: false,
      });
      expect(body).toEqual({ error: 'Bad input.' });
    });

    it('spreads `extra` into the body alongside the message', () => {
      const body = buildErrorBody({
        message: 'Some webhook calls were unsuccessful.',
        useErrorKeys: false,
        extra: { webhook_responses: [{ status: 500 }] },
      });
      expect(body).toEqual({
        message: 'Some webhook calls were unsuccessful.',
        webhook_responses: [{ status: 500 }],
      });
    });

    it('combines field + extra + error_key when flag is on', () => {
      const body = buildErrorBody({
        field: 'error',
        message: 'Bad input.',
        errorKey: ERROR_KEYS.LP_CART_BUILD_FAILED,
        useErrorKeys: true,
        extra: { detail: 'sku missing' },
      });
      expect(body).toEqual({
        error: 'Bad input.',
        detail: 'sku missing',
        error_key: 'error.lp.cart_build_failed',
      });
    });
  });
});
