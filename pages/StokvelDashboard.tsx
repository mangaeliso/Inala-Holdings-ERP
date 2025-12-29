
import React, { useState, useEffect } from 'react';
import { getStokvelMembers, getContributions, addStokvelMember, getBusinessProfile, addContribution, calculateHybridStokvelMetrics } from '../services/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ContributionStatus, StokvelMember, Contribution, Tenant, UserRole, PaymentMethod } from '../types';
import { 
  ArrowLeft, Users, Wallet, Plus, Search, 
  CheckCircle2, CreditCard, TrendingUp, Activity, Target, Calendar
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { LoanDashboard } from './LoanDashboard';

export const StokvelDashboard: React.FC<{ tenantId: string; onBack: () => void }> = ({ tenantId, onBack }) => {
  const { currentUser, globalSettings, setTenantBranding, addToast } = useUI();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'CONTRIBUTIONS' | 'LOANS'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(true);
  const [finance, setFinance] = useState<any>(null);
  const [members, setMembers] = useState<StokvelMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [tenantProfile, setTenantProfile] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAll = async () => {
    setIsLoading(true);
    try {
        const [profile, stats, m, c] = await Promise.all([
            getBusinessProfile(tenantId),
            calculateHybridStokvelMetrics(tenantId),
            getStokvelMembers(tenantId),
            getContributions(tenantId)
        ]);
        if (profile) {
            setTenantProfile(profile);
            setTenantBranding(profile.branding || null);
        }
        setFinance(stats);
        setMembers(m);
        setContributions(c);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { loadAll(); }, [tenantId]);

  const effectivePrimaryColor = tenantProfile?.branding?.primaryColor || globalSettings.primaryColor;

  if (isLoading || !tenantProfile || !finance) return <div className="p-12 text-center text-slate-400">Syncing Ledger...</div>;

  return (
    <div className="h-full flex flex-col space-y-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 bg-slate-50 dark:bg-slate-950 z-20 py-2">
           <div className="flex items-center gap-4">
               <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20}/></button>
               <div>
                   <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white">{tenantProfile.name}</h2>
                   <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Stokvel Portal</span>
               </div>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm flex gap-1">
               {['OVERVIEW', 'MEMBERS', 'CONTRIBUTIONS', 'LOANS'].map(tab => (
                   <button
                       key={tab}
                       onClick={() => setActiveTab(tab as any)}
                       className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === tab ? 'text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                       style={activeTab === tab ? { backgroundColor: effectivePrimaryColor } : {}}
                   >{tab}</button>
               ))}
           </div>
       </div>

       {activeTab === 'OVERVIEW' && (
           <div className="space-y-6 animate-fade-in">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 shadow-2xl">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                       <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Wallet size={12} className="text-indigo-400"/> Liquid Cash Pool
                       </p>
                       <h2 className="text-5xl font-black tracking-tight">R {finance.liquidCapital.toLocaleString()}</h2>
                       <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/5">
                           <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Savings</p><p className="font-black text-xl">R {finance.totalContributions.toLocaleString()}</p></div>
                           <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Members</p><p className="font-black text-xl">{members.length}</p></div>
                           <div><p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Effective ROI</p><p className="font-black text-xl text-emerald-400">{finance.effectiveROI}%</p></div>
                       </div>
                   </div>
                   <Card className="flex flex-col justify-between border-t-4" style={{borderColor: effectivePrimaryColor}}>
                       <div>
                           <div className="flex items-center gap-2 text-indigo-600 mb-6"><Activity size={18}/><span className="font-black text-xs uppercase tracking-widest">Active Loan Book</span></div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Lent to Members</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white">R {finance.activePrincipal.toLocaleString()}</p>
                       </div>
                       <Button className="w-full mt-4 h-12 font-bold" style={{backgroundColor: effectivePrimaryColor}} onClick={() => setActiveTab('LOANS')}>Explore Hub</Button>
                   </Card>
               </div>
           </div>
       )}

       {activeTab === 'MEMBERS' && (
           <div className="space-y-4 animate-fade-in">
               <div className="flex justify-between items-center">
                   <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Group Registry</h3>
                   <Button size="sm" className="rounded-xl"><Plus size={16} className="mr-2"/> Add Member</Button>
               </div>
               <Card noPadding className="overflow-hidden">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-400 border-b">
                           <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Contributed</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {members.map(m => (
                               <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                   <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase text-xs">{m.name}</td>
                                   <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">{m.status}</span></td>
                                   <td className="px-6 py-4 text-right font-black text-indigo-600">R {(m.totalContributed || 0).toLocaleString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </Card>
           </div>
       )}

       {activeTab === 'CONTRIBUTIONS' && (
           <div className="space-y-4 animate-fade-in">
               <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Ledger Archives</h3>
               <Card noPadding className="overflow-hidden">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-400 border-b">
                           <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Member</th><th className="px-6 py-4 text-right">Amount</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {contributions.sort((a,b) => b.date.localeCompare(a.date)).map(c => (
                               <tr key={c.id}>
                                   <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{new Date(c.date).toLocaleString()}</td>
                                   <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase text-xs">{(members.find(m => m.id === c.memberId)?.name || 'Guest')}</td>
                                   <td className="px-6 py-4 text-right font-black text-emerald-600">R {c.amount.toLocaleString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </Card>
           </div>
       )}

       {activeTab === 'LOANS' && <LoanDashboard tenantId={tenantId} />}
    </div>
  );
};
