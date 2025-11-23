import React, { useState, useMemo } from 'react';
import { MOCK_TRANSACTIONS, MOCK_EXPENSES, MOCK_PRODUCTS, MOCK_CUSTOMERS, addTransaction } from '../services/mockData';
import { TransactionType, PaymentMethod, Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Settings, 
  Calculator,
  Wallet,
  ArrowUpRight,
  Receipt,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface ReportsProps {
  tenantId: string;
}

type ReportView = 'DASHBOARD' | 'CREDITS' | 'TRANSACTIONS' | 'COLLECTIONS' | 'COMPARISON';

export const Reports: React.FC<ReportsProps> = ({ tenantId }) => {
  const [view, setView] = useState<ReportView>('DASHBOARD');
  
  // Dashboard Filters
  const [period, setPeriod] = useState<'current' | 'last' | 'all'>('current');
  const [useBusinessCycle, setUseBusinessCycle] = useState(true);

  // Comparison Filters
  const [compDate1, setCompDate1] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [compDate2, setCompDate2] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7));

  // --- Payment Modal States ---
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('PARTIAL');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFT);
  const [receiver, setReceiver] = useState('');

  // --- 1. DASHBOARD LOGIC ---
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'all') return { start: new Date(0), end: new Date() };

    if (useBusinessCycle) {
      const currentDay = now.getDate();
      let cycleStartMonth = now.getMonth();
      let cycleStartYear = now.getFullYear();

      if (currentDay < 5) cycleStartMonth--;
      if (period === 'last') cycleStartMonth--;

      start = new Date(cycleStartYear, cycleStartMonth, 5);
      end = new Date(cycleStartYear, cycleStartMonth + 1, 4, 23, 59, 59);
    } else {
      let targetMonth = now.getMonth();
      if (period === 'last') targetMonth--;
      start = new Date(now.getFullYear(), targetMonth, 1);
      end = new Date(now.getFullYear(), targetMonth + 1, 0, 23, 59, 59);
    }
    return { start, end };
  };

  const { start, end } = getDateRange();

  const dashboardTransactions = useMemo(() => MOCK_TRANSACTIONS.filter(t => {
      const tDate = new Date(t.timestamp);
      return t.tenantId === tenantId && t.type === TransactionType.SALE && tDate >= start && tDate <= end;
  }), [tenantId, start, end]);

  const dashboardExpenses = useMemo(() => MOCK_EXPENSES.filter(e => {
      const eDate = new Date(e.date);
      return e.tenantId === tenantId && eDate >= start && eDate <= end;
  }), [tenantId, start, end]);

  const totalSales = dashboardTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalOpExpenses = dashboardExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const totalCOGS = dashboardTransactions.reduce((sum, t) => {
      if (!t.items) return sum;
      return sum + t.items.reduce((iSum, item) => {
          const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
          return iSum + ((product?.cost || 0) * item.qty);
      }, 0);
  }, 0);

  const netProfit = totalSales - totalOpExpenses - totalCOGS;
  const transactionCount = dashboardTransactions.length;

  const categoryStats = useMemo(() => {
    const stats: Record<string, { sales: number; cogs: number; txCount: number; products: Record<string, number> }> = {};
    dashboardTransactions.forEach(tx => {
      if (!tx.items) return;
      tx.items.forEach(item => {
        const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
        const cat = product?.category || 'Uncategorized';
        if (!stats[cat]) stats[cat] = { sales: 0, cogs: 0, txCount: 0, products: {} };
        stats[cat].sales += item.subtotal;
        stats[cat].cogs += (product?.cost || 0) * item.qty;
        stats[cat].txCount += 1;
        if (!stats[cat].products[item.name]) stats[cat].products[item.name] = 0;
        stats[cat].products[item.name] += item.qty;
      });
    });
    return Object.entries(stats).map(([name, data]) => ({
      name,
      sales: data.sales,
      expenses: data.cogs,
      margin: data.sales > 0 ? ((data.sales - data.cogs) / data.sales) * 100 : 0,
      transactions: data.txCount,
      topProducts: Object.entries(data.products).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, q]) => `${p} (${q})`).join(', ')
    }));
  }, [dashboardTransactions]);

  // --- 2. SUB-VIEW DATA HOOKS ---

  // Manage Credits Data
  const creditCustomers = useMemo(() => {
     return MOCK_CUSTOMERS.filter(c => c.tenantId === tenantId && c.currentDebt > 0);
  }, [tenantId]);

  // Payment Logic
  const handlePayClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPayModal(true);
    setPaymentAmount('');
    setPaymentType('PARTIAL');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(PaymentMethod.EFT);
    setReceiver('');
  };

  const handlePaymentTypeChange = (type: 'FULL' | 'PARTIAL') => {
      setPaymentType(type);
      if (type === 'FULL' && selectedCustomer) {
          setPaymentAmount(selectedCustomer.currentDebt.toFixed(2));
      } else {
          setPaymentAmount('');
      }
  };

  const processPayment = () => {
      if (!selectedCustomer) return;
      
      addTransaction({
          id: `tx_pay_${Date.now()}`,
          tenantId,
          branchId: 'b_001',
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          type: TransactionType.DEBT_PAYMENT,
          amount: Number(paymentAmount),
          currency: 'ZAR',
          method: paymentMethod,
          status: 'PENDING', 
          timestamp: new Date(paymentDate).toISOString(),
          reference: 'DEBT-PAYMENT',
          receivedBy: receiver
      });

      alert('Payment Recorded! The debt balance will update shortly.');
      setShowPayModal(false);
  };

  // All Transactions Data
  const allHistory = useMemo(() => {
     const txs = MOCK_TRANSACTIONS
        .filter(t => t.tenantId === tenantId)
        .map(t => ({
           id: t.id,
           date: t.timestamp,
           type: t.type === TransactionType.SALE ? 'SALE' : t.type === TransactionType.EXPENSE ? 'EXPENSE' : t.type,
           description: t.items ? t.items.map(i => `${i.qty}x ${i.name}`).join(', ') : t.reference,
           amount: t.amount,
           isExpense: false, // Sales are positive
           method: t.method,
           status: t.status
        }));
     
     const exps = MOCK_EXPENSES
        .filter(e => e.tenantId === tenantId)
        .map(e => ({
           id: e.id,
           date: e.date,
           type: 'EXPENSE',
           description: e.description,
           amount: e.amount,
           isExpense: true,
           method: 'EFT', // Assumption for Expenses
           status: 'PAID'
        }));

     return [...txs, ...exps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tenantId]);

  // Payment Collections Data (Cash/Card/MoMo Inflow)
  const collections = useMemo(() => {
      return MOCK_TRANSACTIONS.filter(t => 
          t.tenantId === tenantId && 
          (t.type === TransactionType.SALE || t.type === TransactionType.DEBT_PAYMENT) &&
          t.method !== PaymentMethod.CREDIT // Only collected money
      ).map(t => ({
          ...t,
          staffName: t.receivedBy || 'Staff Member', // Default if undefined
          itemsSummary: t.items ? t.items.map(i => i.name).join(', ') : 'Debt Payment'
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tenantId]);

  // Comparison Logic
  const getMonthStats = (monthStr: string) => {
      const mStart = new Date(monthStr + '-01');
      const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0, 23, 59, 59);

      const txs = MOCK_TRANSACTIONS.filter(t => {
          const d = new Date(t.timestamp);
          return t.tenantId === tenantId && t.type === TransactionType.SALE && d >= mStart && d <= mEnd;
      });
      
      const sales = txs.reduce((sum, t) => sum + t.amount, 0);
      const cogs = txs.reduce((sum, t) => {
        if(!t.items) return sum;
        return sum + t.items.reduce((iSum, item) => {
            const p = MOCK_PRODUCTS.find(prod => prod.id === item.productId);
            return iSum + ((p?.cost || 0) * item.qty);
        }, 0);
      }, 0);

      const exps = MOCK_EXPENSES.filter(e => {
          const d = new Date(e.date);
          return e.tenantId === tenantId && d >= mStart && d <= mEnd;
      }).reduce((sum, e) => sum + e.amount, 0);

      return {
          sales,
          expenses: cogs + exps,
          profit: sales - (cogs + exps),
          count: txs.length
      };
  };

  const stats1 = getMonthStats(compDate1);
  const stats2 = getMonthStats(compDate2);

  // --- RENDERERS ---

  const renderDashboard = () => (
    <>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Intelligence</h2>
               <p className="text-slate-500 text-sm">Real-time performance metrics and financial reports.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                    <Download size={16} className="mr-2" /> Export PDF
                </Button>
            </div>
        </div>

        {/* 1. Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
             <Card className="border-t-4 border-t-emerald-500">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">R {totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                 <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
                    <ArrowUpRight size={14} /> +12.5% vs last period
                 </div>
             </Card>

             <Card className="border-t-4 border-t-red-500">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">R {(totalOpExpenses + totalCOGS).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                 <div className="flex items-center gap-1 mt-2 text-red-500 text-xs font-bold">
                    <ArrowUpRight size={14} /> Includes COGS
                 </div>
             </Card>

             <Card className="border-t-4 border-t-emerald-600">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit</p>
                 <h3 className={`text-3xl font-black mt-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>R {netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                 <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs font-bold">
                    Based on collected revenue
                 </div>
             </Card>

             <Card className="border-t-4 border-t-blue-500">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</p>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{transactionCount}</h3>
                 <div className="flex items-center gap-1 mt-2 text-blue-500 text-xs font-bold">
                    Average Basket: R {transactionCount > 0 ? (totalSales / transactionCount).toFixed(0) : 0}
                 </div>
             </Card>
        </div>

        {/* 2. Report Actions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
             <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
                <Settings size={16} /> Report Actions
             </h3>
             <div className="flex flex-wrap gap-3">
                 <button onClick={() => setView('CREDITS')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                    <CreditCard size={16} className="text-indigo-500"/> Manage Credits
                 </button>
                 <button onClick={() => setView('TRANSACTIONS')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                    <Receipt size={16} className="text-emerald-500"/> All Transactions
                 </button>
                 <button onClick={() => setView('COLLECTIONS')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                    <Wallet size={16} className="text-blue-500"/> Payment Collection
                 </button>
                 <button onClick={() => setView('COMPARISON')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                    <Calendar size={16} className="text-purple-500"/> Month Comparison
                 </button>
             </div>
        </div>

        {/* 3. Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl mb-6">
             <div className="flex items-center gap-3">
                 <span className="text-sm font-medium text-slate-500">Filter Period:</span>
                 <select 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                 >
                     <option value="current">Current Month</option>
                     <option value="last">Last Month</option>
                     <option value="all">All Time</option>
                 </select>
             </div>
             
             <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                    type="checkbox" 
                    checked={useBusinessCycle} 
                    onChange={(e) => setUseBusinessCycle(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                 />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">Use Business Cycle (5th - 4th)</span>
             </label>

             <div className="ml-auto text-xs font-mono text-slate-400">
                 Showing: {start.toLocaleDateString()} - {end.toLocaleDateString()}
             </div>
        </div>

        {/* 4. Category Performance Grid */}
        <div>
             <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Business Category Performance</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {categoryStats.map((cat, idx) => (
                     <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
                         <div className="flex justify-between items-start mb-4">
                             <h4 className="font-bold text-lg text-slate-900 dark:text-white">{cat.name} Products</h4>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cat.margin > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                 {cat.margin > 0 ? 'PROFITABLE' : 'LOSS'}
                             </span>
                         </div>
                         
                         <div className="text-center py-2 mb-6 border-b border-slate-100 dark:border-slate-800">
                             <span className="block text-3xl font-black text-emerald-600">R {cat.sales.toFixed(2)}</span>
                         </div>

                         <div className="grid grid-cols-2 gap-4 mb-6">
                             <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">SALES</p>
                                 <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">R {cat.sales.toFixed(2)}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">EXPENSES (COGS)</p>
                                 <p className="font-bold text-red-500 text-sm">R {cat.expenses.toFixed(2)}</p>
                             </div>
                             <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">TRANSACTIONS</p>
                                 <p className="font-bold text-slate-900 dark:text-white text-sm">{cat.transactions}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">MARGIN</p>
                                 <p className={`font-bold text-sm ${cat.margin >= 30 ? 'text-emerald-500' : cat.margin > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                     {cat.margin.toFixed(1)}%
                                 </p>
                             </div>
                         </div>

                         <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                             <p className="text-xs font-bold text-slate-500 mb-1">Top Products:</p>
                             <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                 {cat.topProducts || 'No sales recorded'}
                             </p>
                         </div>
                     </div>
                 ))}
                 
                 {categoryStats.length === 0 && (
                     <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                         <Calculator className="mx-auto mb-2 opacity-50" size={32} />
                         <p>No transaction data found for this period.</p>
                     </div>
                 )}
             </div>
        </div>
    </>
  );

  const renderCredits = () => (
      <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                  <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Outstanding Credits</h2>
          </div>

          <Card noPadding>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                          <tr>
                              <th className="px-6 py-4">Customer</th>
                              <th className="px-6 py-4">Phone</th>
                              <th className="px-6 py-4">Last Purchase</th>
                              <th className="px-6 py-4 text-right">Credit Limit</th>
                              <th className="px-6 py-4 text-right">Current Debt</th>
                              <th className="px-6 py-4 text-center">Status</th>
                              <th className="px-6 py-4 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {creditCustomers.map(c => (
                              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                                  <td className="px-6 py-4 text-slate-500">{c.phone}</td>
                                  <td className="px-6 py-4 text-slate-500">{new Date(c.lastPurchaseDate || '').toLocaleDateString()}</td>
                                  <td className="px-6 py-4 text-right">R {c.creditLimit.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right font-black text-red-500">R {c.currentDebt.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-center">
                                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold uppercase">Overdue</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <Button size="sm" variant="secondary" onClick={() => handlePayClick(c)} className="bg-red-500 hover:bg-red-600 text-white shadow-red-500/20">
                                          Pay Debt
                                      </Button>
                                  </td>
                              </tr>
                          ))}
                          {creditCustomers.length === 0 && (
                              <tr>
                                  <td colSpan={7} className="text-center py-12 text-slate-400">
                                      <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500"/>
                                      No outstanding credits found.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </Card>

          <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment" size="sm">
            <div className="space-y-6 pt-2">
                <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Customer owes</p>
                    <p className="text-3xl font-extrabold text-red-500">R {selectedCustomer?.currentDebt.toFixed(2)}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{selectedCustomer?.name}</p>
                </div>
                
                {/* Payment Type Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => handlePaymentTypeChange('PARTIAL')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'PARTIAL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Partial
                    </button>
                    <button 
                        onClick={() => handlePaymentTypeChange('FULL')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'FULL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Full Settlement
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount to Pay</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R</span>
                            <input 
                                type="number" 
                                value={paymentAmount} 
                                onChange={(e) => setPaymentAmount(e.target.value)} 
                                disabled={paymentType === 'FULL'}
                                className="w-full pl-8 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date</label>
                            <input 
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Method</label>
                            <select 
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                className="w-full px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value={PaymentMethod.CASH}>Cash</option>
                                <option value={PaymentMethod.EFT}>EFT</option>
                                <option value={PaymentMethod.MOMO}>MoMo</option>
                            </select>
                        </div>
                    </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Receiver (Staff)</label>
                        <input 
                            type="text"
                            value={receiver}
                            onChange={(e) => setReceiver(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-indigo-500/20" onClick={processPayment} disabled={!paymentAmount || !receiver}>
                    Confirm Payment
                </Button>
            </div>
          </Modal>
      </div>
  );

  const renderTransactions = () => (
      <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                  <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">All Transactions Ledger</h2>
          </div>

          <Card noPadding>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                          <tr>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Type</th>
                              <th className="px-6 py-4">Description / Items</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                              <th className="px-6 py-4 text-center">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {allHistory.map((item, i) => (
                              <tr key={`${item.id}_${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                      {new Date(item.date).toLocaleDateString()} <span className="text-slate-400">{new Date(item.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                          item.isExpense ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                      }`}>
                                          {item.type}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={item.description}>
                                      {item.description}
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{item.method}</td>
                                  <td className={`px-6 py-4 text-right font-bold ${item.isExpense ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                      {item.isExpense ? '-' : '+'} R {item.amount.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className="text-xs text-slate-400">{item.status}</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>
      </div>
  );

  const renderCollections = () => (
      <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                  <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Payment Collections</h2>
          </div>

          <Card noPadding>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                          <tr>
                              <th className="px-6 py-4">Received By</th>
                              <th className="px-6 py-4">Customer</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Items / Reference</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4 text-right">Amount Collected</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {collections.map((col, i) => (
                              <tr key={col.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                              {col.staffName.charAt(0)}
                                          </div>
                                          <span className="font-medium text-slate-900 dark:text-white">{col.staffName}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                      {col.customerName || 'Walk-In'}
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 text-xs">
                                      {new Date(col.timestamp).toLocaleDateString()} {new Date(col.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 truncate max-w-xs text-xs">
                                      {col.itemsSummary}
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="px-2 py-0.5 border border-slate-200 rounded text-xs text-slate-500">{col.method}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                      R {col.amount.toFixed(2)}
                                  </td>
                              </tr>
                          ))}
                          {collections.length === 0 && (
                              <tr>
                                  <td colSpan={6} className="text-center py-12 text-slate-400">
                                      No collections found.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </Card>
      </div>
  );

  const renderComparison = () => (
      <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                  <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Month Comparison</h2>
          </div>

          {/* Comparison Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Period A</label>
                  <input 
                      type="month" 
                      value={compDate1} 
                      onChange={(e) => setCompDate1(e.target.value)}
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-medium"
                  />
                  <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Sales</span> <span className="font-bold">R {stats1.sales.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Expenses</span> <span className="font-bold text-red-500">R {stats1.expenses.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm pt-2 border-t"><span className="font-bold">Net Profit</span> <span className={`font-bold ${stats1.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>R {stats1.profit.toLocaleString()}</span></div>
                  </div>
              </div>
              <div className="border-l border-slate-100 dark:border-slate-800 pl-6">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Period B</label>
                  <input 
                      type="month" 
                      value={compDate2} 
                      onChange={(e) => setCompDate2(e.target.value)}
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-medium"
                  />
                  <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Sales</span> <span className="font-bold">R {stats2.sales.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Expenses</span> <span className="font-bold text-red-500">R {stats2.expenses.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm pt-2 border-t"><span className="font-bold">Net Profit</span> <span className={`font-bold ${stats2.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>R {stats2.profit.toLocaleString()}</span></div>
                  </div>
              </div>
          </div>

          <Card>
              <h3 className="font-bold mb-4">Performance Variance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Sales', periodA: stats1.sales, periodB: stats2.sales },
                        { name: 'Expenses', periodA: stats1.expenses, periodB: stats2.expenses },
                        { name: 'Profit', periodA: stats1.profit, periodB: stats2.profit }
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Legend />
                        <Bar dataKey="periodA" name={compDate1} fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="periodB" name={compDate2} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </Card>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'CREDITS' && renderCredits()}
        {view === 'TRANSACTIONS' && renderTransactions()}
        {view === 'COLLECTIONS' && renderCollections()}
        {view === 'COMPARISON' && renderComparison()}
    </div>
  );
};