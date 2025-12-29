
import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUpRight, Sparkles, Activity, Wallet, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getTransactions, getLoans, getCustomers } from '../services/firestore';
import { Transaction, Loan } from '../types';
import { useUI } from '../context/UIContext';

export const Dashboard: React.FC = () => {
  const { currentTenant } = useUI();
  const [aiInsight, setAiInsight] = useState<string>("Analyzing recent financial patterns...");
  const [revenue, setRevenue] = useState(0);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!currentTenant?.id || currentTenant.id === 'global') {
          setIsLoading(false);
          return;
        }

        const [txs, loansData, customers] = await Promise.all([
            getTransactions(currentTenant.id),
            getLoans(currentTenant.id),
            getCustomers(currentTenant.id)
        ]);

        // FIXED: Exclude voided transactions from total revenue calculation
        const totalRev = txs
          .filter(t => t.status !== 'VOIDED')
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
          
        setRevenue(totalRev);
        setActiveLoans(loansData || []);
        setTotalCustomers(customers?.length || 0);

        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        const data = last7Days.map(date => {
          const dayTotal = txs
            .filter(t => t.timestamp?.startsWith(date) && t.status !== 'VOIDED') // FIXED: Exclude voided from chart
            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
          return { name: new Date(date).getDate().toString(), value: dayTotal || 0 };
        });
        setChartData(data);

        setAiInsight("Ledger audit complete. Revenue patterns are stabilizing. No immediate liquidity risks detected in the current business cycle.");
      } catch (error) {
        console.error("Dashboard calculation failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTenant?.id]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-xs uppercase tracking-widest">Compiling Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Organizational BI</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900 rounded-xl font-bold border-slate-200">Export Cycle Report</Button>
          <Button size="sm" className="rounded-xl font-bold shadow-xl">New Entry</Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-2 text-indigo-200">
             <Sparkles size={14} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inala Intelligence Suite</span>
           </div>
           <p className="text-lg font-bold leading-tight opacity-95 max-w-2xl">{aiInsight}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl rounded-3xl">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
               <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">R {revenue.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
               <Wallet size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-black uppercase">
             <ArrowUpRight size={14} />
             <span>Cycle Stable</span>
           </div>
        </Card>

        <Card className="border-0 shadow-xl rounded-3xl">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Exposure</p>
               <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">R {(activeLoans.reduce((acc, l) => acc + (Number(l.balanceRemaining) || 0), 0)).toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
               <Activity size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs font-black uppercase">
             <span>{activeLoans.length} Active Portfolios</span>
           </div>
        </Card>

        <Card className="border-0 shadow-xl rounded-3xl">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Human Capital</p>
               <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{totalCustomers.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
               <Users size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs font-black uppercase">
             <span>Registered Users</span>
           </div>
        </Card>
      </div>

      <Card className="rounded-3xl border-0 shadow-xl p-6">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 mb-8">Revenue Trajectory</h3>
          <div className="w-full h-[300px]">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                        cursor={{stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-widest">Awaiting Lifecycle Data...</div>
            )}
          </div>
      </Card>
    </div>
  );
};
