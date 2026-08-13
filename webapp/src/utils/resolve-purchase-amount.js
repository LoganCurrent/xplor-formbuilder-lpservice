function parseAmount (value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function collectAmountCandidates (order) {
  const candidates = []

  const addCandidate = (value) => {
    const parsed = parseAmount(value)
    if (parsed !== null) {
      candidates.push(parsed)
    }
  }

  const attrs = order.data && order.data.attributes
  if (attrs) {
    addCandidate(attrs.total)
    addCandidate(attrs.subtotal)
  }

  addCandidate(order.total)
  addCandidate(order.subtotal)

  const lines = order.orderLines || order.order_lines || []
  for (const line of lines) {
    addCandidate(line.line_total)
    addCandidate(line.lineTotal)
    addCandidate(line.unit_total)
    addCandidate(line.unitTotal)
  }

  const payments = order.paymentSources || order.payment_sources || []
  let paymentSum = 0
  let hasPayment = false
  for (const payment of payments) {
    const amount = parseAmount(payment.amount)
    if (amount !== null) {
      paymentSum += amount
      hasPayment = true
    }
  }
  if (hasPayment) {
    candidates.push(paymentSum)
  }

  return candidates
}

export function resolvePurchaseAmount (order) {
  if (!order) {
    return 0
  }

  const candidates = collectAmountCandidates(order)
  const nonZero = candidates.find((amount) => amount > 0)
  if (nonZero !== undefined) {
    return nonZero
  }

  return 0
}
