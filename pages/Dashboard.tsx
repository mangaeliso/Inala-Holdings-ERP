import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Sparkles, Activity, Wallet, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { GoogleGenAI } from "@google/genai";

const DATA = [
  { name: '1st', value: 4000 },
  { name: '5th', value: 3000 },
  { name: '10th', value: 2000 },
  { name: '15th', value: 2780 },
  { name: '20th', value: 1890 },
  { name: '25th', value: 2390 },
  { name: '30th', value: 3490 },
];

export const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>("Analyzing recent financial patterns...");

  useEffect(() => {
    // Simulated Gemini AI Call
    const fetchInsight = async () => {
      // In production, this would use the real GoogleGenAI client as per system instruction
      // const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // const model = ai.models.generateContent...
      
      // Simulating a delay
      setTimeout(() => {
        setAiInsight("Revenue is trending up 12% compared to last month's 5th-to-5th window. High volume of credit sales detected in Branch A; recommend verifying collection strategy for next week.");
      }, 2000);
    };
    fetchInsight();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Report window: 5th Nov - 4th Dec</p>
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
               <h3 className="text-3xl font-bold mt-2">R 45,231.89</h3>
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
               <h3 className="text-3xl font-bold mt-2">R 12,500.00</h3>
             </div>
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
               <Activity size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-slate-600 text-sm font-medium">
             <span className="text-slate-500 font-normal">8 active borrowers</span>
           </div>
        </Card>

        <Card className="hover:translate-y-[-2px] transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500">Stock Alerts</p>
               <h3 className="text-3xl font-bold mt-2">3 Items</h3>
             </div>
             <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
               <Activity size={20} />
             </div>
           </div>
           <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm font-medium">
             <ArrowDownRight size={16} />
             <span>Low Inventory</span>
           </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">Revenue Trend</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20}/></button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">Sales by Channel</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'POS (Cash)', value: 4000 },
                { name: 'POS (Card)', value: 3000 },
                { name: 'MoMo', value: 2000 },
                { name: 'Credit', value: 2780 },
              ]}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                 <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};