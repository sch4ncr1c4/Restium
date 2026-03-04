export function calcTotals(items, meta) {
  const subtotal = items.reduce((acc, item) => {
    if (item.deleted) return acc;
    return acc + item.price * item.qty;
  }, 0);

  const discount = Math.min(Math.max(meta.discountAmount || 0, 0), subtotal);
  const afterDiscount = Math.max(0, subtotal - discount);
  const deposit = Math.min(Math.max(meta.depositAmount || 0, 0), afterDiscount);

  return { subtotal, discount, deposit, total: afterDiscount - deposit };
}
