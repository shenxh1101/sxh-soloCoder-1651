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
import { cn } from '@/lib/utils';

type SalesSortType = 'quantity' | 'totalAmount' | 'grossProfit' | 'lossQuantity';
type LossSortType = 'lossQuantity' | 'lossRate';

interface SaleRankItem {
  fruitId: string;
  name: string;
  emoji: string;
  quantity: number;
  totalAmount: number;
  grossProfit: number;
  lossQuantity: number;
  lossRate: number;
  purchaseAdvice: '建议多进' | '建议少进' | '正常';
  comprehensiveScore: number;
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

const SALES_SORT_TABS: { key: SalesSortType; label: string }[] = [
  { key: 'quantity', label: '销量' },
  { key: 'totalAmount', label: '销售额' },
  { key: 'grossProfit', label: '毛利' },
  { key: 'lossQuantity', label: '损耗斤数' },
];

const LOSS_SORT_TABS: { key: LossSortType; label: string }[] = [
  { key: 'lossQuantity', label: '损耗斤数' },
  { key: 'lossRate', label: '损耗率' },
];

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#86efac', '#86efac', '#6ee7b7'];

function getPurchaseAdvice(item: { quantity: number; grossProfit: number; lossRate: number }): '建议多进' | '建议少进' | '正常' {
  const isHighProfit = item.grossProfit > 500;
  const isHighSales = item.quantity > 100;
  const isLowLoss = item.lossRate < 10;
  const isLowProfit = item.grossProfit < 100;
  const isLowSales = item.quantity < 20;
  const isHighLoss = item.lossRate > 20;

  if (isHighProfit && isHighSales && isLowLoss) {
    return '建议多进';
  }
  if (isLowProfit && isLowSales && isHighLoss) {
    return '建议少进';
  }
  return '正常';
}

function getAdviceStyle(advice: string) {
  switch (advice) {
    case '建议多进':
      return 'bg-green-100 text-green-700';
    case '建议少进':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function calculateComprehensiveScore(item: { quantity: number; totalAmount: number; grossProfit: number; lossRate: number }, maxValues: { quantity: number; totalAmount: number; grossProfit: number }) {
  const quantityScore = maxValues.quantity > 0 ? (item.quantity / maxValues.quantity) * 30 : 0;
  const amountScore = maxValues.totalAmount > 0 ? (item.totalAmount / maxValues.totalAmount) * 25 : 0;
  const profitScore = maxValues.grossProfit > 0 ? (item.grossProfit / maxValues.grossProfit) * 35 : 0;
  const lossScore = Math.max(0, 10 - item.lossRate);
  
  return Math.round(quantityScore + amountScore + profitScore + lossScore);
}

export default function ReportsPage() {
  const fruits = useFruitStore((s) => s.fruits);
  const getMonthlySales = useSaleStore((s) => s.getMonthlySales);
  const getMonthlyLosses = useLossStore((s) => s.getMonthlyLosses);

  const currentMonth = format(new Date(), 'yyyy-MM', { locale: zhCN });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [salesSortType, setSalesSortType] = useState<SalesSortType>('grossProfit');
  const [lossSortType, setLossSortType] = useState<LossSortType>('lossRate');

  const monthlySales = useMemo(() => getMonthlySales(selectedMonth), [selectedMonth, getMonthlySales]);
  const monthlyLosses = useMemo(() => getMonthlyLosses(selectedMonth), [selectedMonth, getMonthlyLosses]);

  const salesRanking = useMemo<SaleRankItem[]>(() => {
    const saleMap = new Map<string, { quantity: number; totalAmount: number; grossProfit: number }>();
    monthlySales.forEach((sale: Sale) => {
      const prev = saleMap.get(sale.fruitId) || { quantity: 0, totalAmount: 0, grossProfit: 0 };
      saleMap.set(sale.fruitId, {
        quantity: prev.quantity + sale.quantity,
        totalAmount: prev.totalAmount + sale.totalAmount,
        grossProfit: prev.grossProfit + sale.grossProfit,
      });
    });

    const lossMap = new Map<string, { quantity: number; amount: number }>();
    monthlyLosses.forEach((loss: Loss) => {
      const prev = lossMap.get(loss.fruitId) || { quantity: 0, amount: 0 };
      lossMap.set(loss.fruitId, {
        quantity: prev.quantity + loss.quantity,
        amount: prev.amount + loss.totalLossAmount,
      });
    });

    const tempItems: Array<Omit<SaleRankItem, 'purchaseAdvice' | 'comprehensiveScore'>> = [];
    fruits.forEach((fruit) => {
      const saleData = saleMap.get(fruit.id) || { quantity: 0, totalAmount: 0, grossProfit: 0 };
      const lossData = lossMap.get(fruit.id) || { quantity: 0, amount: 0 };
      const totalQty = saleData.quantity + lossData.quantity;
      const lossRate = totalQty > 0 ? (lossData.quantity / totalQty) * 100 : 0;

      if (saleData.quantity > 0 || saleData.totalAmount > 0 || lossData.quantity > 0) {
        tempItems.push({
          fruitId: fruit.id,
          name: fruit.name,
          emoji: fruit.emoji,
          quantity: saleData.quantity,
          totalAmount: saleData.totalAmount,
          grossProfit: saleData.grossProfit,
          lossQuantity: lossData.quantity,
          lossRate: Number(lossRate.toFixed(2)),
        });
      }
    });

    const maxValues = {
      quantity: Math.max(...tempItems.map(i => i.quantity), 1),
      totalAmount: Math.max(...tempItems.map(i => i.totalAmount), 1),
      grossProfit: Math.max(...tempItems.map(i => i.grossProfit), 1),
    };

    const itemsWithAdvice = tempItems.map(item => ({
      ...item,
      purchaseAdvice: getPurchaseAdvice(item),
      comprehensiveScore: calculateComprehensiveScore(item, maxValues),
    }));

    return itemsWithAdvice.sort((a, b) => {
      switch (salesSortType) {
        case 'quantity':
          return b.quantity - a.quantity;
        case 'totalAmount':
          return b.totalAmount - a.totalAmount;
        case 'grossProfit':
          return b.grossProfit - a.grossProfit;
        case 'lossQuantity':
          return b.lossQuantity - a.lossQuantity;
        default:
          return b.grossProfit - a.grossProfit;
      }
    });
  }, [fruits, monthlySales, monthlyLosses, salesSortType]);

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

    return result.sort((a, b) => {
      if (lossSortType === 'lossQuantity') {
        return b.lossQuantity - a.lossQuantity;
      }
      return b.lossRate - a.lossRate;
    });
  }, [fruits, monthlySales, monthlyLosses, lossSortType]);

  const salesChartData = useMemo(() => {
    const keyMap: Record<SalesSortType, string> = {
      quantity: '销量',
      totalAmount: '销售额',
      grossProfit: '毛利',
      lossQuantity: '损耗斤数',
    };
    const dataKey = keyMap[salesSortType];
    return salesRanking.map((item) => ({
      name: `${item.emoji}${item.name}`,
      [dataKey]: salesSortType === 'quantity' || salesSortType === 'lossQuantity' 
        ? Number(item[salesSortType].toFixed(1)) 
        : Number(item[salesSortType].toFixed(2)),
    }));
  }, [salesRanking, salesSortType]);

  const lossChartData = useMemo(
    () => lossRanking.map((item) => ({ 
      name: `${item.emoji}${item.name}`, 
      [lossSortType === 'lossQuantity' ? '损耗斤数' : '损耗率']: 
        lossSortType === 'lossQuantity' ? item.lossQuantity : item.lossRate 
    })),
    [lossRanking, lossSortType]
  );

  const getChartDataKey = () => {
    const keyMap: Record<SalesSortType, string> = {
      quantity: '销量',
      totalAmount: '销售额',
      grossProfit: '毛利',
      lossQuantity: '损耗斤数',
    };
    return keyMap[salesSortType];
  };

  const getChartFormatter = () => {
    switch (salesSortType) {
      case 'quantity':
      case 'lossQuantity':
        return (value: number) => [`${value.toFixed(1)} 斤`, getChartDataKey()];
      case 'totalAmount':
      case 'grossProfit':
        return (value: number) => [`¥${value.toFixed(2)}`, getChartDataKey()];
      default:
        return (value: number) => [value, getChartDataKey()];
    }
  };

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800">销售排行榜</h3>
          <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
            {SALES_SORT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSalesSortType(tab.key)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
                  salesSortType === tab.key
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
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
                    formatter={getChartFormatter()}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey={getChartDataKey()} radius={[0, 8, 8, 0]}>
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
                    <th className="py-3 text-right font-medium text-gray-500">损耗率</th>
                    <th className="py-3 text-right font-medium text-gray-500">综合评分</th>
                    <th className="py-3 text-center font-medium text-gray-500">进货建议</th>
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
                      <td className="py-3 text-right">
                        <span className={`font-semibold ${
                          item.lossRate >= 20 ? 'text-red-600' :
                          item.lossRate >= 10 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {item.lossRate}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${
                          item.comprehensiveScore >= 80 ? 'text-green-600' :
                          item.comprehensiveScore >= 60 ? 'text-orange-600' :
                          'text-gray-600'
                        }`}>
                          {item.comprehensiveScore}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-medium', getAdviceStyle(item.purchaseAdvice))}>
                          {item.purchaseAdvice}
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

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800">损耗排行榜</h3>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {LOSS_SORT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setLossSortType(tab.key)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
                  lossSortType === tab.key
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {lossRanking.length === 0 ? (
          <div className="py-12 text-center text-gray-400">该月暂无数据</div>
        ) : (
          <>
            <div className="mb-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossChartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    unit={lossSortType === 'lossRate' ? '%' : ' 斤'} 
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12, fill: '#374151' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      lossSortType === 'lossRate' ? `${value}%` : `${value.toFixed(1)} 斤`, 
                      lossSortType === 'lossRate' ? '损耗率' : '损耗斤数'
                    ]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey={lossSortType === 'lossQuantity' ? '损耗斤数' : '损耗率'} radius={[0, 8, 8, 0]}>
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
