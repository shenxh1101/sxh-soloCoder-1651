import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import PageHeader from '@/components/PageHeader';
import { useFruitStore } from '@/store/fruitStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { useLossStore, type Loss } from '@/store/lossStore';
import { cn } from '@/lib/utils';

const LOSS_REASONS = [
  { value: '腐烂', label: '腐烂' },
  { value: '磕碰', label: '磕碰' },
  { value: '其他', label: '其他' },
];

const reasonBadgeClass: Record<string, string> = {
  腐烂: 'bg-red-100 text-red-700',
  磕碰: 'bg-amber-100 text-amber-700',
  其他: 'bg-gray-100 text-gray-700',
};

export default function LossPage() {
  const fruits = useFruitStore((s) => s.fruits);
  const inventory = useInventoryStore((s) => s.inventory);
  const losses = useLossStore((s) => s.losses);
  const addLoss = useLossStore((s) => s.addLoss);

  const [selectedFruitId, setSelectedFruitId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [lossReason, setLossReason] = useState<string>('腐烂');
  const [remark, setRemark] = useState<string>('');

  const selectedInventory = useMemo(
    () => inventory.find((inv) => inv.fruitId === selectedFruitId),
    [inventory, selectedFruitId]
  );

  const totalLossAmount = useMemo(() => {
    const qty = parseFloat(quantity);
    if (!qty || !selectedInventory) return 0;
    return Number((qty * selectedInventory.avgCostPrice).toFixed(2));
  }, [quantity, selectedInventory]);

  const sortedLosses = useMemo(() => {
    return [...losses].sort(
      (a, b) => new Date(b.lossDate).getTime() - new Date(a.lossDate).getTime()
    );
  }, [losses]);

  const handleSubmit = () => {
    const qty = parseFloat(quantity);
    if (!selectedFruitId || !qty || qty <= 0) return;

    addLoss({
      fruitId: selectedFruitId,
      quantity: qty,
      lossReason,
      lossDate: format(new Date(), 'yyyy-MM-dd', { locale: zhCN }),
      remark: remark || undefined,
    });

    setSelectedFruitId('');
    setQuantity('');
    setLossReason('腐烂');
    setRemark('');
  };

  const getFruitById = (id: string) => fruits.find((f) => f.id === id);

  const canSubmit = selectedFruitId && parseFloat(quantity) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="损耗管理"
        description="记录每日挑出的烂果和损耗"
      />

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">损耗录入</h3>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">选择水果</label>
            <div className="flex flex-wrap gap-2">
              {fruits.map((fruit) => {
                const inv = inventory.find((i) => i.fruitId === fruit.id);
                const isSelected = selectedFruitId === fruit.id;
                return (
                  <button
                    key={fruit.id}
                    type="button"
                    onClick={() => setSelectedFruitId(fruit.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-200'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'
                    )}
                  >
                    <span className="text-2xl">{fruit.emoji}</span>
                    <div className="text-left">
                      <div>{fruit.name}</div>
                      <div className="text-xs text-gray-500">库存: {inv?.stock ?? 0} 斤</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedInventory && (
            <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4 text-sm">
              <span className="font-medium text-blue-800">当前库存:</span>
              <span className="text-blue-700">{selectedInventory.stock} 斤</span>
              <span className="font-medium text-blue-800">平均成本价:</span>
              <span className="text-blue-700">¥{selectedInventory.avgCostPrice.toFixed(2)}/斤</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">损耗数量 (斤)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="请输入损耗数量"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-gray-500">斤</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">损耗原因</label>
            <div className="flex gap-2">
              {LOSS_REASONS.map((reason) => {
                const isSelected = lossReason === reason.value;
                return (
                  <label
                    key={reason.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="lossReason"
                      value={reason.value}
                      checked={isSelected}
                      onChange={() => setLossReason(reason.value)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    {reason.label}
                  </label>
                );
              })}
            </div>
          </div>

          {totalLossAmount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4">
              <span className="font-medium text-red-800">损耗金额:</span>
              <span className="text-xl font-bold text-red-600">¥{totalLossAmount.toFixed(2)}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">备注 (可选)</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入备注信息"
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'w-full rounded-xl py-3 text-sm font-semibold text-white transition-all',
              canSubmit
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200'
                : 'cursor-not-allowed bg-gray-300'
            )}
          >
            提交损耗记录
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">损耗记录</h3>
        {sortedLosses.length === 0 ? (
          <div className="py-12 text-center text-gray-400">暂无损耗记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 text-left font-medium text-gray-500">日期</th>
                  <th className="py-3 text-left font-medium text-gray-500">水果</th>
                  <th className="py-3 text-left font-medium text-gray-500">数量</th>
                  <th className="py-3 text-left font-medium text-gray-500">原因</th>
                  <th className="py-3 text-right font-medium text-gray-500">损耗金额</th>
                </tr>
              </thead>
              <tbody>
                {sortedLosses.map((loss: Loss) => {
                  const fruit = getFruitById(loss.fruitId);
                  return (
                    <tr key={loss.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 text-gray-700">
                        {format(parseISO(loss.lossDate), 'yyyy-MM-dd', { locale: zhCN })}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{fruit?.emoji}</span>
                          <span className="text-gray-800">{fruit?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700">{loss.quantity} 斤</td>
                      <td className="py-3">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', reasonBadgeClass[loss.lossReason] || 'bg-gray-100 text-gray-700')}>
                          {loss.lossReason}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-red-600">
                        -¥{loss.totalLossAmount.toFixed(2)}
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
