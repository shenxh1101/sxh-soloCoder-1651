import PageHeader from "@/components/PageHeader";
import { useFruitStore } from "@/store/fruitStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { cn } from "@/lib/utils";

export default function Inventory() {
  const getFruitById = useFruitStore((state) => state.getFruitById);
  const inventory = useInventoryStore((state) => state.inventory);

  const inventoryWithFruit = inventory
    .map((inv) => {
      const fruit = getFruitById(inv.fruitId);
      if (!fruit) return null;
      const daysLeft = inv.dailySalesRate > 0 ? inv.stock / inv.dailySalesRate : Infinity;
      let status: "充足" | "预警" | "不足";
      if (inv.stock <= 0) {
        status = "不足";
      } else if (daysLeft < fruit.warningDays) {
        status = "预警";
      } else {
        status = "充足";
      }
      return {
        ...inv,
        fruit,
        daysLeft: inv.dailySalesRate > 0 ? Number(daysLeft.toFixed(1)) : Infinity,
        status,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

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
                    item.status !== "充足" ? "text-red-600" : "text-gray-800"
                  )}
                >
                  {item.daysLeft === Infinity ? "∞" : `${item.daysLeft} 天`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
