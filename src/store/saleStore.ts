import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useInventoryStore } from './inventoryStore';
import { parseISO, isSameDay } from 'date-fns';

export interface Sale {
  id: string;
  fruitId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalAmount: number;
  grossProfit: number;
  saleDate: string;
  remark?: string;
  createdAt: string;
}

interface SaleState {
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'totalAmount' | 'costPrice' | 'grossProfit'>) => void;
  getSalesByDate: (date: string) => Sale[];
  getSalesByFruit: (fruitId: string) => Sale[];
  getMonthlySales: (yearMonth: string) => Sale[];
}

const generateId = () => `sale-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useSaleStore = create<SaleState>()(
  persist(
    (set, get) => ({
      sales: [],
      addSale: (sale) => {
        const inventoryItem = useInventoryStore.getState().getInventoryByFruit(sale.fruitId);
        const costPrice = inventoryItem?.avgCostPrice || 0;
        const totalAmount = Number((sale.quantity * sale.unitPrice).toFixed(2));
        const totalCost = Number((sale.quantity * costPrice).toFixed(2));
        const grossProfit = Number((totalAmount - totalCost).toFixed(2));

        const newSale: Sale = {
          ...sale,
          costPrice,
          totalAmount,
          grossProfit,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ sales: [newSale, ...state.sales] }));
        useInventoryStore.getState().updateStock(sale.fruitId, sale.quantity, 'sale');
      },
      getSalesByDate: (date) => {
        const targetDate = parseISO(date);
        return get().sales.filter((s) => isSameDay(parseISO(s.saleDate), targetDate));
      },
      getSalesByFruit: (fruitId) => {
        return get().sales.filter((s) => s.fruitId === fruitId);
      },
      getMonthlySales: (yearMonth) => {
        const [year, month] = yearMonth.split('-').map(Number);
        return get().sales.filter((s) => {
          const d = parseISO(s.saleDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
      },
    }),
    {
      name: 'sale-store',
    }
  )
);
