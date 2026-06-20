import { useMemo } from 'react';
import PageHeader from "@/components/PageHeader";
import { useFruitStore } from "@/store/fruitStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { useSaleStore } from "@/store/saleStore";
import { cn } from "@/lib/utils";
import { formatDate, getDaysAgo } from "@/utils/date";
import { calculateDynamicDailySalesRate } from "@/utils/calculation";

export default function Inventory() {
  const getFruitById = useFruitStore((state) => state.getFruitById);
  const inventory = useInventoryStore((state) => state.inventory);
  const getSalesByDateRange = useSaleStore((state) => state.getSalesByDateRange);

  const today = formatDate(new Date());
  const sevenDaysAgo = formatDate(getDaysAgo(6));
  const thirtyDaysAgo = formatDate(getDaysAgo(29));

  const inventoryWithFruit = useMemo(() => {
    const sales7Days = getSalesByDateRange(sevenDaysAgo, today);
    const sales30Days = getSalesByDateRange(thirtyDaysAgo, today);

    return inventory
      .map((inv) => {
        const fruit = getFruitById(inv.fruitId);
        if (!fruit) return null;

        let dailySalesRate = calculateDynamicDailySalesRate(sales7Days, inv.fruitId, 7);

        if (dailySalesRate === 0) {
          dailySalesRate = calculateDynamicDailySalesRate(sales30Days, inv.fruitId, 30);
        }

        const hasSalesData = dailySalesRate > 0;
        const daysLeft = hasSalesData ? inv.stock / dailySalesRate : Infinity;

        let status: "充足" | "预警" | "不足";
        if (inv.stock <= 0) {
          status = "不足";
        } else if (!hasSalesData) {
          status = "充足";
        } else if (daysLeft < fruit.warningDays) {
          status = "预警";
        } else {
          status = "充足";
        }

        return {
          ...inv,
          fruit,
          dailySalesRate: Number(dailySalesRate.toFixed(1)),
          daysLeft: hasSalesData ? Number(daysLeft.toFixed(1)) : Infinity,
          hasSalesData,
          status,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [inventory, getFruitById, getSalesByDateRange, sevenDaysAgo, today, thirtyDaysAgo]);

  const statusConfig = {
    充足: {
      label: "库存充足",
      className: "bg-green-100 text-green-700",
    },
    预警: {
      label: "库存预警",
      className: "bg-yellow-100 text-yellow-700",
    },
    不足: {
      label: "库存不足",
      className: "bg-red-100 text-red-700",
    },
  };

  return (
    <div>
      <PageHeader title="库存管理" description="实时库存与预计可售天数" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {inventoryWithFruit.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-white p-5 shadow-md transition-transform hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.fruit.emoji}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.fruit.name}</h3>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusConfig[item.status].className
                    )}
                  >
                    {statusConfig[item.status].label}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">当前库存</span>
                <span className="font-medium text-gray-800">{item.stock.toFixed(1)} 斤</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">平均成本价</span>
                <span className="font-medium text-gray-800">¥{item.avgCostPrice.toFixed(2)} /斤</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">日均销量</span>
                <span className="font-medium text-gray-800">{item.dailySalesRate.toFixed(1)} 斤/天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">预计可售</span>
                <span
                  className={cn(
                    "font-semibold",
                    !item.hasSalesData ? "text-gray-500" : item.status !== "充足" ? "text-red-600" : "text-gray-800"
                  )}
                >
                  {!item.hasSalesData ? "暂无销售数据" : item.daysLeft === Infinity ? "∞" : `${item.daysLeft} 天`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
