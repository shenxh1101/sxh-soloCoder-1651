import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useInventoryStore } from './inventoryStore';
import { format, parseISO, isSameDay, isSameMonth } from 'date-fns';

export interface Purchase {
  id: string;
  fruitId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  purchaseDate: string;
  remark?: string;
  createdAt: string;
}

interface PurchaseState {
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'totalAmount'>) => void;
  getPurchasesByDate: (date: string) => Purchase[];
  getPurchasesByFruit: (fruitId: string) => Purchase[];
  getPurchasesBySupplier: (supplierId: string) => Purchase[];
  getMonthlyPurchases: (yearMonth: string) => Purchase[];
}

const generateId = () => `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      purchases: [],
      addPurchase: (purchase) => {
        const totalAmount = Number((purchase.quantity * purchase.unitPrice).toFixed(2));
        const newPurchase: Purchase = {
          ...purchase,
          totalAmount,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ purchases: [newPurchase, ...state.purchases] }));
        useInventoryStore.getState().updateStock(purchase.fruitId, purchase.quantity, 'purchase');
        useInventoryStore.getState().updateAvgCostPrice(purchase.fruitId, purchase.unitPrice, purchase.quantity);
      },
      getPurchasesByDate: (date) => {
        const targetDate = parseISO(date);
        return get().purchases.filter((p) => isSameDay(parseISO(p.purchaseDate), targetDate));
      },
      getPurchasesByFruit: (fruitId) => {
        return get().purchases.filter((p) => p.fruitId === fruitId);
      },
      getPurchasesBySupplier: (supplierId) => {
        return get().purchases.filter((p) => p.supplierId === supplierId);
      },
      getMonthlyPurchases: (yearMonth) => {
        const [year, month] = yearMonth.split('-').map(Number);
        return get().purchases.filter((p) => {
          const d = parseISO(p.purchaseDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
      },
    }),
    {
      name: 'purchase-store',
    }
  )
);
