export interface WeightedCostItem {
  quantity: number;
  unitPrice: number;
}

export function calculateWeightedAvgCost(items: WeightedCostItem[]): number {
  if (items.length === 0) return 0;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity === 0) return 0;
  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return totalCost / totalQuantity;
}

export function calculateGrossProfit(
  unitPrice: number,
  costPrice: number,
  quantity: number
): { totalAmount: number; grossProfit: number } {
  const totalAmount = unitPrice * quantity;
  const totalCost = costPrice * quantity;
  const grossProfit = totalAmount - totalCost;
  return { totalAmount, grossProfit };
}

export function calculateDailySalesRate(
  totalSalesQuantity: number,
  days: number
): number {
  if (days <= 0) return 0;
  return totalSalesQuantity / days;
}

export function calculateEstimatedDays(
  stock: number,
  dailySalesRate: number
): number {
  if (dailySalesRate <= 0) return Infinity;
  return stock / dailySalesRate;
}

export function calculateTotalCost(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateLossAmount(quantity: number, avgCostPrice: number): number {
  return quantity * avgCostPrice;
}

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
