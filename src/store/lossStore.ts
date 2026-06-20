import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useInventoryStore } from './inventoryStore';
import { parseISO, isSameDay } from 'date-fns';

export interface Loss {
  id: string;
  fruitId: string;
  quantity: number;
  unitCostPrice: number;
  totalLossAmount: number;
  lossReason: string;
  lossDate: string;
  remark?: string;
  createdAt: string;
}

interface LossState {
  losses: Loss[];
  addLoss: (loss: Omit<Loss, 'id' | 'createdAt' | 'unitCostPrice' | 'totalLossAmount'>) => void;
  getLossesByDate: (date: string) => Loss[];
  getLossesByFruit: (fruitId: string) => Loss[];
  getMonthlyLosses: (yearMonth: string) => Loss[];
}

const generateId = () => `loss-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useLossStore = create<LossState>()(
  persist(
    (set, get) => ({
      losses: [],
      addLoss: (loss) => {
        const inventoryItem = useInventoryStore.getState().getInventoryByFruit(loss.fruitId);
        const unitCostPrice = inventoryItem?.avgCostPrice || 0;
        const totalLossAmount = Number((loss.quantity * unitCostPrice).toFixed(2));

        const newLoss: Loss = {
          ...loss,
          unitCostPrice,
          totalLossAmount,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ losses: [newLoss, ...state.losses] }));
        useInventoryStore.getState().updateStock(loss.fruitId, loss.quantity, 'loss');
      },
      getLossesByDate: (date) => {
        const targetDate = parseISO(date);
        return get().losses.filter((l) => isSameDay(parseISO(l.lossDate), targetDate));
      },
      getLossesByFruit: (fruitId) => {
        return get().losses.filter((l) => l.fruitId === fruitId);
      },
      getMonthlyLosses: (yearMonth) => {
        const [year, month] = yearMonth.split('-').map(Number);
        return get().losses.filter((l) => {
          const d = parseISO(l.lossDate);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
      },
    }),
    {
      name: 'loss-store',
    }
  )
);
