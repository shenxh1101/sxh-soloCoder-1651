import { Link } from "react-router-dom";
import { ShoppingCart, DollarSign, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useFruitStore } from "@/store/fruitStore";
import { usePurchaseStore } from "@/store/purchaseStore";
import { useSaleStore } from "@/store/saleStore";
import { useLossStore } from "@/store/lossStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { formatDate } from "@/utils/date";

export default function Dashboard() {
  const fruits = useFruitStore((state) => state.fruits);
  const getFruitById = useFruitStore((state) => state.getFruitById);
  const getPurchasesByDate = usePurchaseStore((state) => state.getPurchasesByDate);
  const getSalesByDate = useSaleStore((state) => state.getSalesByDate);
  const getLossesByDate = useLossStore((state) => state.getLossesByDate);
  const inventory = useInventoryStore((state) => state.inventory);

  const today = formatDate(new Date());
  const todayPurchases = getPurchasesByDate(today);
  const todaySales = getSalesByDate(today);
  const todayLosses = getLossesByDate(today);

  const todayPurchaseTotal = todayPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const todaySaleTotal = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const todayLossTotal = todayLosses.reduce((sum, l) => sum + l.totalLossAmount, 0);
  const todayGrossProfit = todaySales.reduce((sum, s) => sum + s.grossProfit, 0);

  const warningItems = inventory
    .map((inv) => {
      const fruit = getFruitById(inv.fruitId);
      if (!fruit) return null;
      const daysLeft = inv.dailySalesRate > 0 ? inv.stock / inv.dailySalesRate : Infinity;
      if (daysLeft < fruit.warningDays) {
        return {
          ...inv,
          fruit,
          daysLeft: Number(daysLeft.toFixed(1)),
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div>
      <PageHeader title="仪表盘" description="今日经营概览" />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="今日进货"
          value={`¥${todayPurchaseTotal.toFixed(2)}`}
          icon={ShoppingCart}
          colorScheme="blue"
        />
        <StatCard
          title="今日销售"
          value={`¥${todaySaleTotal.toFixed(2)}`}
          icon={DollarSign}
          colorScheme="green"
        />
        <StatCard
          title="今日损耗"
          value={`¥${todayLossTotal.toFixed(2)}`}
          icon={Trash2}
          colorScheme="red"
        />
        <StatCard
          title="今日毛利"
          value={`¥${todayGrossProfit.toFixed(2)}`}
          icon={TrendingUp}
          colorScheme="orange"
        />
      </div>

      {warningItems.length > 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 p-6 text-white shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            <h3 className="text-lg font-bold">库存预警</h3>
            <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm">
              {warningItems.length} 种
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warningItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-transform hover:bg-white/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.fruit.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{item.fruit.name}</p>
                    <p className="text-sm text-white/80">
                      剩余库存：{item.stock.toFixed(1)} 斤
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">预计可售</span>
                  <span className="text-xl font-bold">{item.daysLeft} 天</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">快捷操作</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/purchase"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 text-blue-600 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-4xl text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              📥
            </div>
            <span className="text-lg font-semibold">进货</span>
            <span className="text-sm text-blue-500">录入进货记录</span>
          </Link>
          <Link
            to="/sales"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-8 text-green-600 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-br hover:from-green-100 hover:to-green-200 hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 text-4xl text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              💰
            </div>
            <span className="text-lg font-semibold">销售</span>
            <span className="text-sm text-green-500">录入销售记录</span>
          </Link>
          <Link
            to="/loss"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 p-8 text-red-600 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500 text-4xl text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              🗑️
            </div>
            <span className="text-lg font-semibold">损耗</span>
            <span className="text-sm text-red-500">录入损耗记录</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
