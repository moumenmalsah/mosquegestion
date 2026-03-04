import { Transaction } from '../types';

const STORAGE_KEY = 'mosque_manager_data_v1';

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to save transactions", error);
  }
};

export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load transactions", error);
    return [];
  }
};

export const exportBackup = (transactions: Transaction[]) => {
  const dataStr = JSON.stringify(transactions, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const date = new Date().toISOString().split('T')[0];
  const exportFileDefaultName = `mosque_backup_${date}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importBackup = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          // Basic validation to check if it looks like our data
          resolve(json);
        } else {
          reject(new Error("Format de fichier invalide"));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

export const exportToCSV = (transactions: Transaction[], filename: string) => {
  // Arabic Headers
  const headers = ['المعرف', 'التاريخ', 'النوع', 'الفئة', 'المبلغ', 'الوصف', 'المساهم'];
  
  const rows = transactions.map((t, index) => [
    index + 1, // Simple sequential ID
    t.date,
    t.type === 'INCOME' ? 'دخول' : 'خروج',
    `"${t.category}"`, // Quote to handle commas in category
    t.amount,
    `"${t.description}"`,
    `"${t.contributor || ''}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};