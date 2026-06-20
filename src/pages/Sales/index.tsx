import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { useFruitStore } from '@/store/fruitStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { useSaleStore } from '@/store/saleStore';
import { formatCurrency } from '@/utils/calculation';
import { format as dateFormat, isToday } from 'date-fns';

export default function Sales() {
  const { fruits, getFruitById } = useFruitStore();
  const { inventory, getInventoryByFruit } = useInventoryStore();
  const { sales, addSale } = useSaleStore();

  const [selectedFruitId, setSelectedFruitId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (selectedFruitId) {
      const fruit = getFruitById(selectedFruitId);
      if (fruit) {
        setUnitPrice(String(fruit.price));
      }
    }
  }, [selectedFruitId, getFruitById]);

  const selectedInventory = useMemo(() => {
    if (!selectedFruitId) return undefined;
    return getInventoryByFruit(selectedFruitId);
  }, [selectedFruitId, getInventoryByFruit]);

  const selectedFruit = useMemo(() => {
    if (!selectedFruitId) return undefined;
    return getFruitById(selectedFruitId);
  }, [selectedFruitId, getFruitById]);

  const totalAmount = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  const estimatedGrossProfit = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const avgCost = selectedInventory?.avgCostPrice || 0;
    return qty * (price - avgCost);
  }, [quantity, unitPrice, selectedInventory]);

  const todaySales = useMemo(() => {
    return sales.filter((s) => isToday(new Date(s.saleDate)));
  }, [sales]);

  const todayTotalAmount = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const todayTotalProfit = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.grossProfit, 0);
  }, [todaySales]);

  const isStockExceeded = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    if (!selectedInventory || qty <= 0) return false;
    return qty > selectedInventory.stock;
  }, [quantity, selectedInventory]);

  useEffect(() => {
    if (isStockExceeded && selectedInventory) {
      setErrorMessage(`库存不足！当前库存仅 ${selectedInventory.stock} 斤`);
    } else {
      setErrorMessage('');
    }
  }, [isStockExceeded, selectedInventory]);

  const handleSubmit = () => {
    if (!selectedFruitId || !quantity || !unitPrice) {
      return;
    }
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    if (qty <= 0 || price <= 0) {
      return;
    }
    if (selectedInventory && qty > selectedInventory.stock) {
      setErrorMessage(`库存不足！当前库存仅 ${selectedInventory.stock} 斤`);
      return;
    }
    const result = addSale({
      fruitId: selectedFruitId,
      quantity: qty,
      unitPrice: price,
      saleDate: new Date().toISOString(),
    });
    if (result.success) {
      setSelectedFruitId('');
      setQuantity('');
      setUnitPrice('');
      setErrorMessage('');
    } else {
      setErrorMessage(result.error || '销售失败，库存不足！');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="销售管理" description="快速录入销售记录" />

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">销售录入</h3>

        {errorMessage && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-5">
          <label className="mb-3 block text-sm font-medium text-gray-700">选择水果</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {fruits.map((fruit) => {
              const inv = inventory.find((i) => i.fruitId === fruit.id);
              const isSelected = selectedFruitId === fruit.id;
              return (
                <button
                  key={fruit.id}
                  onClick={() => setSelectedFruitId(fruit.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-4 transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-4xl">{fruit.emoji}</span>
                  <span className={`mt-2 text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                    {fruit.name}
                  </span>
                  <span className={`mt-1 text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    库存: {inv?.stock || 0}斤
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedFruitId && (
          <div className="mb-4 rounded-xl bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-2xl">{selectedFruit?.emoji}</span>
              <span className="font-medium">{selectedFruit?.name}</span>
              <span className="text-gray-500">当前库存：</span>
              <span className="font-semibold text-primary">
                {selectedInventory?.stock || 0} 斤
              </span>
              {selectedInventory && (
                <span className="text-gray-500">
                  （平均成本：{formatCurrency(selectedInventory.avgCostPrice)}/斤）
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">销售数量（斤）</label>
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
            <label className="mb-2 block text-sm font-medium text-gray-700">销售单价（元/斤）</label>
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
            <label className="mb-2 block text-sm font-medium text-gray-700">销售金额</label>
            <div className="flex h-[42px] items-center rounded-xl border border-gray-200 bg-primary/5 px-4 text-lg font-semibold text-primary">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">预计毛利</label>
            <div className={`flex h-[42px] items-center rounded-xl border border-gray-200 px-4 text-lg font-semibold ${
              estimatedGrossProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {formatCurrency(estimatedGrossProfit)}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedFruitId || !quantity || !unitPrice || isStockExceeded}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {isStockExceeded ? '库存不足' : '提交销售记录'}
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">今日销售流水</h3>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-500">今日销售额：</span>
              <span className="font-semibold text-primary">{formatCurrency(todayTotalAmount)}</span>
            </div>
            <div>
              <span className="text-gray-500">今日毛利：</span>
              <span className="font-semibold text-green-600">{formatCurrency(todayTotalProfit)}</span>
            </div>
          </div>
        </div>

        {todaySales.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">今日暂无销售记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">时间</th>
                  <th className="pb-3 font-medium">水果</th>
                  <th className="pb-3 font-medium">数量</th>
                  <th className="pb-3 font-medium">单价</th>
                  <th className="pb-3 font-medium">金额</th>
                  <th className="pb-3 font-medium">毛利</th>
                </tr>
              </thead>
              <tbody>
                {todaySales.map((s) => {
                  const fruit = getFruitById(s.fruitId);
                  return (
                    <tr key={s.id} className="border-b border-gray-50 text-sm">
                      <td className="py-3 text-gray-700">
                        {dateFormat(new Date(s.saleDate), 'HH:mm')}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{fruit?.emoji}</span>
                          <span className="text-gray-800">{fruit?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-700">{s.quantity} 斤</td>
                      <td className="py-3 text-gray-700">{formatCurrency(s.unitPrice)}/斤</td>
                      <td className="py-3 font-semibold text-primary">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className={`py-3 font-semibold ${s.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(s.grossProfit)}
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
