import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Fruit {
  id: string;
  name: string;
  emoji: string;
  price: number;
  warningDays: number;
  createdAt: string;
}

interface FruitState {
  fruits: Fruit[];
  addFruit: (fruit: Omit<Fruit, 'id' | 'createdAt'>) => void;
  updateFruit: (id: string, data: Partial<Omit<Fruit, 'id' | 'createdAt'>>) => void;
  deleteFruit: (id: string) => void;
  getFruitById: (id: string) => Fruit | undefined;
}

const initialFruits: Fruit[] = [
  {
    id: 'fruit-1',
    name: '苹果',
    emoji: '🍎',
    price: 8,
    warningDays: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fruit-2',
    name: '香蕉',
    emoji: '🍌',
    price: 5,
    warningDays: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fruit-3',
    name: '橘子',
    emoji: '🍊',
    price: 6,
    warningDays: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fruit-4',
    name: '葡萄',
    emoji: '🍇',
    price: 12,
    warningDays: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fruit-5',
    name: '西瓜',
    emoji: '🍉',
    price: 3.5,
    warningDays: 2,
    createdAt: new Date().toISOString(),
  },
];

const generateId = () => `fruit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useFruitStore = create<FruitState>()(
  persist(
    (set, get) => ({
      fruits: initialFruits,
      addFruit: (fruit) => {
        const newFruit: Fruit = {
          ...fruit,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ fruits: [...state.fruits, newFruit] }));
      },
      updateFruit: (id, data) => {
        set((state) => ({
          fruits: state.fruits.map((f) => (f.id === id ? { ...f, ...data } : f)),
        }));
      },
      deleteFruit: (id) => {
        set((state) => ({ fruits: state.fruits.filter((f) => f.id !== id) }));
      },
      getFruitById: (id) => {
        return get().fruits.find((f) => f.id === id);
      },
    }),
    {
      name: 'fruit-store',
    }
  )
);
