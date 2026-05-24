export type PaymentMethod = "wallet" | "cash" | "card";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string }[] = [
  { id: "wallet", label: "المحفظة", description: "خصم من رصيدك الحالي (₪ 150)" },
  { id: "cash", label: "الدفع عند الاستلام", description: "تدفع للسائق عند وصول الصهريج" },
  { id: "card", label: "بطاقة (تجريبي)", description: "محاكاة دفع — لا يتم خصم حقيقي" },
];

export const QUANTITY_PRESETS = [250, 500, 1000, 2000, 5000] as const;

export const PRICE_PER_LITER = 0.05;
export const DELIVERY_FEE_RATE = 0.1;
export const MIN_DELIVERY_FEE = 2;

export function paymentMethodLabel(method: string | null | undefined): string {
  return PAYMENT_METHODS.find(m => m.id === method)?.label ?? method ?? "—";
}

export function calcOrderPricing(quantityLiters: number) {
  const subtotal = quantityLiters * PRICE_PER_LITER;
  const deliveryFee = Math.max(subtotal * DELIVERY_FEE_RATE, MIN_DELIVERY_FEE);
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total };
}

export type PlaceOrderPayload = {
  providerId: string;
  quantityLiters: number;
  scheduledAt: string;
  paymentMethod: PaymentMethod;
  deliveryNote?: string;
};
