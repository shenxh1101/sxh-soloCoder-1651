import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Star, Phone, MapPin, User, X, ChevronDown, ChevronUp, Award, Package } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useSupplierStore, type Supplier } from '@/store/supplierStore';
import { usePurchaseStore, type Purchase } from '@/store/purchaseStore';
import { useFruitStore } from '@/store/fruitStore';
import { cn } from '@/lib/utils';
import { format as dateFormat } from 'date-fns';

interface SupplierFormData {
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  qualityScore: number;
}

type SortType = 'default' | 'qualityScore';

const EMPTY_FORM: SupplierFormData = {
  name: '',
  contactPerson: '',
  phone: '',
  address: '',
  qualityScore: 80,
};

function getQualityLabel(score: number) {
  if (score >= 90) return { label: '质量优秀', className: 'bg-green-100 text-green-700' };
  if (score >= 75) return { label: '质量良好', className: 'bg-blue-100 text-blue-700' };
  return { label: '质量一般', className: 'bg-gray-100 text-gray-700' };
}

function StarRating({ score, onChange, readonly, size = 'md' }: { score: number; onChange?: (v: number) => void; readonly?: boolean; size?: 'sm' | 'md' }) {
  const displayScore = Math.round(score / 20);
  const [hoverScore, setHoverScore] = useState(0);
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = (hoverScore || displayScore) >= i;
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHoverScore(i)}
            onMouseLeave={() => !readonly && setHoverScore(0)}
            onClick={() => onChange && onChange(i * 20)}
            className={cn(readonly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110')}
          >
            <Star
              className={cn(
                `${sizeClass} transition-colors`,
                active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
              )}
            />
          </button>
        );
      })}
      <span className={cn('ml-2 font-medium text-gray-600', size === 'sm' ? 'text-xs' : 'text-sm')}>{score}</span>
    </div>
  );
}

function MiniStarRating({ score }: { score: number }) {
  const displayScore = Math.round(score / 20);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i <= displayScore ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

export default function SuppliersPage() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const addSupplier = useSupplierStore((s) => s.addSupplier);
  const updateSupplier = useSupplierStore((s) => s.updateSupplier);
  const deleteSupplier = useSupplierStore((s) => s.deleteSupplier);
  const getPurchasesBySupplier = usePurchaseStore((s) => s.getPurchasesBySupplier);
  const { getFruitById } = useFruitStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({});
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('default');

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      address: supplier.address,
      qualityScore: supplier.qualityScore,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof SupplierFormData, string>> = {};
    if (!formData.name.trim()) errors.name = '请输入供货商名称';
    if (!formData.contactPerson.trim()) errors.contactPerson = '请输入联系人';
    if (!formData.phone.trim()) errors.phone = '请输入电话';
    if (!formData.address.trim()) errors.address = '请输入地址';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingId) {
      updateSupplier(editingId, {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        qualityScore: formData.qualityScore,
      });
    } else {
      addSupplier({
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        qualityScore: formData.qualityScore,
      });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该供货商吗？')) {
      deleteSupplier(id);
      if (expandedSupplierId === id) {
        setExpandedSupplierId(null);
      }
    }
  };

  const toggleExpand = (supplierId: string) => {
    setExpandedSupplierId(expandedSupplierId === supplierId ? null : supplierId);
  };

  const supplierStats = useMemo(() => {
    const map = new Map<string, {
      purchaseCount: number;
      avgQualityScore: number;
      fruitTypes: Set<string>;
      purchases: Purchase[];
    }>();

    suppliers.forEach((s) => {
      const purchases = getPurchasesBySupplier(s.id);
      const qualityScores = purchases.filter(p => p.qualityScore !== undefined).map(p => p.qualityScore!);
      const avgScore = qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0;
      const fruitTypes = new Set(purchases.map(p => p.fruitId));

      map.set(s.id, {
        purchaseCount: purchases.length,
        avgQualityScore: Math.round(avgScore * 10) / 10,
        fruitTypes,
        purchases: [...purchases].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()),
      });
    });

    return map;
  }, [suppliers, getPurchasesBySupplier]);

  const sortedSuppliers = useMemo(() => {
    if (sortType === 'qualityScore') {
      return [...suppliers].sort((a, b) => {
        const statsA = supplierStats.get(a.id);
        const statsB = supplierStats.get(b.id);
        const scoreA = statsA?.avgQualityScore || 0;
        const scoreB = statsB?.avgQualityScore || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.name.localeCompare(b.name);
      });
    }
    return [...suppliers].sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, sortType, supplierStats]);

  const topQualityScore = useMemo(() => {
    let max = 0;
    supplierStats.forEach((stats) => {
      if (stats.avgQualityScore > max) max = stats.avgQualityScore;
    });
    return max;
  }, [supplierStats]);

  const getPurchasesGroupedByFruit = (purchases: Purchase[]) => {
    const groups = new Map<string, Purchase[]>();
    purchases.forEach((p) => {
      const existing = groups.get(p.fruitId) || [];
      groups.set(p.fruitId, [...existing, p]);
    });
    return Array.from(groups.entries()).map(([fruitId, purchases]) => ({
      fruitId,
      fruit: getFruitById(fruitId),
      purchases,
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="供货商管理"
        description="管理供货商信息与质量评分"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setSortType('default')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  sortType === 'default'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                默认排序
              </button>
              <button
                onClick={() => setSortType('qualityScore')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  sortType === 'qualityScore'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                )}
              >
                按质量排序
              </button>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition-all hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4" />
              新增供货商
            </button>
          </div>
        }
      />

      {sortedSuppliers.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-400">暂无供货商，点击右上角按钮新增</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedSuppliers.map((supplier) => {
            const quality = getQualityLabel(supplier.qualityScore);
            const stats = supplierStats.get(supplier.id);
            const purchaseCount = stats?.purchaseCount || 0;
            const avgQualityScore = stats?.avgQualityScore || 0;
            const fruitTypes = stats?.fruitTypes || new Set();
            const purchases = stats?.purchases || [];
            const isExpanded = expandedSupplierId === supplier.id;
            const isTopSupplier = avgQualityScore >= topQualityScore && avgQualityScore > 0;
            const groupedPurchases = getPurchasesGroupedByFruit(purchases);

            return (
              <div
                key={supplier.id}
                className="group rounded-2xl bg-white shadow-sm transition-all hover:shadow-md overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => toggleExpand(supplier.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">{supplier.name}</h3>
                        {isTopSupplier && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            <Award className="h-3 w-3" />
                            优先推荐
                          </span>
                        )}
                        <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', quality.className)}>
                          {quality.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span>{supplier.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{supplier.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="max-w-[200px] truncate">{supplier.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">{purchaseCount}</div>
                          <div className="text-xs text-gray-500">供货次数</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-amber-600">
                              {avgQualityScore > 0 ? avgQualityScore.toFixed(1) : '-'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">平均供货质量</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Package className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-green-600">{fruitTypes.size}</span>
                          </div>
                          <div className="text-xs text-gray-500">供货种类</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEditModal(supplier); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {fruitTypes.size > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-gray-500">供货水果：</span>
                      {Array.from(fruitTypes).map((fruitId) => {
                        const fruit = getFruitById(fruitId);
                        return fruit ? (
                          <span key={fruitId} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            <span>{fruit.emoji}</span>
                            <span>{fruit.name}</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="mb-4 text-sm font-semibold text-gray-700">供货历史记录</h4>
                    {purchases.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400">暂无供货记录</div>
                    ) : (
                      <div className="space-y-4">
                        {groupedPurchases.map(({ fruitId, fruit, purchases }) => (
                          <div key={fruitId} className="rounded-xl bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                              <span className="text-xl">{fruit?.emoji}</span>
                              <span className="font-semibold text-gray-800">{fruit?.name}</span>
                              <span className="text-xs text-gray-500">({purchases.length} 次供货)</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-gray-500">
                                    <th className="pb-2 font-medium">日期</th>
                                    <th className="pb-2 font-medium">数量</th>
                                    <th className="pb-2 font-medium">单价</th>
                                    <th className="pb-2 font-medium">总金额</th>
                                    <th className="pb-2 font-medium">质量评分</th>
                                    <th className="pb-2 font-medium">备注</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {purchases.map((p) => (
                                    <tr key={p.id} className="border-t border-gray-50">
                                      <td className="py-2 text-gray-700">
                                        {dateFormat(new Date(p.purchaseDate), 'yyyy-MM-dd')}
                                      </td>
                                      <td className="py-2 text-gray-700">{p.quantity} 斤</td>
                                      <td className="py-2 text-gray-700">¥{p.unitPrice.toFixed(2)}/斤</td>
                                      <td className="py-2 font-medium text-orange-600">¥{p.totalAmount.toFixed(2)}</td>
                                      <td className="py-2">
                                        {p.qualityScore !== undefined ? (
                                          <div className="flex items-center gap-1">
                                            <MiniStarRating score={p.qualityScore * 20} />
                                            <span className="text-xs text-gray-500">{p.qualityScore}星</span>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 text-xs">-</span>
                                        )}
                                      </td>
                                      <td className="py-2 text-gray-600 text-xs max-w-[120px] truncate">
                                        {p.remark || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? '编辑供货商' : '新增供货商'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">供货商名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入供货商名称"
                  className={cn(
                    'w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2',
                    formErrors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-200'
                  )}
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">联系人</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="请输入联系人"
                  className={cn(
                    'w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2',
                    formErrors.contactPerson
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-200'
                  )}
                />
                {formErrors.contactPerson && <p className="mt-1 text-xs text-red-500">{formErrors.contactPerson}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入联系电话"
                  className={cn(
                    'w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2',
                    formErrors.phone
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-200'
                  )}
                />
                {formErrors.phone && <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">地址</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入地址"
                  rows={2}
                  className={cn(
                    'w-full resize-none rounded-xl border bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2',
                    formErrors.address
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-200 focus:border-orange-500 focus:ring-orange-200'
                  )}
                />
                {formErrors.address && <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  质量评分 <span className="text-gray-400">({formData.qualityScore}分)</span>
                </label>
                <StarRating score={formData.qualityScore} onChange={(v) => setFormData({ ...formData, qualityScore: v })} />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition-all hover:from-orange-600 hover:to-orange-700"
              >
                {editingId ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
