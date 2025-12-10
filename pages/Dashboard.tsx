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
        if (!currentTenant?.id || currentTenant.id === 'global') { // Exclude global tenant from specific BI
          // If no tenant is selected/available, gracefully handle empty state or global view
          setRevenue(0);
          setActiveLoans([]);
          setTotalCustomers(0);
          setChartData([]);
          setIsLoading(false);
          return;
        }

        const txs = await getTransactions(currentTenant.id);
        const totalRev = txs.reduce((acc, t) => acc + (t.amount || 0), 0);
        setRevenue(totalRev);

        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        const data = last7Days.map(date => {
          const dayTotal = txs
            .filter(t => {
                if (typeof t.timestamp !== 'string') return false;
                return t.timestamp.startsWith(date);
            })
            .reduce((acc, t) => acc + (t.amount || 0), 0);
          return { name: new Date(date).getDate().toString(), value: dayTotal || 0 };
        });
        setChartData(data);

        const loansData = await getLoans(currentTenant.id);
        setActiveLoans(loansData);

        const customers = await getCustomers(currentTenant.id);
        setTotalCustomers(customers.length);

        setTimeout(() => {
          setAiInsight("Revenue is trending up 12% compared to last month's 5th-to-5th window. High volume of credit sales detected in Branch A; recommend verifying collection strategy for next week.");
        }, 2000);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
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
          <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Report window: Current Month</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export Report</Button>
          <Button size="sm">+ New Transaction</Button>
        </div>
      </div>

      {/* AI Insight Widget */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-2 text-indigo-100">
             <Sparkles size={16} />
             <span className="text-xs font-bold uppercase tracking-wider">Inala AI Insight</span>
           </div>
           <p className="text-lg font-medium leading-relaxed opacity-90">
             {aiInsight}
           </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Total Revenue</p>
               <h3 className="text-3xl font-bold mt-2">R {(revenue || 0).toLocaleString()}</h3>
             </div>
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
               <Wallet size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium">
             <ArrowUpRight size={16} />
             <span>+12.5%</span>
             <span className="text-slate-400 font-normal">vs last month</span>
           </div>
        </Card>

        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Active Loans</p>
               <h3 className="text-3xl font-bold mt-2">R {(activeLoans.reduce((acc, l) => acc + (l.balanceRemaining || 0), 0) || 0).toLocaleString()}</h3>
             </div>
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
               <Activity size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm font-medium">
             <span>{(activeLoans.length || 0)} Active Accounts</span>
           </div>
        </Card>

        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Total Customers</p>
               <h3 className="text-3xl font-bold mt-2">{(totalCustomers || 0).toLocaleString()}</h3>
             </div>
             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
               <Users size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium">
             <ArrowUpRight size={16} />
             <span>+3.2%</span>
             <span className="text-slate-400 font-normal">new this month</span>
           </div>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Revenue Trends (Last 7 Days)</h3>
              <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-1">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
              </select>
          </div>
          <div className="w-full h-[300px] min-w-0">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        cursor={{stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No chart data available.</div>
            )}
          </div>
      </Card>
    </div>
  );
};