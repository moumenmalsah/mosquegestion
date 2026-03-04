import React from 'react';
import { Transaction } from '../types';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Download, Edit } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  title?: string;
  onExport?: () => void;
  type?: 'INCOME' | 'EXPENSE';
  readOnly?: boolean;
}

export const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, title, onExport, type, readOnly = false }) => {
  const isIncome = type === 'INCOME';
  const headerClass = isIncome ? 'bg-emerald-50 border-emerald-100' : (type === 'EXPENSE' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200');
  const titleClass = isIncome ? 'text-emerald-800' : (type === 'EXPENSE' ? 'text-red-800' : 'text-slate-800');

  if (transactions.length === 0) {
    return (
      <div className={`text-center py-10 rounded-xl border mt-6 ${headerClass} border-dashed`}>
        {title && <h3 className={`font-bold mb-2 ${titleClass}`}>{title}</h3>}
        <p className="text-slate-500">لا توجد عمليات مسجلة لهذه الفترة.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6 overflow-hidden flex flex-col h-full">
      {(title || onExport) && (
        <div className={`px-6 py-4 border-b flex justify-between items-center ${headerClass}`}>
          {title && <h3 className={`font-bold text-lg ${titleClass}`}>{title}</h3>}
          {onExport && (
            <button 
              onClick={onExport}
              className="flex items-center gap-2 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={14} /> تصدير
            </button>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {!type && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">النوع</th>}
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">التاريخ</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">الفئة</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">التفاصيل</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-left">المبلغ</th>
              {!readOnly && <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">إجراء</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                {!type && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.type === 'INCOME' ? (
                      <ArrowUpCircle size={16} className="text-emerald-500" />
                    ) : (
                      <ArrowDownCircle size={16} className="text-red-500" />
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {new Date(t.date).toLocaleDateString('ar-MA')}
                </td>
                <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                  {t.category}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                  {t.description}
                  {t.contributor && <span className="block text-xs text-slate-400 italic">من: {t.contributor}</span>}
                </td>
                <td className={`px-4 py-3 text-sm font-bold text-left ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === 'EXPENSE' ? '-' : '+'}
                  {t.amount.toLocaleString('ar-MA', { minimumFractionDigits: 2 })}
                </td>
                {!readOnly && (
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(t)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(t.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};