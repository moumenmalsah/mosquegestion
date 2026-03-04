export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  contributor?: string; // For "Charte" specific tracking
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const CATEGORIES = {
  INCOME: [
    'الشرط (Charte)',
    'تبرعات الجمعة',
    'تبرعات عامة',
    'زكاة المال',
    'أخرى'
  ],
  EXPENSE: [
    'راتب الإمام',
    'راتب المؤذن',
    'الكهرباء والماء',
    'الصيانة والإصلاح',
    'النظافة',
    'مناسبات واحتفالات',
    'مساعدة اجتماعية',
    'أخرى'
  ]
};