/** Work in cents so the order rows always add up to the single payment. */
export function allocateCartDiscount(amounts: number[], discount: number) {
  const cents = amounts.map((amount) => Math.round(amount * 100));
  const subtotal = cents.reduce((sum, amount) => sum + amount, 0);
  const discountCents = Math.min(subtotal, Math.max(0, Math.round(discount * 100)));
  let cumulative = 0;
  let allocated = 0;
  return cents.map((amount) => {
    cumulative += amount;
    const target = subtotal > 0 ? Math.round(cumulative * discountCents / subtotal) : 0;
    const lineDiscount = target - allocated;
    allocated = target;
    return { amount: (amount - lineDiscount) / 100, discount: lineDiscount / 100 };
  });
}