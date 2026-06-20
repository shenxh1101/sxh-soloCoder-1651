import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useInventoryStore } from './inventoryStore';
import { parseISO, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

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
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'totalAmount' | 'costPrice' | 'grossProfit'>) => { success: boolean; error?: string };
  getSalesByDate: (date: string) => Sale[];
  getSalesByDateRange: (startDate: string, endDate: string) => Sale[];
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
        if (!inventoryItem) {
          return { success: false, error: '库存不存在' };
        }
        if (sale.quantity > inventoryItem.stock) {
          return { success: false, error: '库存不足' };
        }
        const costPrice = inventoryItem.avgCostPrice;
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
        const updatedSales = [newSale, ...get().sales];
        set((state) => ({ sales: updatedSales }));
        useInventoryStore.getState().updateStock(sale.fruitId, sale.quantity, 'sale');
        useInventoryStore.getState().recalculateDailySalesRate(sale.fruitId, 7, updatedSales);
        return { success: true };
      },
      getSalesByDate: (date) => {
        const targetDate = parseISO(date);
        return get().sales.filter((s) => isSameDay(parseISO(s.saleDate), targetDate));
      },
      getSalesByDateRange: (startDate, endDate) => {
        const start = startOfDay(parseISO(startDate));
        const end = endOfDay(parseISO(endDate));
        return get().sales.filter((s) =>
          isWithinInterval(parseISO(s.saleDate), { start, end })
        );
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
