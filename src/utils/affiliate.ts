import { Product } from '../types';

/**
 * Returns lowest available price across Amazon & Flipkart
 */
export function getLowestPrice(product: Product): { price: number; store: 'amazon' | 'flipkart' | 'equal' | 'none' } {
  const amz = product.amazonPrice && product.amazonPrice > 0 ? product.amazonPrice : null;
  const fk = product.flipkartPrice && product.flipkartPrice > 0 ? product.flipkartPrice : null;

  if (amz !== null && fk !== null) {
    if (amz < fk) return { price: amz, store: 'amazon' };
    if (fk < amz) return { price: fk, store: 'flipkart' };
    return { price: amz, store: 'equal' };
  }

  if (amz !== null) return { price: amz, store: 'amazon' };
  if (fk !== null) return { price: fk, store: 'flipkart' };

  return { price: product.originalPrice, store: 'none' };
}

/**
 * Calculates discount percentage based on original price and best deal
 */
export function getDiscountPercentage(originalPrice: number, dealPrice: number): number {
  if (!originalPrice || originalPrice <= 0 || !dealPrice || dealPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
}

/**
 * Formats price cleanly into INR (₹)
 */
export function formatCurrency(amountInINR: number): string {
  if (typeof amountInINR !== 'number' || isNaN(amountInINR)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amountInINR);
}
