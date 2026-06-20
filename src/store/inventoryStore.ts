import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InventoryItem {
  id: string;
  fruitId: string;
  stock: number;
  avgCostPrice: number;
  dailySalesRate: number;
  lastUpdated: string;
}

interface InventoryState {
  inventory: InventoryItem[];
  updateStock: (fruitId: string, quantity: number, type: 'purchase' | 'sale' | 'loss') => void;
  updateAvgCostPrice: (fruitId: string, newCostPrice: number, quantity: number) => void;
  updateDailySalesRate: (fruitId: string, rate: number) => void;
  getInventoryByFruit: (fruitId: string) => InventoryItem | undefined;
  getLowStockItems: (threshold?: number) => InventoryItem[];
}

const initialInventory: InventoryItem[] = [
  {
    id: 'inventory-1',
    fruitId: 'fruit-1',
    stock: 100,
    avgCostPrice: 5.5,
    dailySalesRate: 15,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inventory-2',
    fruitId: 'fruit-2',
    stock: 150,
    avgCostPrice: 3,
    dailySalesRate: 25,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inventory-3',
    fruitId: 'fruit-3',
    stock: 80,
    avgCostPrice: 4,
    dailySalesRate: 12,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inventory-4',
    fruitId: 'fruit-4',
    stock: 50,
    avgCostPrice: 8,
    dailySalesRate: 8,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inventory-5',
    fruitId: 'fruit-5',
    stock: 30,
    avgCostPrice: 2,
    dailySalesRate: 10,
    lastUpdated: new Date().toISOString(),
  },
];

const generateId = () => `inventory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      inventory: initialInventory,
      updateStock: (fruitId, quantity, type) => {
        set((state) => {
          const existing = state.inventory.find((inv) => inv.fruitId === fruitId);
          if (!existing) {
            const newItem: InventoryItem = {
              id: generateId(),
              fruitId,
              stock: type === 'purchase' ? quantity : 0,
              avgCostPrice: 0,
              dailySalesRate: 0,
              lastUpdated: new Date().toISOString(),
            };
            return { inventory: [...state.inventory, newItem] };
          }

          let newStock = existing.stock;
          if (type === 'purchase') {
            newStock += quantity;
          } else if (type === 'sale' || type === 'loss') {
            newStock = Math.max(0, newStock - quantity);
          }

          return {
            inventory: state.inventory.map((inv) =>
              inv.fruitId === fruitId
                ? { ...inv, stock: newStock, lastUpdated: new Date().toISOString() }
                : inv
            ),
          };
        });
      },
      updateAvgCostPrice: (fruitId, newCostPrice, quantity) => {
        set((state) => ({
          inventory: state.inventory.map((inv) => {
            if (inv.fruitId !== fruitId) return inv;
            const totalCost = inv.avgCostPrice * inv.stock + newCostPrice * quantity;
            const totalStock = inv.stock + quantity;
            const newAvg = totalStock > 0 ? totalCost / totalStock : 0;
            return { ...inv, avgCostPrice: Number(newAvg.toFixed(2)), lastUpdated: new Date().toISOString() };
          }),
        }));
      },
      updateDailySalesRate: (fruitId, rate) => {
        set((state) => ({
          inventory: state.inventory.map((inv) =>
            inv.fruitId === fruitId ? { ...inv, dailySalesRate: rate, lastUpdated: new Date().toISOString() } : inv
          ),
        }));
      },
      getInventoryByFruit: (fruitId) => {
        return get().inventory.find((inv) => inv.fruitId === fruitId);
      },
      getLowStockItems: (threshold = 20) => {
        return get().inventory.filter((inv) => inv.stock <= threshold);
      },
    }),
    {
      name: 'inventory-store',
    }
  )
);
