import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Transaction } from '../types';
import { TransactionList } from './TransactionList';
import { Loader2, RefreshCw, Database, AlertTriangle } from 'lucide-react';

export const SupabaseManager: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Map Supabase data to our App Transaction type
      // Ensure amounts are numbers (Postgres DECIMAL might return as string depending on config, usually JSON numbers are safe)
      const mappedData: Transaction[] = (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        amount: Number(item.amount), // Explicit conversion
        type: item.type,
        category: item.category,
        description: item.description,
        contributor: item.contributor
      }));

      setTransactions(mappedData);
    } catch (err: any) {
      console.error('Supabase fetch error:', err);
      setError(err.message || 'حدث خطأ أثناء الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-indigo-900 text-white p-6 rounded-xl shadow-lg">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-2">
             <Database className="text-indigo-300" /> قاعدة بيانات Supabase
           </h2>
           <p className="text-indigo-200 text-sm mt-1">عرض البيانات مباشرة من الخادم السحابي</p>
        </div>
        <button 
          onClick={fetchTransactions} 
          disabled={loading}
          className="bg-indigo-700 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
          تحديث البيانات
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={24} />
          <div>
            <p className="font-bold">خطأ في الاتصال</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
         <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
             <Database size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 font-medium">قاعدة البيانات فارغة</p>
         </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
             <div className="mb-4 flex items-center justify-between">
                <span className="text-slate-500 font-medium">عدد العمليات: {transactions.length}</span>
             </div>
             <TransactionList 
                transactions={transactions} 
                onDelete={() => alert('الحذف من Supabase غير مفعل في وضع العرض هذا')} 
                readOnly={true}
             />
        </div>
      )}
    </div>
  );
};