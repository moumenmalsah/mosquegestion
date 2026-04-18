import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType, FirebaseConfig } from './types';
import { exportToCSV, exportBackup, importBackup } from './services/storageService';
import { transactionService } from './services/transactionService'; // New Service
import { analyzeFinances } from './services/geminiService';
import { saveToCloud, loadFromCloud, getStoredFirebaseConfig, saveFirebaseConfig } from './services/firebaseService';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { StatsCard } from './components/StatsCard';
import { Reports } from './components/Reports';

import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  BrainCircuit,
  Loader2,
  FileDown,
  LogOut,
  Calendar,
  Lock,
  ArrowLeft,
  Save,
  Upload,
  Database,
  Cloud,
  CloudUpload,
  CloudDownload,
  Settings,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

type ViewMode = 'LANDING' | 'LOGIN' | 'ADMIN';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('LANDING');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'REPORTS' | 'SUPABASE' | 'SETTINGS'>('DASHBOARD');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Data Loading State
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);



  // Settings Form State
  const [tempConfig, setTempConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIAL DATA LOAD FROM SUPABASE ---
  useEffect(() => {
    loadTransactions();
    
    // Load Firebase config if exists
    const storedConfig = getStoredFirebaseConfig();
    if (storedConfig) {
        setFirebaseConfig(storedConfig);
        setTempConfig(storedConfig);
    }
  }, []);

  const loadTransactions = async () => {
    setIsDbLoading(true);
    setDbError(null);
    try {
      const data = await transactionService.fetchAll();
      setTransactions(data);
    } catch (err) {
      console.error(err);
      setDbError("تعذر الاتصال بقاعدة البيانات. تأكد من الإنترنت.");
    } finally {
      setIsDbLoading(false);
    }
  };

  // Calculate available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear()); // Always include current year
    return Array.from(years).sort((a, b) => b - a); // Descending order
  }, [transactions]);

  // Filter transactions by selected year
  const yearTransactions = useMemo(() => {
    return transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
  }, [transactions, selectedYear]);

  // --- CRUD OPERATIONS DIRECT TO DATABASE ---

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID() // Client-side UUID generation
    };

    // Optimistic Update (update UI immediately)
    const prevTransactions = [...transactions];
    setTransactions(prev => [newTransaction, ...prev]);

    try {
      await transactionService.create(newTransaction);
    } catch (error) {
      console.error("Failed to add transaction", error);
      alert("فشل الحفظ في قاعدة البيانات! تحقق من الاتصال.");
      // Rollback on error
      setTransactions(prevTransactions);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذه العملية من قاعدة البيانات؟')) {
        // Optimistic Update
        const prevTransactions = [...transactions];
        setTransactions(prev => prev.filter(t => t.id !== id));

        if (editingTransaction?.id === id) {
            setEditingTransaction(null);
        }

        try {
            await transactionService.delete(id);
        } catch (error) {
            console.error("Failed to delete transaction", error);
            alert("فشل الحذف من قاعدة البيانات!");
            // Rollback
            setTransactions(prevTransactions);
        }
    }
  };

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    // Optimistic Update
    const prevTransactions = [...transactions];
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    setEditingTransaction(null);

    try {
        await transactionService.update(updatedTransaction);
    } catch (error) {
        console.error("Failed to update transaction", error);
        alert("فشل تحديث البيانات في قاعدة البيانات!");
        // Rollback
        setTransactions(prevTransactions);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    // Ensure we are on the transactions tab and scroll to top
    if (activeTab !== 'TRANSACTIONS') {
        setActiveTab('TRANSACTIONS');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setViewMode('ADMIN');
      setAuthError(false);
      setPassword('');
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setViewMode('LANDING');
    setActiveTab('DASHBOARD');
    setEditingTransaction(null);
  };

  // KPIs based on filtered year
  const stats = useMemo(() => {
    const income = yearTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = yearTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [yearTransactions]);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    setAiAdvice(null);
    const currentMonth = new Date().toLocaleString('ar-MA', { month: 'long', year: 'numeric' });
    const advice = await analyzeFinances(yearTransactions, currentMonth);
    setAiAdvice(advice || "تعذر إنشاء التحليل.");
    setLoadingAi(false);
  };

  const exportData = (type?: TransactionType) => {
    let dataToExport = yearTransactions;
    let filename = `mosque_transactions_${selectedYear}.csv`;

    if (type === 'INCOME') {
      dataToExport = yearTransactions.filter(t => t.type === 'INCOME');
      filename = `mosque_entrees_${selectedYear}.csv`;
    } else if (type === 'EXPENSE') {
      dataToExport = yearTransactions.filter(t => t.type === 'EXPENSE');
      filename = `mosque_depenses_${selectedYear}.csv`;
    }

    exportToCSV(dataToExport, filename);
  };

  // --- LOCAL BACKUP ---
  const handleBackup = () => {
    exportBackup(transactions);
  };

  const handleRestoreClick = () => {
    if (window.confirm('تحذير: استعادة نسخة احتياطية محلية سيضيف البيانات إلى قاعدة البيانات الحالية. قد يستغرق هذا وقتاً.')) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedData = await importBackup(file);
        // For mass import, we might want to iterate and save to DB
        // This is a simple implementation that updates local state and tries to save individually
        // A bulk insert would be better for performance, but keeping it simple for now.
        if(window.confirm(`تم العثور على ${importedData.length} عملية. هل تريد رفعها إلى قاعدة البيانات؟`)) {
            setIsDbLoading(true);
            try {
                // Bulk insert using service would be ideal, but for now loop (or modify service to support bulk)
                // Let's rely on simple state update for now or simple alert
                alert("يرجى استخدام ميزة الاستيراد بحذر مع قاعدة البيانات المباشرة. سيتم عرض البيانات محلياً فقط الآن.");
                setTransactions(importedData);
            } finally {
                setIsDbLoading(false);
            }
        }
      } catch (error) {
        alert('حدث خطأ أثناء قراءة الملف.');
        console.error(error);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- CLOUD BACKUP (FIREBASE) ---
  const handleCloudSave = async () => {
    if (!firebaseConfig) {
      setActiveTab('SETTINGS');
      alert('المرجو إعداد اتصال Firebase أولاً.');
      return;
    }
    setIsCloudLoading(true);
    try {
      await saveToCloud(transactions, firebaseConfig);
      alert('تم الحفظ في Firebase بنجاح!');
    } catch (error) {
      alert('فشل الحفظ في Firebase.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleCloudLoad = async () => {
    if (!firebaseConfig) {
      setActiveTab('SETTINGS');
      alert('المرجو إعداد اتصال Firebase أولاً.');
      return;
    }
    setIsCloudLoading(true);
    try {
      const data = await loadFromCloud(firebaseConfig);
      if (data && data.length > 0) {
        setTransactions(data);
        alert('تم تحميل البيانات من Firebase (محلياً)!');
      } else {
        alert('لا توجد بيانات في Firebase.');
      }
    } catch (error) {
      alert('فشل التحميل من Firebase.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const saveConfig = () => {
    if (tempConfig.apiKey && tempConfig.databaseURL) {
        saveFirebaseConfig(tempConfig);
        setFirebaseConfig(tempConfig);
        alert('تم حفظ الإعدادات بنجاح');
    } else {
        alert('المرجو ملء المعلومات الأساسية');
    }
  };

  const incomes = useMemo(() => yearTransactions.filter(t => t.type === 'INCOME'), [yearTransactions]);
  const expenses = useMemo(() => yearTransactions.filter(t => t.type === 'EXPENSE'), [yearTransactions]);

  // ----------------------------------------------------------------------
  // VIEW: LOGIN
  // ----------------------------------------------------------------------
  if (viewMode === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500 p-3 rounded-full">
               <Lock className="text-white" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">فضاء المشرف</h2>
          <p className="text-center text-slate-500 mb-6">المرجو تسجيل الدخول لإدارة المسجد.</p>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-right"
                placeholder="أدخل كلمة المرور"
                autoFocus
              />
              {authError && <p className="text-red-500 text-sm mt-1">كلمة المرور غير صحيحة.</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              تسجيل الدخول
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('LANDING')}
              className="w-full mt-3 text-slate-500 py-2 text-sm hover:underline"
            >
              العودة للصفحة الرئيسية
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: LANDING (USER PANEL)
  // ----------------------------------------------------------------------
  if (viewMode === 'LANDING') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="bg-emerald-600 p-2 rounded-lg">
                    <Landmark size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-slate-900">نظام تسيير المسجد</h1>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">الشفافية والتدبير</p>
                </div>
             </div>
             <button 
               onClick={() => setViewMode('LOGIN')}
               className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
             >
               <Lock size={16} /> فضاء المشرف
             </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
           {isDbLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 size={48} className="animate-spin text-emerald-600" />
                <span className="mr-3 text-slate-600">جاري تحميل البيانات من الخادم...</span>
            </div>
          ) : (
           <>
          {/* Year Selector Public */}
          <div className="flex justify-end mb-6">
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                <Calendar size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">السنة المالية :</span>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
             </div>
          </div>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">الوضعية المالية {selectedYear}</h2>
            <p className="text-slate-600">
              مرحبًا بكم في بوابة الشفافية للمسجد. فيما يلي ملخص للمداخيل (التبرعات، الشرط) والمصاريف للسنة المختارة.
            </p>
          </div>

          {/* Stats Cards Public */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <StatsCard 
                title={`مداخيل ${selectedYear}`} 
                amount={stats.income} 
                icon={<TrendingUp size={24} />} 
                colorClass="text-emerald-600"
              />
              <StatsCard 
                title={`مصاريف ${selectedYear}`} 
                amount={stats.expense} 
                icon={<TrendingDown size={24} />} 
                colorClass="text-red-600"
              />
              <StatsCard 
                title="الرصيد الحالي" 
                amount={stats.balance} 
                icon={<PiggyBank size={24} />} 
                colorClass="text-blue-600"
              />
          </div>

          {/* Graphs Public */}
          <div className="mb-12">
            <Reports transactions={yearTransactions} year={selectedYear} />
          </div>

          {/* Recent Transactions Read-Only */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
             <h3 className="text-xl font-bold text-slate-800 mb-6">سجل العمليات {selectedYear}</h3>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                   <h4 className="font-semibold text-emerald-700 mb-4">آخر المداخيل</h4>
                   <TransactionList 
                      transactions={incomes.slice(0, 10)} 
                      onDelete={() => {}} 
                      type="INCOME" 
                      readOnly={true}
                    />
                </div>
                <div>
                   <h4 className="font-semibold text-red-700 mb-4">آخر المصاريف</h4>
                   <TransactionList 
                      transactions={expenses.slice(0, 10)} 
                      onDelete={() => {}} 
                      type="EXPENSE" 
                      readOnly={true}
                    />
                </div>
             </div>
          </div>
          </>
          )}
        </main>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: ADMIN PANEL
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* Sidebar / Navigation (RTL: fixed right) */}
      <nav className="fixed md:right-0 md:top-0 md:h-screen md:w-64 bg-slate-900 text-white z-50 bottom-0 w-full md:bottom-auto flex md:flex-col justify-between md:justify-start no-print overflow-y-auto">
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-500 p-2 rounded-lg">
                <Landmark size={24} className="text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg leading-tight">تسيير<br/>المسجد</h1>
                <span className="text-[10px] uppercase bg-emerald-900 px-2 py-0.5 rounded text-emerald-200">الإدارة</span>
            </div>
          </div>

           {/* Year Selector Admin */}
           <div className="mb-6">
             <label className="text-xs text-slate-400 uppercase font-semibold mb-2 block">السنة المالية</label>
             <div className="relative">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-right"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
             </div>
           </div>

           {/* Connection Status */}
           <div className="mb-6 bg-slate-800 p-3 rounded-lg flex items-center gap-2">
             {dbError ? <WifiOff size={16} className="text-red-400"/> : <Wifi size={16} className="text-emerald-400"/>}
             <span className="text-xs text-slate-300">
               {isDbLoading ? 'جاري الاتصال...' : (dbError ? 'خطأ في الاتصال' : 'متصل بقاعدة البيانات')}
             </span>
           </div>
        </div>

        <div className="flex md:flex-col w-full md:w-auto justify-around md:justify-start">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-4 md:px-6 md:py-4 transition-colors ${
              activeTab === 'DASHBOARD' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">لوحة القيادة</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-4 md:px-6 md:py-4 transition-colors ${
              activeTab === 'TRANSACTIONS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet size={20} />
            <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">المعاملات</span>
          </button>

          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-4 md:px-6 md:py-4 transition-colors ${
              activeTab === 'REPORTS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieChart size={20} />
            <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">التقارير</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPABASE')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-4 md:px-6 md:py-4 transition-colors ${
              activeTab === 'SUPABASE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database size={20} />
            <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex flex-col md:flex-row items-center md:gap-3 p-4 md:px-6 md:py-4 transition-colors ${
              activeTab === 'SETTINGS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings size={20} />
            <span className="text-xs md:text-sm font-medium mt-1 md:mt-0">الإعدادات</span>
          </button>
        </div>

        {/* Backup Section */}
        <div className="hidden md:block p-6 border-t border-slate-800 mt-4">
            <h3 className="text-xs text-slate-400 uppercase font-semibold mb-3 flex items-center gap-1">
                <Database size={12} /> أدوات إضافية
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={handleBackup}
                    className="flex flex-col items-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors text-[10px]"
                >
                    <Save size={16} /> تصدير ملف
                </button>
                <button
                    onClick={handleRestoreClick}
                    className="flex flex-col items-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors text-[10px]"
                >
                    <Upload size={16} /> استيراد ملف
                </button>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />
        </div>
        
        <div className="hidden md:block mt-auto p-6 border-t border-slate-800">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors text-sm"
           >
             <LogOut size={16} /> تسجيل الخروج
           </button>
        </div>
      </nav>

      {/* Main Content Admin (RTL: margin right) */}
      <main className="md:mr-64 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header Mobile */}
        <div className="md:hidden flex justify-between items-center mb-6 no-print">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-2 rounded-lg">
                  <Landmark size={20} className="text-white" />
              </div>
              <h1 className="font-bold text-lg text-slate-800">الإدارة</h1>
            </div>
            <button onClick={handleLogout} className="text-slate-500"><LogOut size={20}/></button>
        </div>

        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-fade-in">
            <header className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">لوحة القيادة ({selectedYear})</h2>
                <p className="text-slate-500">نظرة عامة على الوضع المالي للسنة المختارة</p>
              </div>
              <div className="md:hidden">
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg p-2 text-sm"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
              </div>
            </header>

            {isDbLoading ? (
                 <div className="flex justify-center py-12">
                     <Loader2 size={32} className="animate-spin text-indigo-600" />
                 </div>
            ) : (
             <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard 
                title={`مداخيل ${selectedYear}`} 
                amount={stats.income} 
                icon={<TrendingUp size={24} />} 
                colorClass="text-emerald-600"
              />
              <StatsCard 
                title={`مصاريف ${selectedYear}`} 
                amount={stats.expense} 
                icon={<TrendingDown size={24} />} 
                colorClass="text-red-600"
              />
              <StatsCard 
                title="الرصيد المتبقي" 
                amount={stats.balance} 
                icon={<PiggyBank size={24} />} 
                colorClass="text-blue-600"
              />
            </div>

            {/* AI Advisor Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 no-print">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                  <BrainCircuit className="text-indigo-600" /> المساعد المالي الذكي
                </h3>
                <button 
                  onClick={handleAiAnalysis}
                  disabled={loadingAi}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingAi ? <Loader2 className="animate-spin" size={16}/> : 'تحليل السنة'}
                </button>
              </div>
              
              {aiAdvice ? (
                <div className="prose prose-sm max-w-none text-indigo-800 bg-white/50 p-4 rounded-lg text-right">
                  <p className="whitespace-pre-line">{aiAdvice}</p>
                </div>
              ) : (
                <p className="text-indigo-600/70 text-sm italic">
                  انقر على "تحليل السنة" للحصول على نصائح وتوصيات مخصصة حول إدارة الشرط والنفقات لعام {selectedYear}.
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">آخر العمليات ({selectedYear})</h3>
                  <button 
                      onClick={() => exportData()} 
                      className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1"
                  >
                    <FileDown size={16} /> تصدير الكل
                  </button>
                </div>
                <TransactionList 
                  transactions={yearTransactions.slice(0, 5)} 
                  onDelete={deleteTransaction} 
                  onEdit={handleEdit}
                />
                {yearTransactions.length > 5 && (
                    <button 
                        onClick={() => setActiveTab('TRANSACTIONS')}
                        className="w-full mt-4 text-center text-sm text-emerald-600 font-medium hover:underline flex items-center justify-center gap-1"
                    >
                         عرض جميع المعاملات <ArrowLeft size={14}/>
                    </button>
                )}
            </div>
            </>
            )}
          </div>
        )}

        {activeTab === 'TRANSACTIONS' && (
          <div className="space-y-8 animate-fade-in">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">إدارة المعاملات</h2>
                <p className="text-slate-500">السنة المختارة: <span className="font-bold text-slate-900">{selectedYear}</span></p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex gap-2">
                 <span className="text-xs font-semibold text-slate-400 uppercase px-2 py-1">تصدير سريع:</span>
                 <button onClick={() => exportData('INCOME')} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100">المداخيل</button>
                 <button onClick={() => exportData('EXPENSE')} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">المصاريف</button>
                 <button onClick={() => exportData()} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded hover:bg-slate-200">الكل</button>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
              <div className="w-full">
                <TransactionForm 
                  onAdd={addTransaction} 
                  onUpdate={handleUpdateTransaction}
                  editingTransaction={editingTransaction}
                  onCancelEdit={handleCancelEdit}
                />
                <p className="text-xs text-slate-400 mt-2 italic text-center">
                   سيتم حفظ البيانات مباشرة في قاعدة البيانات المركزية.
                </p>
              </div>

              {/* Split Lists Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <TransactionList 
                    transactions={incomes} 
                    onDelete={deleteTransaction} 
                    onEdit={handleEdit}
                    title={`مداخيل ${selectedYear} (الشرط & تبرعات)`} 
                    type="INCOME"
                    onExport={() => exportData('INCOME')}
                  />
                </div>
                <div className="flex flex-col">
                  <TransactionList 
                    transactions={expenses} 
                    onDelete={deleteTransaction} 
                    onEdit={handleEdit}
                    title={`مصاريف ${selectedYear} (نفقات)`} 
                    type="EXPENSE"
                    onExport={() => exportData('EXPENSE')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'REPORTS' && (
          <div className="animate-fade-in">
            <Reports transactions={yearTransactions} year={selectedYear} />
          </div>
        )}

        {activeTab === 'SUPABASE' && (
          <SupabaseManager />
        )}

        {activeTab === 'SETTINGS' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">إعدادات النظام</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Cloud className="text-blue-500" /> إعدادات النسخ السحابي (Firebase - احتياطي)
                </h3>
                
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6">
                    <p>النظام الآن متصل بـ Supabase بشكل أساسي. استخدم Firebase فقط كنسخة احتياطية إضافية إذا رغبت في ذلك.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                        <input 
                            type="text" 
                            value={tempConfig.apiKey}
                            onChange={(e) => setTempConfig({...tempConfig, apiKey: e.target.value})}
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-left ltr"
                            dir="ltr"
                            placeholder="AIzaSy..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Database URL</label>
                        <input 
                            type="text" 
                            value={tempConfig.databaseURL}
                            onChange={(e) => setTempConfig({...tempConfig, databaseURL: e.target.value})}
                            className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-left ltr"
                            dir="ltr"
                            placeholder="https://your-project.firebaseio.com"
                        />
                    </div>
                    {/* ... other fields can remain hidden or simplified for now ... */}
                </div>

                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={saveConfig}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} /> حفظ الإعدادات
                    </button>
                </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;