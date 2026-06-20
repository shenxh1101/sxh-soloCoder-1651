import { useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useFruitStore } from '@/store/fruitStore';
import { useSupplierStore } from '@/store/supplierStore';
import { usePurchaseStore } from '@/store/purchaseStore';
import { formatCurrency } from '@/utils/calculation';
import { format as dateFormat } from 'date-fns';
import { cn } from '@/lib/utils';

function StarRating({ score, onChange, readonly }: { score: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hoverScore, setHoverScore] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = (hoverScore || score) >= i;
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHoverScore(i)}
            onMouseLeave={() => !readonly && setHoverScore(0)}
            onClick={() => onChange && onChange(i)}
            className={cn(readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110')}
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-gray-600">{score} 星</span>
    </div>
  );
}

export default function Purchase() {
  const { fruits } = useFruitStore();
  const { suppliers, getSupplierById } = useSupplierStore();
  const { purchases, addPurchase } = usePurchaseStore();

  const [selectedFruitId, setSelectedFruitId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<number>(5);
  const [remark, setRemark] = useState<string>('');

  const totalAmount = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort(
      (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );
  }, [purchases]);

  const handleSubmit = () => {
    if (!selectedFruitId || !selectedSupplierId || !quantity || !unitPrice) {
      return;
    }
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    if (qty <= 0 || price <= 0) {
      return;
    }
    addPurchase({
      fruitId: selectedFruitId,
      supplierId: selectedSupplierId,
      quantity: qty,
      unitPrice: price,
      purchaseDate: new Date().toISOString(),
      qualityScore,
      remark: remark || undefined,
    });
    setSelectedFruitId('');
    setSelectedSupplierId('');
    setQuantity('');
    setUnitPrice('');
    setQualityScore(5);
    setRemark('');
  };

  const getFruitById = (id: string) => fruits.find((f) => f.id === id);

  return (
    <div className="space-y-6">
      <PageHeader title="进货管理" description="记录每日进货信息" />

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">进货录入</h3>

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-gray-700">选择水果</label>
          <div className="flex flex-wrap gap-2">
            {fruits.map((fruit) => (
              <button
                key={fruit.id}
                onClick={() => setSelectedFruitId(fruit.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedFruitId === fruit.id
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{fruit.emoji}</span>
                <span>{fruit.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">供货商</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
            >
              <option value="">请选择供货商</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">进货数量（斤）</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="请输入数量"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">进货单价（元/斤）</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="请输入单价"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">总金额</label>
            <div className="flex h-[42px] items-center rounded-xl border border-gray-200 bg-primary/5 px-4 text-lg font-semibold text-primary">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">本批质量评分</label>
          <StarRating score={qualityScore} onChange={setQualityScore} />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">备注（可选）</label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入备注信息"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedFruitId || !selectedSupplierId || !quantity || !unitPrice}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          提交进货记录
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">进货历史</h3>
        {sortedPurchases.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">暂无进货记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">日期</th>
                  <th className="pb-3 font-medium">水果</th>
                  <th className="pb-3 font-medium">数量</th>
                  <th className="pb-3 font-medium">单价</th>
                  <th className="pb-3 font-medium">总金额</th>
                  <th className="pb-3 font-medium">供货商</th>
                  <th className="pb-3 font-medium">质量评分</th>
                  <th className="pb-3 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                {sortedPurchases.map((p) => {
                  const fruit = getFruitById(p.fruitId);
                  const supplier = getSupplierById(p.supplierId);
                  return (
                    <tr key={p.id} className="border-b border-gray-50 text-sm">
                      <td className="py-3 text-gray-700">
                        {dateFormat(new Date(p.purchaseDate), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{fruit?.emoji}</span>
                          <span className="text-gray-800">{fruit?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700">{p.quantity} 斤</td>
                      <td className="py-3 text-gray-700">{formatCurrency(p.unitPrice)}/斤</td>
                      <td className="py-3 font-semibold text-primary">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="py-3 text-gray-700">{supplier?.name}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {p.qualityScore ? (
                            <>
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-4 w-4',
                                    i <= p.qualityScore! ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                  )}
                                />
                              ))}
                              <span className="ml-1 text-xs text-gray-500">{p.qualityScore}星</span>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 max-w-[150px] truncate">
                        {p.remark || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
