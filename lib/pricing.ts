/**
 * Prix après promotion : applique un pourcentage de réduction au prix de base
 * et arrondit à l'unité la plus proche (devise sans décimales, ex: XOF).
 */
export function getDiscountedPrice(basePrice: number, discountPercent?: number | null): number {
  if (!discountPercent || discountPercent <= 0) return basePrice;
  const pct = Math.min(100, Math.max(0, discountPercent));
  return Math.round(basePrice * (1 - pct / 100));
}

export function hasActiveDiscount(discountPercent?: number | null): boolean {
  return !!discountPercent && discountPercent > 0;
}
