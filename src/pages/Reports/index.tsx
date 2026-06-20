import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import PageHeader from '@/components/PageHeader';
import { useFruitStore } from '@/store/fruitStore';
import { useSaleStore, type Sale } from '@/store/saleStore';
import { useLossStore, type Loss } from '@/store/lossStore';

interface SaleRankItem {
  fruitId: string;
  name: string;
  emoji: string;
  quantity: number;
  totalAmount: number;
  grossProfit: number;
}

interface LossRankItem {
  fruitId: string;
  name: string;
  emoji: string;
  lossQuantity: number;
  lossAmount: number;
  saleQuantity: number;
  lossRate: number;
}

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#86efac', '#86efac', '#6ee7b7'];

export default function ReportsPage() {
  const fruits = useFruitStore((s) => s.fruits);
  const getMonthlySales = useSaleStore((s) => s.getMonthlySales);
  const getMonthlyLosses = useLossStore((s) => s.getMonthlyLosses);

  const currentMonth = format(new Date(), 'yyyy-MM', { locale: zhCN });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  const monthlySales = useMemo(() => getMonthlySales(selectedMonth), [selectedMonth, getMonthlySales]);
  const monthlyLosses = useMemo(() => getMonthlyLosses(selectedMonth), [selectedMonth, getMonthlyLosses]);

  const salesRanking = useMemo<SaleRankItem[]>(() => {
    const map = new Map<string, SaleRankItem>();

    fruits.forEach((fruit) => {
      map.set(fruit.id, {
        fruitId: fruit.id,
        name: fruit.name,
        emoji: fruit.emoji,
        quantity: 0,
        totalAmount: 0,
        grossProfit: 0,
      });
    });

    monthlySales.forEach((sale: Sale) => {
      const item = map.get(sale.fruitId);
      if (item) {
        item.quantity += sale.quantity;
        item.totalAmount += sale.totalAmount;
        item.grossProfit += sale.grossProfit;
      }
    });

    return Array.from(map.values())
      .filter((item) => item.quantity > 0 || item.totalAmount > 0)
      .sort((a, b) => b.grossProfit - a.grossProfit);
  }, [fruits, monthlySales]);

  const lossRanking = useMemo<LossRankItem[]>(() => {
    const saleMap = new Map<string, number>();
    monthlySales.forEach((sale: Sale) => {
      saleMap.set(sale.fruitId, (saleMap.get(sale.fruitId) || 0) + sale.quantity);
    });

    const lossMap = new Map<string, { quantity: number; amount: number }>();
    monthlyLosses.forEach((loss: Loss) => {
      const prev = lossMap.get(loss.fruitId) || { quantity: 0, amount: 0 };
      lossMap.set(loss.fruitId, {
        quantity: prev.quantity + loss.quantity,
        amount: prev.amount + loss.totalLossAmount,
      });
    });

    const result: LossRankItem[] = [];
    fruits.forEach((fruit) => {
      const lossData = lossMap.get(fruit.id) || { quantity: 0, amount: 0 };
      const saleQty = saleMap.get(fruit.id) || 0;
      const totalQty = lossData.quantity + saleQty;
      const lossRate = totalQty > 0 ? (lossData.quantity / totalQty) * 100 : 0;

      if (lossData.quantity > 0 || saleQty > 0) {
        result.push({
          fruitId: fruit.id,
          name: fruit.name,
          emoji: fruit.emoji,
          lossQuantity: lossData.quantity,
          lossAmount: lossData.amount,
          saleQuantity: saleQty,
          lossRate: Number(lossRate.toFixed(2)),
        });
      }
    });

    return result.sort((a, b) => b.lossRate - a.lossRate);
  }, [fruits, monthlySales, monthlyLosses]);

  const salesChartData = useMemo(
    () => salesRanking.map((item) => ({ name: `${item.emoji}${item.name}`, 毛利: item.grossProfit })),
    [salesRanking]
  );

  const lossChartData = useMemo(
    () => lossRanking.map((item) => ({ name: `${item.emoji}${item.name}`, 损耗率: item.lossRate })),
    [lossRanking]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="统计报表"
        description="月度经营数据统计"
        actions={
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">选择月份:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        }
      />

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">销售排行榜</h3>
        {salesRanking.length === 0 ? (
          <div className="py-12 text-center text-gray-400">该月暂无销售数据</div>
        ) : (
          <>
            <div className="mb-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12, fill: '#374151' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '毛利']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="毛利" radius={[0, 8, 8, 0]}>
                    {salesChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 text-left font-medium text-gray-500">排名</th>
                    <th className="py-3 text-left font-medium text-gray-500">水果</th>
                    <th className="py-3 text-right font-medium text-gray-500">销量 (斤)</th>
                    <th className="py-3 text-right font-medium text-gray-500">销售额</th>
                    <th className="py-3 text-right font-medium text-gray-500">毛利</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRanking.map((item, index) => (
                    <tr key={item.fruitId} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-gray-200 text-gray-600' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-700">{item.quantity.toFixed(1)}</td>
                      <td className="py-3 text-right text-gray-700">¥{item.totalAmount.toFixed(2)}</td>
                      <td className="py-3 text-right font-semibold text-green-600">¥{item.grossProfit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">损耗排行榜</h3>
        {lossRanking.length === 0 ? (
          <div className="py-12 text-center text-gray-400">该月暂无数据</div>
        ) : (
          <>
            <div className="mb-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossChartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12, fill: '#374151' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '损耗率']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="损耗率" fill="#ef4444" radius={[0, 8, 8, 0]}>
                    {lossChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : index === 2 ? '#f59e0b' : '#d1d5db'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 text-left font-medium text-gray-500">排名</th>
                    <th className="py-3 text-left font-medium text-gray-500">水果</th>
                    <th className="py-3 text-right font-medium text-gray-500">损耗数量 (斤)</th>
                    <th className="py-3 text-right font-medium text-gray-500">损耗金额</th>
                    <th className="py-3 text-right font-medium text-gray-500">销售数量 (斤)</th>
                    <th className="py-3 text-right font-medium text-gray-500">损耗率</th>
                  </tr>
                </thead>
                <tbody>
                  {lossRanking.map((item, index) => (
                    <tr key={item.fruitId} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-red-100 text-red-700' :
                          index === 1 ? 'bg-orange-100 text-orange-700' :
                          index === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-gray-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-700">{item.lossQuantity.toFixed(1)}</td>
                      <td className="py-3 text-right font-semibold text-red-600">-¥{item.lossAmount.toFixed(2)}</td>
                      <td className="py-3 text-right text-gray-700">{item.saleQuantity.toFixed(1)}</td>
                      <td className="py-3 text-right">
                        <span className={`font-semibold ${
                          item.lossRate >= 20 ? 'text-red-600' :
                          item.lossRate >= 10 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {item.lossRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
