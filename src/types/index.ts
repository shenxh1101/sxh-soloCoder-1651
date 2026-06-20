export interface Fruit {
  id: string;
  name: string;
  emoji: string;
  price: number;
  warningDays: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  qualityScore: number;
  createdAt: string;
}

export interface Purchase {
  id: string;
  fruitId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  purchaseDate: string;
  qualityScore?: number;
  remark?: string;
  createdAt: string;
}

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

export interface InventoryItem {
  id: string;
  fruitId: string;
  stock: number;
  avgCostPrice: number;
  dailySalesRate: number;
  lastUpdated: string;
}
