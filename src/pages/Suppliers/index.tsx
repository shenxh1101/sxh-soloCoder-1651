import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Star, Phone, MapPin, User, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useSupplierStore, type Supplier } from '@/store/supplierStore';
import { usePurchaseStore } from '@/store/purchaseStore';
import { cn } from '@/lib/utils';

interface SupplierFormData {
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  qualityScore: number;
}

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

function StarRating({ score, onChange, readonly }: { score: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const displayScore = Math.round(score / 20);
  const [hoverScore, setHoverScore] = useState(0);

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
                'h-5 w-5 transition-colors',
                active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-gray-600">{score}</span>
    </div>
  );
}

export default function SuppliersPage() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const addSupplier = useSupplierStore((s) => s.addSupplier);
  const updateSupplier = useSupplierStore((s) => s.updateSupplier);
  const deleteSupplier = useSupplierStore((s) => s.deleteSupplier);
  const getPurchasesBySupplier = usePurchaseStore((s) => s.getPurchasesBySupplier);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({});

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
    }
  };

  const purchaseCountMap = useMemo(() => {
    const map = new Map<string, number>();
    suppliers.forEach((s) => {
      map.set(s.id, getPurchasesBySupplier(s.id).length);
    });
    return map;
  }, [suppliers, getPurchasesBySupplier]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="供货商管理"
        description="管理供货商信息与质量评分"
        actions={
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition-all hover:from-orange-600 hover:to-orange-700"
          >
            <Plus className="h-4 w-4" />
            新增供货商
          </button>
        }
      />

      {suppliers.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-400">暂无供货商，点击右上角按钮新增</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => {
            const quality = getQualityLabel(supplier.qualityScore);
            const purchaseCount = purchaseCountMap.get(supplier.id) || 0;
            return (
              <div
                key={supplier.id}
                className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{supplier.name}</h3>
                    <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', quality.className)}>
                      {quality.label}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEditModal(supplier)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(supplier.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <StarRating score={supplier.qualityScore} readonly />
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>联系人: {supplier.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="line-clamp-2">{supplier.address}</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-50 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">历史供货次数</span>
                    <span className="font-semibold text-orange-600">{purchaseCount} 次</span>
                  </div>
                </div>
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
