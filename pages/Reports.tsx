import React, { useState, useMemo, useEffect } from 'react';
import { getTransactions, getExpenses, getProducts, getCustomers, addTransaction } from '../services/firestore';
import { TransactionType, Transaction, Expense, Product, Customer, PaymentMethod } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  CreditCard, 
  Calendar, 
  Wallet,
  Receipt,
  CheckSquare,
  Activity,
  ArrowLeft,
  Clock,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface ReportsProps {
  tenantId: string;
}

type ReportView = 'DASHBOARD' | 'CREDITS' | 'TRANSACTIONS' | 'COLLECTIONS' | 'COMPARISON';
type FilterPeriod = 'CURRENT' | 'LAST';

export const Reports: React.FC<ReportsProps> = ({ tenantId }) => {
  const [view, setView] = useState<ReportView>('DASHBOARD');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('CURRENT');
  const [useBusinessCycle, setUseBusinessCycle] = useState(true);
  
  // Smart Anchor Date Logic:
  // Returns the date of the cycle start (5th) based on today.
  // If today is Nov 2nd (before 5th), cycle start was Oct 5th.
  // If today is Nov 6th (after 5th), cycle start was Nov 5th.
  const getAnchorDate = () => {
      const now = new Date();
      if (now.getDate() < 5) {
          now.setMonth(now.getMonth() - 1);
      }
      return now;
  };
  
  const [anchorDate, setAnchorDate] = useState<Date>(getAnchorDate());

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('PARTIAL');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFT);
  const [receiver, setReceiver] = useState('');

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [txs, exps, prods, custs] = await Promise.all([
                getTransactions(tenantId),
                getExpenses(tenantId),
                getProducts(tenantId),
                getCustomers(tenantId)
            ]);
            setTransactions(txs);
            setExpenses(exps);
            setProducts(prods);
            setCustomers(custs);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [tenantId]);

  // --- Filter Logic ---
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value as FilterPeriod;
      setFilterPeriod(val);
      
      const newAnchor = getAnchorDate(); // Reset to current base
      if (val === 'LAST') {
          newAnchor.setMonth(newAnchor.getMonth() - 1);
      }
      setAnchorDate(newAnchor);
  };

  const dateRange = useMemo(() => {
      const start = new Date(anchorDate);
      const end = new Date(anchorDate);

      if (useBusinessCycle) {
          // Cycle: 5th of Month -> 4th of Next Month
          start.setDate(5);
          start.setHours(0, 0, 0, 0);

          end.setMonth(end.getMonth() + 1);
          end.setDate(4);
          end.setHours(23, 59, 59, 999);
      } else {
          // Standard: 1st -> Last Day
          start.setDate(1);
          start.setHours(0, 0, 0, 0);

          end.setMonth(end.getMonth() + 1);
          end.setDate(0); 
          end.setHours(23, 59, 59, 999);
      }
      return { start, end };
  }, [anchorDate, useBusinessCycle]);

  const dashboardData = useMemo(() => {
      // 1. Filter Transactions by Date
      const filteredTxs = transactions.filter(t => {
          const d = new Date(t.timestamp);
          return d >= dateRange.start && d <= dateRange.end;
      });
      
      const filteredExps = expenses.filter(e => {
          const d = new Date(e.date);
          return d >= dateRange.start && d <= dateRange.end;
      });

      // 2. Metrics
      const salesTxs = filteredTxs.filter(t => t.type === TransactionType.SALE);
      const totalSales = salesTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = filteredExps.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netProfit = totalSales - totalExpenses;
      const txCount = salesTxs.length + filteredExps.length;

      // 3. Category Performance
      const categories = ['Beef', 'Pork', 'Chicken'];
      const categoryStats = categories.map(cat => {
          // Identify products in this category (safe check)
          const catProductIds = new Set(
              products
                .filter(p => (p.category || '').toLowerCase().includes(cat.toLowerCase()))
                .map(p => p.id)
          );
          
          let catSales = 0;
          let catTxCount = 0;
          let topProductsMap: Record<string, number> = {};

          salesTxs.forEach(t => {
              if (!t.items) return;
              let hasCategoryItem = false;
              
              t.items.forEach(item => {
                  if (catProductIds.has(item.productId)) {
                      catSales += item.subtotal;
                      hasCategoryItem = true;
                      topProductsMap[item.name] = (topProductsMap[item.name] || 0) + item.qty;
                  }
              });

              if (hasCategoryItem) catTxCount++;
          });

          // Filter expenses related to this category (simple text match on description/category)
          const catExpenses = filteredExps
              .filter(e => 
                  (e.category || '').toLowerCase().includes(cat.toLowerCase()) || 
                  (e.description || '').toLowerCase().includes(cat.toLowerCase())
              )
              .reduce((sum, e) => sum + (e.amount || 0), 0);

          const profit = catSales - catExpenses;
          const margin = catSales > 0 ? (profit / catSales) * 100 : 0;

          const topProducts = Object.entries(topProductsMap)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([name, qty]) => `${name} (${qty})`)
              .join(', ');

          return {
              name: `${cat} Products`,
              sales: catSales,
              expenses: catExpenses,
              profit,
              transactions: catTxCount,
              margin,
              topProducts
          };
      });

      return { totalSales, totalExpenses, netProfit, txCount, categoryStats, filteredTxs, filteredExps };
  }, [transactions, expenses, products, dateRange]);

  // --- View Renderers ---

  const renderDashboard = () => (
    <>
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-emerald-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-2">R {(dashboardData.totalSales || 0).toLocaleString()}</h3>
                    </div>
                </div>
            </Card>
            <Card className="border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
                        <h3 className="text-2xl font-black text-red-600 mt-2">R {(dashboardData.totalExpenses || 0).toLocaleString()}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400">Total</p>
                        <p className="text-xs font-bold text-red-500">Expenses</p>
                    </div>
                </div>
            </Card>
            <Card className={`border-l-4 ${(dashboardData.netProfit || 0) >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit</p>
                        <h3 className={`text-2xl font-black mt-2 ${(dashboardData.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            R {(dashboardData.netProfit || 0).toLocaleString()}
                        </h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400">Excl. Tax</p>
                    </div>
                </div>
            </Card>
            <Card className="border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</p>
                        <h3 className="text-2xl font-black text-blue-600 mt-2">{dashboardData.txCount || 0}</h3>
                    </div>
                </div>
            </Card>
        </div>

        {/* Report Actions */}
        <div className="bg-slate-900/5 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold text-sm">
                <Activity size={16} /> Report Actions
            </div>
            <div className="flex flex-wrap gap-4">
                <button onClick={() => setView('CREDITS')} className="flex items-center gap-3 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95 text-sm font-semibold border border-slate-700">
                    <CreditCard size={18} className="text-indigo-400"/> Manage Credits
                </button>
                <button onClick={() => setView('TRANSACTIONS')} className="flex items-center gap-3 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95 text-sm font-semibold border border-slate-700">
                    <Receipt size={18} className="text-emerald-400"/> All Transactions
                </button>
                <button onClick={() => setView('COLLECTIONS')} className="flex items-center gap-3 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95 text-sm font-semibold border border-slate-700">
                    <Wallet size={18} className="text-blue-400"/> Payment Collection
                </button>
                <button onClick={() => setView('COMPARISON')} className="flex items-center gap-3 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95 text-sm font-semibold border border-slate-700">
                    <Calendar size={18} className="text-purple-400"/> Month Comparison
                </button>
            </div>
        </div>

        {/* Business Category Performance */}
        <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Business Category Performance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.categoryStats.map((cat, index) => (
                    <Card key={index} className="flex flex-col h-full border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="font-bold text-slate-900 dark:text-white">{cat.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${(cat.profit || 0) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {(cat.profit || 0) >= 0 ? 'PROFITABLE' : 'LOSS'}
                            </span>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className={`text-3xl font-black ${(cat.profit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                R {(cat.profit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6 px-2">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">SALES</p>
                                <p className="text-sm font-bold text-emerald-500">R {(cat.sales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">EXPENSES</p>
                                <p className="text-sm font-bold text-red-500">R {(cat.expenses || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">TRANSACTIONS</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.transactions || 0}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">MARGIN</p>
                                <p className={`text-sm font-bold ${(cat.margin || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {(cat.margin || 0).toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] text-slate-500 font-bold mb-1">Top Products:</p>
                            <p className="text-xs text-slate-400 truncate h-4">{cat.topProducts || 'No products sold'}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    </>
  );

  const renderCredits = () => {
      // Filter customers with positive debt
      const debtorCustomers = customers.filter(c => (c.currentDebt || 0) > 0 || (c.totalCredit || 0) > 0);

      return (
          <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                      <ArrowLeft size={16} className="mr-2"/> Back
                  </Button>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Outstanding Credits</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {debtorCustomers.map(customer => {
                      const debt = (customer.totalCredit || 0) + (customer.currentDebt || 0);
                      return (
                       <div key={customer.id} className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-lg transition-all duration-300">
                           <div className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl bg-amber-500" />
                           <div className="pl-4 flex justify-between items-start mb-4">
                               <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-4 border-white dark:border-slate-800 shadow-sm bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {customer.name.charAt(0)}
                                    </div>
                                   <div>
                                       <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{customer.name}</h3>
                                       <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><ShoppingBag size={12}/> {customer.salesCount || 0} Sales</p>
                                   </div>
                               </div>
                           </div>
                           <div className="pl-4 space-y-3">
                               <div className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-800 pb-2">
                                   <span className="text-slate-500 flex items-center gap-1"><Clock size={14}/> Last Purchase</span>
                                   <span className="font-medium text-slate-900 dark:text-white">
                                       {customer.lastPurchaseDate 
                                          ? new Date(customer.lastPurchaseDate).toLocaleDateString() 
                                          : 'N/A'}
                                   </span>
                               </div>

                               <div className="flex justify-between items-end pt-1">
                                   <div>
                                       <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Due</p>
                                       <p className="text-2xl font-extrabold flex items-center gap-2 text-amber-600">
                                           R {debt.toFixed(2)}
                                       </p>
                                   </div>
                                   <Button size="sm" onClick={() => handlePayClick(customer)} className="shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white border-none">
                                       Record Pay
                                   </Button>
                               </div>
                           </div>
                       </div>
                  )})}
                  {debtorCustomers.length === 0 && (
                      <div className="col-span-full p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                          No outstanding credits found for this period.
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderTransactions = () => {
      // Re-sort chronologically desc
      const combined = [
          ...dashboardData.filteredTxs.map(t => ({
              id: t.id,
              date: t.timestamp,
              type: t.type === TransactionType.SALE ? 'SALE' : t.type === TransactionType.DEBT_PAYMENT ? 'PAYMENT' : 'OTHER',
              desc: t.items ? `${t.items.length} Items` : t.type,
              amount: t.amount,
              isExpense: false
          })),
          ...dashboardData.filteredExps.map(e => ({
              id: e.id,
              date: e.date,
              type: 'EXPENSE',
              desc: e.description,
              amount: e.amount,
              isExpense: true
          }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return (
          <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                      <ArrowLeft size={16} className="mr-2"/> Back
                  </Button>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">All Transactions</h2>
              </div>

              <Card noPadding className="overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                              <tr>
                                  <th className="px-6 py-4">Date</th>
                                  <th className="px-6 py-4">Type</th>
                                  <th className="px-6 py-4">Description</th>
                                  <th className="px-6 py-4 text-right">Amount</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {combined.map((item, i) => (
                                  <tr key={`${item.id}_${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                          {new Date(item.date).toLocaleDateString()}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                              item.isExpense ? 'bg-red-100 text-red-600' : 
                                              item.type === 'PAYMENT' ? 'bg-indigo-100 text-indigo-600' :
                                              'bg-emerald-100 text-emerald-600'
                                          }`}>
                                              {item.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.desc}</td>
                                      <td className={`px-6 py-4 text-right font-bold ${item.isExpense ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                          {item.isExpense ? '-' : '+'} R {(item.amount || 0).toFixed(2)}
                                      </td>
                                  </tr>
                              ))}
                              {combined.length === 0 && (
                                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">No transactions found.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      );
  };

  const renderCollections = () => {
      // Filter for Payments
      const collections = dashboardData.filteredTxs.filter(t => 
          t.type === TransactionType.DEBT_PAYMENT || (t.type === TransactionType.SALE && t.method !== PaymentMethod.CREDIT)
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return (
          <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                      <ArrowLeft size={16} className="mr-2"/> Back
                  </Button>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Collections</h2>
              </div>
              <div className="space-y-4">
                  {collections.map(t => (
                      <Card key={t.id} noPadding className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                                  {t.customerName ? t.customerName.charAt(0) : 'W'}
                              </div>
                              <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{t.customerName || 'Walk-In'}</p>
                                  <p className="text-xs text-slate-500">{new Date(t.timestamp).toLocaleDateString()}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-emerald-600">R {(t.amount || 0).toFixed(2)}</p>
                              <p className="text-xs text-slate-400 uppercase">{t.method}</p>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      );
  };

  const renderComparison = () => {
      // Calculate Previous Month Data
      const prevAnchor = new Date(anchorDate);
      prevAnchor.setMonth(prevAnchor.getMonth() - 1);
      
      const prevStart = new Date(prevAnchor);
      const prevEnd = new Date(prevAnchor);

      if (useBusinessCycle) {
          prevStart.setDate(5);
          prevStart.setHours(0,0,0,0);
          
          prevEnd.setMonth(prevEnd.getMonth() + 1);
          prevEnd.setDate(4);
          prevEnd.setHours(23,59,59,999);
      } else {
          prevStart.setDate(1);
          prevStart.setHours(0,0,0,0);

          prevEnd.setMonth(prevEnd.getMonth() + 1);
          prevEnd.setDate(0);
          prevEnd.setHours(23,59,59,999);
      }

      const getMetrics = (s: Date, e: Date) => {
          const txs = transactions.filter(t => { const d = new Date(t.timestamp); return d >= s && d <= e && t.type === TransactionType.SALE; });
          const exps = expenses.filter(x => { const d = new Date(x.date); return d >= s && d <= e; });
          const sales = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
          const expense = exps.reduce((sum, x) => sum + (x.amount || 0), 0);
          return { sales, expense, profit: sales - expense };
      };

      const curr = { sales: dashboardData.totalSales, expense: dashboardData.totalExpenses, profit: dashboardData.netProfit };
      const prev = getMetrics(prevStart, prevEnd);

      const getPct = (c: number, p: number) => {
          if (!p || p === 0) return c > 0 ? 100 : 0;
          const result = ((c - p) / p) * 100;
          return isFinite(result) ? result : 0;
      };

      const stats = [
          { label: 'Total Sales', curr: curr.sales, prev: prev.sales, change: getPct(curr.sales, prev.sales) },
          { label: 'Total Expenses', curr: curr.expense, prev: prev.expense, change: getPct(curr.expense, prev.expense) },
          { label: 'Net Profit', curr: curr.profit, prev: prev.profit, change: getPct(curr.profit, prev.profit) },
      ];

      return (
          <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setView('DASHBOARD')} className="bg-white dark:bg-slate-800">
                      <ArrowLeft size={16} className="mr-2"/> Back
                  </Button>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Month Comparison</h2>
              </div>
              <div className="grid grid-cols-1 gap-6">
                  <Card>
                      <div className="space-y-6">
                          {stats.map((stat, i) => (
                              <div key={i} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                                  <span className="font-bold text-lg text-slate-700 dark:text-slate-300">{stat.label}</span>
                                  <div className="flex gap-8 items-center text-right">
                                      <span className="w-32 text-slate-400">R {(stat.prev || 0).toLocaleString()}</span>
                                      <span className="w-32 font-black text-xl text-slate-900 dark:text-white">R {(stat.curr || 0).toLocaleString()}</span>
                                      <div className={`w-20 flex justify-end`}>
                                          <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${(stat.change || 0) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                              {(stat.change || 0) >= 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                                              {Math.abs(stat.change || 0).toFixed(1)}%
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </Card>

                  <div className="h-80 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Sales', prev: prev.sales || 0, curr: curr.sales || 0 },
                                { name: 'Expenses', prev: prev.expense || 0, curr: curr.expense || 0 },
                                { name: 'Profit', prev: prev.profit || 0, curr: curr.profit || 0 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}} 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="prev" name="Previous" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="curr" name="Current" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                  </div>
              </div>
          </div>
      );
  };

  // --- Payment Logic ---
  const handlePayClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPayModal(true);
    setPaymentAmount('');
    setPaymentType('PARTIAL');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(PaymentMethod.EFT);
    setReceiver('');
  };

  const processPayment = async () => {
      if (!selectedCustomer) return;
      await addTransaction({
          id: `tx_pay_${Date.now()}`,
          tenantId,
          branchId: 'b_001',
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          type: TransactionType.DEBT_PAYMENT,
          amount: Number(paymentAmount),
          currency: 'ZAR',
          method: paymentMethod,
          status: 'COMPLETED', 
          timestamp: new Date(paymentDate).toISOString(),
          reference: 'DEBT-PAYMENT',
          receivedBy: receiver
      });
      
      setCustomers(prev => prev.map(c => 
          c.id === selectedCustomer.id 
          ? { ...c, currentDebt: (c.currentDebt || 0) - Number(paymentAmount) } 
          : c
      ));
      setShowPayModal(false);
  };

  if (isLoading) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading business intelligence...</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Activity className="text-indigo-600" /> Business Intelligence
                </h2>
                <p className="text-indigo-400 font-mono text-sm mt-1">
                    Cycle: {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 cursor-pointer select-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm" onClick={() => setUseBusinessCycle(!useBusinessCycle)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useBusinessCycle ? 'bg-indigo-500 border-indigo-500' : 'bg-transparent border-slate-400'}`}>
                        {useBusinessCycle && <CheckSquare size={12} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Biz Cycle (5th-4th)</span>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter Period:</span>
                    <div className="relative">
                        <select 
                            value={filterPeriod}
                            onChange={handlePeriodChange}
                            className="appearance-none bg-slate-900 text-white pl-4 pr-10 py-2 rounded-lg text-sm font-bold cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="CURRENT">Current Month</option>
                            <option value="LAST">Last Month</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    </div>
                </div>
            </div>
        </div>

        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'CREDITS' && renderCredits()}
        {view === 'TRANSACTIONS' && renderTransactions()}
        {view === 'COLLECTIONS' && renderCollections()}
        {view === 'COMPARISON' && renderComparison()}

        {/* Payment Modal */}
        <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Payment" size="sm">
            <div className="space-y-6 pt-2">
                <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wide mb-1">Customer owes</p>
                    <p className="text-3xl font-extrabold text-red-500">R {((selectedCustomer?.totalCredit || 0) + (selectedCustomer?.currentDebt || 0)).toFixed(2)}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{selectedCustomer?.name}</p>
                </div>
                
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => {
                            setPaymentType('PARTIAL');
                            setPaymentAmount('');
                        }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'PARTIAL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Partial
                    </button>
                    <button 
                        onClick={() => {
                            setPaymentType('FULL');
                            if (selectedCustomer) {
                                const debt = (selectedCustomer.totalCredit || 0) + (selectedCustomer.currentDebt || 0);
                                setPaymentAmount(debt.toFixed(2));
                            }
                        }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'FULL' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Full Settlement
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount to Pay</label>
                        <input 
                            type="number" 
                            value={paymentAmount} 
                            onChange={(e) => setPaymentAmount(e.target.value)} 
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl dark:bg-slate-800 font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-indigo-500/20" onClick={processPayment} disabled={!paymentAmount || !receiver}>
                        Confirm Payment
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};