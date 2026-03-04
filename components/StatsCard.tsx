import React from 'react';

interface Props {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
}

export const StatsCard: React.FC<Props> = ({ title, amount, icon, colorClass }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>
          {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>
      <div className={`p-3 rounded-full ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('700', '100')} ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};