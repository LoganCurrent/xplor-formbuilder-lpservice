export interface OrderLineLike {
  line_total?: number | string | null;
  lineTotal?: number | string | null;
  unit_total?: number | string | null;
  unitTotal?: number | string | null;
}

export interface PaymentSourceLike {
  amount?: number | string | null;
}

export interface OrderLike {
  total?: number | string | null;
  subtotal?: number | string | null;
  orderLines?: OrderLineLike[];
  order_lines?: OrderLineLike[];
  paymentSources?: PaymentSourceLike[];
  payment_sources?: PaymentSourceLike[];
  data?: {
    attributes?: {
      total?: number | string | null;
      subtotal?: number | string | null;
    };
  };
}

function parseAmount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function collectAmountCandidates(order: OrderLike): number[] {
  const candidates: number[] = [];

  const addCandidate = (value: number | string | null | undefined) => {
    const parsed = parseAmount(value);
    if (parsed !== null) {
      candidates.push(parsed);
    }
  };

  const attrs = order.data?.attributes;
  if (attrs) {
    addCandidate(attrs.total);
    addCandidate(attrs.subtotal);
  }

  addCandidate(order.total);
  addCandidate(order.subtotal);

  const lines = order.orderLines ?? order.order_lines ?? [];
  for (const line of lines) {
    addCandidate(line.line_total);
    addCandidate(line.lineTotal);
    addCandidate(line.unit_total);
    addCandidate(line.unitTotal);
  }

  const payments = order.paymentSources ?? order.payment_sources ?? [];
  let paymentSum = 0;
  let hasPayment = false;
  for (const payment of payments) {
    const amount = parseAmount(payment.amount);
    if (amount !== null) {
      paymentSum += amount;
      hasPayment = true;
    }
  }
  if (hasPayment) {
    candidates.push(paymentSum);
  }

  return candidates;
}

export function resolvePurchaseAmount(order: OrderLike | null | undefined): number {
  if (!order) {
    return 0;
  }

  const candidates = collectAmountCandidates(order);
  const nonZero = candidates.find((amount) => amount > 0);
  if (nonZero !== undefined) {
    return nonZero;
  }

  return 0;
}

export function formatPurchaseAmount(amount: number | string): string {
  return Number(amount).toFixed(2);
}

export function shouldFetchOrderAmount(
  resolvedAmount: number,
  orderId?: number | string | null
): boolean {
  return resolvedAmount === 0 && orderId !== null && orderId !== undefined && orderId !== '';
}
