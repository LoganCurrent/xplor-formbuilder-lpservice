export const ERROR_KEYS = Object.freeze({
  LP_PERMISSION_DENIED: 'error.lp.permission_denied',
  LP_CAPTURE_VIEW_FAILED: 'error.lp.capture_view_failed',
  LP_CAPTURE_CHECKOUT_FAILED: 'error.lp.capture_checkout_failed',
  LP_CART_BUILD_FAILED: 'error.lp.cart_build_failed',
  LP_DISCOUNT_FAILED: 'error.lp.discount_failed',
  LP_NOT_FOUND: 'error.lp.not_found',
  LP_PRODUCT_MISMATCH: 'error.lp.product_mismatch',
  SERVER_ERROR: 'error.server',
});

export interface ErrorBodyInput {
  field?: string;
  message: string;
  errorKey?: string;
  useErrorKeys: boolean;
  extra?: Record<string, unknown>;
}

export type ErrorBody = Record<string, unknown> & { error_key?: string };

export const buildErrorBody = ({
  field = 'message',
  message,
  errorKey,
  useErrorKeys,
  extra = {},
}: ErrorBodyInput): ErrorBody => {
  const body: ErrorBody = { [field]: message, ...extra };
  if (useErrorKeys && errorKey) {
    body.error_key = errorKey;
  }
  return body;
};
