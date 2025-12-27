import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  CreditCard, Activity, ArrowLeft, BarChart2,
  FileText, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { 
  fetchSalesData, 
  fetchExpensesData, 
  fetchTransactions, 
  fetchPaymentsData,
  fetchLifetimeSalesAndPayments
} from '../services/firestore';

interface ReportsProps {
  tenantId: string;
}

type ReportView = 'DASHBOARD' | 'CREDITS' | 'TRANSACTIONS' | 'PAYMENTS';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Reports: React.FC<ReportsProps> = ({ tenantId }) => {
  const [view, setView] = useState<ReportView>('DASHBOARD');
  const [isLoading, setIsLoading] = useState(true);
  
  // Date State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth()); // 0-11
  
  // Data State
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  
  // Lifetime Data for Credits
  const [lifetimeData, setLifetimeData] = useState<{sales: any[], payments: any[]}>({sales: [], payments: []});
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Filters for sub-views
  const [showPaidCredits, setShowPaidCredits] = useState(false);

  // Parse Date Range for CURRENT View (Dashboard/Transactions)
  const dateRange = useMemo(() => {
    const start = new Date(Date.UTC(selectedYear, selectedMonthIndex, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(selectedYear, selectedMonthIndex + 1, 0, 23, 59, 59, 999));
    
    console.log(`[Month Range] ${selectedYear}-${selectedMonthIndex + 1}:`, {
        start: start.toISOString(),
        end: end.toISOString()
    });
    
    return { start, end };
  }, [selectedYear, selectedMonthIndex]);

  // Load Period Data
  useEffect(() => {
    const loadPeriodData = async () => {
      setIsLoading(true);
      
      console.log(`\n[Reports] LOADING PERIOD DATA FOR ${tenantId}`);
      
      try {
        const [salesData, expensesData, txData, paymentsData] = await Promise.all([
          fetchSalesData(tenantId, dateRange.start, dateRange.end),
          fetchExpensesData(tenantId, dateRange.start, dateRange.end),
          fetchTransactions(tenantId, dateRange.start, dateRange.end),
          fetchPaymentsData(tenantId, dateRange.start, dateRange.end)
        ]);

        console.log(`[Reports] Sales count: ${salesData.length}`);
        console.log(`[Reports] Expenses count: ${expensesData.length}`);
        console.log(`[Reports] Payments count: ${paymentsData.length}`);

        setSales(salesData);
        setExpenses(expensesData);
        setTransactions(txData);
        setPayments(paymentsData);

      } catch (error) {
        console.error("Failed to load report data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPeriodData();
  }, [dateRange, tenantId]);

  // Load Lifetime Data
  useEffect(() => {
      if (view === 'CREDITS') {
          const loadLifetime = async () => {
              setLoadingCredits(true);
              const data = await fetchLifetimeSalesAndPayments(tenantId);
              setLifetimeData(data);
              setLoadingCredits(false);
          };
          loadLifetime();
      }
  }, [view, tenantId]);

  const metrics = useMemo(() => {
    const totalSales = sales.reduce((sum, s) => sum + Number(s.total || s.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalSales - totalExpenses;
    
    const categoryMap: Record<string, number> = {};
    sales.forEach(sale => {
       const cat = sale.category || (sale.items && sale.items[0]?.category) || 'General';
       categoryMap[cat] = (categoryMap[cat] || 0) + Number(sale.total || sale.amount || 0);
    });
    const categoryChartData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    return { totalSales, totalExpenses, netProfit, txCount: sales.length + payments.length, categoryChartData };
  }, [sales, expenses, payments]);

  const creditorsData = useMemo(() => {
      if (view !== 'CREDITS') return [];
      
      const balances: Record<string, {name: string, totalCredit: number, totalPaid: number, owed: number, lastDate: string}> = {};

      lifetimeData.sales.forEach(s => {
          const method = String(s.paymentMethod || s.method || '').toLowerCase();
          const paymentType = String(s.payment || '').toLowerCase(); 
          const status = String(s.status || '').toLowerCase();
          const isCredit = method.includes('credit') || status === 'credit' || paymentType === 'credit';

          if (isCredit) {
              const cid = s.customerId || s.customer_name || s.customerName || 'Unknown';
              if (!balances[cid]) balances[cid] = { name: s.customerName || s.customer_name || 'Unknown', totalCredit: 0, totalPaid: 0, owed: 0, lastDate: s.timestamp || s.createdAt || new Date().toISOString() };
              balances[cid].totalCredit += Number(s.total || s.amount || 0);
              const saleDate = s.timestamp || s.createdAt || '';
              if (saleDate > balances[cid].lastDate) balances[cid].lastDate = saleDate;
          }
      });

      lifetimeData.payments.forEach(p => {
          const cid = p.customerId || p.customer_name || p.customerName || 'Unknown';
          if (balances[cid]) {
              balances[cid].totalPaid += Number(p.amount || 0);
          }
      });

      const results = Object.values(balances).map(b => ({
          ...b,
          owed: b.totalCredit - b.totalPaid
      }));

      const filtered = results.filter(b => showPaidCredits ? true : b.owed > 1); 
      return filtered;
  }, [lifetimeData, showPaidCredits, view]);

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-l-4 border-l-emerald-500 shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-2">R {metrics.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                <p className="text-xs text-slate-400 mt-1">{sales.length} Records • {MONTHS[selectedMonthIndex]}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-l-4 border-l-red-500 shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
                <h3 className="text-2xl font-black text-red-600 mt-2">R {metrics.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                <p className="text-xs text-slate-400 mt-1">{expenses.length} Records</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-l-4 border-l-indigo-500 shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit</p>
                <h3 className={`text-2xl font-black mt-2 ${metrics.netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                    R {metrics.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-l-4 border-l-blue-500 shadow-sm border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activity</p>
                <h3 className="text-2xl font-black text-blue-600 mt-2">{metrics.txCount}</h3>
                <p className="text-xs text-slate-400 mt-1">Transactions</p>
            </div>
        </div>

        <Card noPadding>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <BarChart2 size={16} /> Report Actions
                </h4>
            </div>
            <div className="p-4 flex flex-wrap gap-4">
                <Button variant="outline" onClick={() => { setView('CREDITS'); setShowPaidCredits(false); }}>
                    <CreditCard size={16} className="mr-2 text-indigo-500"/> Manage Credits
                </Button>
                <Button variant="outline" onClick={() => { setView('CREDITS'); setShowPaidCredits(true); }}>
                    <FileText size={16} className="mr-2 text-orange-500"/> Creditors Report
                </Button>
                <Button variant="outline" onClick={() => setView('TRANSACTIONS')}>
                    <Activity size={16} className="mr-2 text-emerald-500"/> All Transactions
                </Button>
                <Button variant="outline" onClick={() => setView('PAYMENTS')}>
                    <DollarSign size={16} className="mr-2 text-amber-500"/> Payment Collection
                </Button>
            </div>
        </Card>

        <Card>
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
                Sales by Category
            </h3>
            <div style={{ width: '100%', height: 400, minHeight: 400 }}>
                {metrics.categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={metrics.categoryChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        No sales data available for this period.
                    </div>
                )}
            </div>
        </Card>
    </div>
  );

  const renderCreditsView = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setView('DASHBOARD')}>
                    <ArrowLeft size={18} className="mr-2"/> Back
                </Button>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {showPaidCredits ? 'Full Creditors Ledger' : 'Outstanding Credits'}
                </h2>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant={showPaidCredits ? 'primary' : 'outline'} 
                    onClick={() => setShowPaidCredits(!showPaidCredits)}
                    size="sm"
                >
                    {showPaidCredits ? 'Hide Paid History' : 'Show All History'}
                </Button>
            </div>
        </div>

        {loadingCredits ? (
            <div className="p-12 text-center text-slate-400">Loading history...</div>
        ) : (
            <Card noPadding>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-right">Total Credit</th>
                            <th className="px-6 py-4 text-right">Paid Back</th>
                            <th className="px-6 py-4 text-right">Outstanding</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {creditorsData.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    {c.name}
                                    <span className="block text-xs text-slate-400 font-normal">Last Active: {new Date(c.lastDate).toLocaleDateString()}</span>
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500">R {c.totalCredit.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-emerald-600">R {c.totalPaid.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">R {c.owed.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    {c.owed > 1 ? (
                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">Owing</span>
                                    ) : (
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Settled</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 px-2">
                <BarChart2 className="text-indigo-600" /> 
                {view === 'DASHBOARD' ? 'Monthly Overview' : view.charAt(0) + view.slice(1).toLowerCase()}
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-950 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center px-2">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-transparent font-bold text-slate-900 dark:text-white outline-none cursor-pointer text-lg"
                    >
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-700 mx-1 hidden sm:block"></div>
                <div className="grid grid-cols-6 sm:flex gap-1">
                    {MONTHS.map((m, i) => (
                        <button
                            key={m}
                            onClick={() => setSelectedMonthIndex(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedMonthIndex === i 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {m.slice(0, 3)}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                Analyzing data...
            </div>
        ) : (
            <>
                {view === 'DASHBOARD' && renderDashboard()}
                {view === 'CREDITS' && renderCreditsView()}
                {view === 'TRANSACTIONS' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <Button variant="ghost" onClick={() => setView('DASHBOARD')}><ArrowLeft size={18}/></Button>
                            <h2 className="text-xl font-bold">Transaction Log ({MONTHS[selectedMonthIndex]})</h2>
                        </div>
                        <Card noPadding>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {transactions.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        item.type === 'EXPENSE' ? 'bg-red-100 text-red-600' : 
                                                        item.type === 'DEBT_PAYMENT' ? 'bg-indigo-100 text-indigo-600' :
                                                        'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{item.description || (item.items ? `Sale: ${item.items.length} items` : 'Transaction')}</td>
                                                <td className="px-6 py-4 text-right font-bold">R {Math.abs(item.amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}
                {view === 'PAYMENTS' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <Button variant="ghost" onClick={() => setView('DASHBOARD')}><ArrowLeft size={18}/></Button>
                            <h2 className="text-xl font-bold">Collections ({MONTHS[selectedMonthIndex]})</h2>
                        </div>
                        <Card noPadding>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Method</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {payments.map((p: any) => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-4 text-slate-500">{new Date(p.timestamp || p.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-bold">{p.customerName || p.customer_name || 'Unknown'}</td>
                                            <td className="px-6 py-4">{p.payment_type || 'Manual'}</td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">R {(p.amount || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )}
            </>
        )}
    </div>
  );
};