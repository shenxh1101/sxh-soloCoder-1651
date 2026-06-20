import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  qualityScore: number;
  createdAt: string;
}

interface SupplierState {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'qualityScore'> & { qualityScore?: number }) => void;
  updateSupplier: (id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt'>>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
  updateQualityScore: (id: string, score: number) => void;
}

const initialSuppliers: Supplier[] = [
  {
    id: 'supplier-1',
    name: '阳光果园',
    contactPerson: '张三',
    phone: '13800138001',
    address: '山东省烟台市果园路88号',
    qualityScore: 95,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'supplier-2',
    name: '绿色农产品有限公司',
    contactPerson: '李四',
    phone: '13900139002',
    address: '广东省广州市白云区农贸批发市场',
    qualityScore: 88,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'supplier-3',
    name: '海南热带水果基地',
    contactPerson: '王五',
    phone: '13700137003',
    address: '海南省海口市琼山区热带水果产业园',
    qualityScore: 92,
    createdAt: new Date().toISOString(),
  },
];

const generateId = () => `supplier-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: initialSuppliers,
      addSupplier: (supplier) => {
        const newSupplier: Supplier = {
          qualityScore: 80,
          ...supplier,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ suppliers: [...state.suppliers, newSupplier] }));
      },
      updateSupplier: (id, data) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },
      deleteSupplier: (id) => {
        set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
      },
      getSupplierById: (id) => {
        return get().suppliers.find((s) => s.id === id);
      },
      updateQualityScore: (id, score) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, qualityScore: score } : s
          ),
        }));
      },
    }),
    {
      name: 'supplier-store',
    }
  )
);
