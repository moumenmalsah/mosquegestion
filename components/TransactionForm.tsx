import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, CATEGORIES } from '../types';
import { PlusCircle, MinusCircle, Save, X, RotateCcw } from 'lucide-react';

interface Props {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdate?: (transaction: Transaction) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

export const TransactionForm: React.FC<Props> = ({ onAdd, onUpdate, editingTransaction, onCancelEdit }) => {
  const [type, setType] = useState<TransactionType>('INCOME');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.INCOME[0]);
  const [description, setDescription] = useState('');
  const [contributor, setContributor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Populate form when editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setContributor(editingTransaction.contributor || '');
      setDate(editingTransaction.date);
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  const resetForm = () => {
    setType('INCOME');
    setAmount('');
    setCategory(CATEGORIES.INCOME[0]);
    setDescription('');
    setContributor('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    if (editingTransaction && onUpdate) {
      onUpdate({
        ...editingTransaction,
        date,
        amount: parseFloat(amount),
        type,
        category,
        description,
        contributor: type === 'INCOME' ? contributor : undefined
      });
    } else {
      onAdd({
        date,
        amount: parseFloat(amount),
        type,
        category,
        description,
        contributor: type === 'INCOME' ? contributor : undefined
      });
      resetForm();
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'INCOME' ? CATEGORIES.INCOME[0] : CATEGORIES.EXPENSE[0]);
  };

  const isEditing = !!editingTransaction;

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`p-6 rounded-xl shadow-sm border transition-colors ${
        isEditing ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-bold flex items-center gap-2 ${isEditing ? 'text-indigo-800' : 'text-slate-800'}`}>
          {isEditing ? 'تعديل العملية' : 'تسجيل عملية جديدة'}
        </h3>
        {isEditing && (
          <button 
            type="button" 
            onClick={onCancelEdit}
            className="text-xs bg-white text-slate-500 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 flex items-center gap-1"
          >
            <X size={14} /> إلغاء التعديل
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => handleTypeChange('INCOME')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            type === 'INCOME'
              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500 font-bold'
              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <PlusCircle size={20} /> مداخيل (تبرع/شرط)
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('EXPENSE')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            type === 'EXPENSE'
              ? 'bg-red-100 text-red-700 border-2 border-red-500 font-bold'
              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <MinusCircle size={20} /> مصاريف (نفقات)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الفئة</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
          >
            {(type === 'INCOME' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ (درهم/عملة)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
          />
        </div>

        {type === 'INCOME' && (
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">المساهم (اختياري)</label>
            <input
              type="text"
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
              placeholder="اسم المحسن / صاحب الشرط"
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">الوصف / تفاصيل</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="تفاصيل إضافية..."
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
          />
        </div>
      </div>

      <button
        type="submit"
        className={`w-full mt-6 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors flex justify-center items-center gap-2 ${
          isEditing 
            ? 'bg-indigo-600 hover:bg-indigo-700' 
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {isEditing ? (
          <> <Save size={20} /> حفظ التعديلات </>
        ) : (
          <> <PlusCircle size={20} /> حفظ العملية </>
        )}
      </button>
    </form>
  );
};