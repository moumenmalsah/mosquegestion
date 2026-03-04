import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Printer } from 'lucide-react';
import { exportToCSV } from '../services/storageService';

interface Props {
  transactions: Transaction[];
  year: number;
}

export const Reports: React.FC<Props> = ({ transactions, year }) => {
  
  const monthlyData = useMemo(() => {
    // Generate Arabic months
    const data = Array(12).fill(0).map((_, i) => ({
      name: new Date(year, i).toLocaleString('ar-MA', { month: 'short' }),
      'المداخيل': 0,
      'المصاريف': 0,
      'المتبقي': 0
    }));

    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date.getFullYear() === year) {
        const monthIndex = date.getMonth();
        if (t.type === 'INCOME') {
          data[monthIndex]['المداخيل'] += t.amount;
        } else {
          data[monthIndex]['المصاريف'] += t.amount;
        }
      }
    });

    // Calculate balance
    data.forEach(item => {
        item['المتبقي'] = item['المداخيل'] - item['المصاريف'];
    });

    return data;
  }, [transactions, year]);

  const handleExportCSV = () => {
    exportToCSV(transactions, `mosque_rapport_${year}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-slate-800">التقارير والإحصائيات ({year})</h2>
        <div className="flex gap-2">
            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm transition-colors no-print"
            >
                <Download size={16} /> Excel / CSV
            </button>
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm transition-colors no-print"
            >
                <Printer size={16} /> طباعة / PDF
            </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print-chart-container">
        <h3 className="text-lg font-semibold mb-4 text-slate-700">التدفق المالي الشهري - {year}</h3>
        <div className="h-80 w-full" dir="ltr"> {/* Charts often render better LTR internally even in Arabic apps for axes */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
              <YAxis stroke="#64748b" tick={{fontSize: 12}} orientation="right" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="المداخيل" fill="#10b981" radius={[4, 4, 0, 0]} name="المداخيل" />
              <Bar dataKey="المصاريف" fill="#ef4444" radius={[4, 4, 0, 0]} name="المصاريف" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Print Only Summary Table */}
      <div className="print-only mt-8">
        <h3 className="text-2xl font-bold mb-4">التقرير السنوي {year}</h3>
        <table className="w-full border-collapse border border-slate-300 text-right">
            <thead>
                <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2">الشهر</th>
                    <th className="border border-slate-300 p-2">المداخيل</th>
                    <th className="border border-slate-300 p-2">المصاريف</th>
                    <th className="border border-slate-300 p-2">المتبقي</th>
                </tr>
            </thead>
            <tbody>
                {monthlyData.map((m, idx) => (
                    <tr key={idx}>
                        <td className="border border-slate-300 p-2">{m.name}</td>
                        <td className="border border-slate-300 p-2 text-emerald-600">{m['المداخيل'].toFixed(2)}</td>
                        <td className="border border-slate-300 p-2 text-red-600">{m['المصاريف'].toFixed(2)}</td>
                        <td className="border border-slate-300 p-2 font-bold">{m['المتبقي'].toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="mt-8 text-sm text-slate-500 text-center">
             تم الإنشاء بواسطة نظام تسيير المسجد في {new Date().toLocaleDateString('ar-MA')}
        </div>
      </div>
    </div>
  );
};