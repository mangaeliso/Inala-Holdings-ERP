
import React, { useState, useEffect } from 'react';
import { getTenants, getStokvelMembers, getContributions, getLoans, addStokvelMember, updateStokvelMember, deleteStokvelMember, getBusinessProfile, addContribution, calculateHybridStokvelMetrics } from '../services/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { BusinessSettings } from './BusinessSettings';
// Fix: Import LoanDashboard component
import { LoanDashboard } from './LoanDashboard';
import { ContributionStatus, LoanStatus, StokvelMember, Contribution, Loan, Tenant, UserRole, PaymentMethod } from '../types';
import { 
  ArrowLeft, Users, Wallet, Calendar, Plus, Search, 
  CheckCircle2, AlertCircle, CreditCard, 
  Clock, TrendingUp, ChevronRight, Trophy, Sparkles,
  Activity, Edit, Trash2, Mail, UserPlus, Save, Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useUI } from '../context/UIContext';

interface StokvelDashboardProps {
  tenantId: string;
  onBack: () => void;
}

export const StokvelDashboard: React.FC<StokvelDashboardProps> = ({ tenantId, onBack }) => {
  const { currentUser, globalSettings, setTenantBranding, addToast } = useUI();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'CONTRIBUTIONS' | 'LOANS' | 'PAYOUTS' | 'SETTINGS'>('OVERVIEW');
  const [memberSearch, setMemberSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Financial State
  const [finance, setFinance] = useState<any>(null);
  const [members, setMembers] = useState<StokvelMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tenantProfile, setTenantProfile] = useState<Tenant | null>(null);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StokvelMember | null>(null);
  
  // Forms
  const [formData, setFormData] = useState<Partial<StokvelMember>>({});
  const [contributionFormData, setContributionFormData] = useState<Partial<Contribution>>({
      memberId: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      method: PaymentMethod.EFT,
      status: ContributionStatus.PAID
  });

  useEffect(() => {
    const load = async () => {
        setIsLoading(true);
        try {
            if (!tenantId) return;
            const [profile, stats, m, c, l] = await Promise.all([
                getBusinessProfile(tenantId),
                calculateHybridStokvelMetrics(tenantId),
                getStokvelMembers(tenantId),
                getContributions(tenantId),
                getLoans(tenantId)
            ]);

            if (profile) {
                setTenantProfile(profile);
                if (profile.branding) setTenantBranding(profile.branding);
            }
            setFinance(stats);
            setMembers(m);
            setContributions(c);
            setLoans(l);
        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setIsLoading(false);
        }
    };
    load();
    return () => setTenantBranding(null);
  }, [tenantId, setTenantBranding]);

  // Derived Values
  const effectivePrimaryColor = tenantProfile?.branding?.primaryColor || globalSettings.primaryColor;
  const currencySymbol = tenantProfile?.cycleSettings?.currencySymbol || 'R';

  if (isLoading || !tenantProfile || !finance) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Analyzing financial integrity...</p>
    </div>
  );

  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || 
                 (currentUser?.tenantId === tenantId && currentUser?.role === UserRole.TENANT_ADMIN);

  const renderOverview = () => {
    const payoutQueue = members
        .filter(m => m.status === 'ACTIVE')
        .sort((a, b) => (a.payoutQueuePosition || 999) - (b.payoutQueuePosition || 999));
    const nextRecipient = payoutQueue[0];

    return (
      <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Balance Card: LIQUID CAPITAL */}
              <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl p-8 border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  
                  <div className="relative z-10">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Wallet size={12} className="text-indigo-400"/> Liquid Cash Pool
                              </p>
                              <h2 className="text-5xl font-black tracking-tight">
                                {currencySymbol} {finance.liquidCapital.toLocaleString()}
                              </h2>
                          </div>
                          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-indigo-300">
                             Lending-Hybrid Model
                          </div>
                      </div>

                      <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/5">
                          <div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Contributions</p>
                              <p className="font-black text-xl text-indigo-100">{currencySymbol} {finance.totalContributions.toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Interest Realized</p>
                              <p className="font-black text-xl text-emerald-400">+{currencySymbol} {finance.realizedInterest.toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Monthly ROI</p>
                              <p className="font-black text-xl text-amber-400">{finance.effectiveROI}%</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Loan Performance Card */}
              <Card className="flex flex-col justify-between border-t-4 bg-white dark:bg-slate-900" style={{borderColor: effectivePrimaryColor}}>
                  <div>
                      <div className="flex items-center gap-2 text-indigo-600 mb-6">
                          <Activity size={18} />
                          <span className="font-black text-xs uppercase tracking-widest">Active Loan Book</span>
                      </div>
                      
                      <div className="space-y-6">
                           <div>
                               <p className="text-[10px] text-slate-400 font-bold uppercase">Principal in Market</p>
                               <p className="text-2xl font-black text-slate-900 dark:text-white">{currencySymbol} {finance.activePrincipal.toLocaleString()}</p>
                           </div>
                           <div>
                               <p className="text-[10px] text-slate-400 font-bold uppercase">Projected Yield</p>
                               <p className="text-2xl font-black text-indigo-600">{currencySymbol} {finance.activeBookValue.toLocaleString()}</p>
                               <p className="text-[10px] text-slate-400 mt-1 italic">*Based on active active contracts</p>
                           </div>
                      </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4 text-white shadow-xl border-none h-12 font-bold" 
                    style={{backgroundColor: effectivePrimaryColor}}
                    onClick={() => setActiveTab('LOANS')}
                  >
                      Manage Lending
                  </Button>
              </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fund Activity Ticker */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                      <TrendingUp size={14} className="text-indigo-500"/> Real Growth Distribution
                  </h3>
                  <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                            { name: 'Week 1', amount: finance.totalContributions * 0.8 },
                            { name: 'Week 2', amount: finance.totalContributions * 0.9 },
                            { name: 'Week 3', amount: finance.totalContributions },
                            { name: 'Week 4', amount: finance.liquidCapital },
                        ]}>
                            <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={effectivePrimaryColor} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={effectivePrimaryColor} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff'}} />
                            <Area type="monotone" dataKey="amount" stroke={effectivePrimaryColor} strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Action Sidebar */}
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setActiveTab('CONTRIBUTIONS')} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all text-left group">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Plus size={20} />
                          </div>
                          <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Collect</span>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">Contributions</p>
                      </button>
                      <button onClick={() => setActiveTab('LOANS')} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all text-left group">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <CreditCard size={20} />
                          </div>
                          <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Disburse</span>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">New Loan</p>
                      </button>
                  </div>

                  <Card noPadding className="bg-slate-50 dark:bg-slate-800/50 border-none">
                      <div className="p-5 border-b border-white/5">
                          <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Yield Strategy</h4>
                      </div>
                      <div className="p-5 space-y-4">
                           <div className="flex items-start gap-3">
                               <AlertCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                               <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                   Interest is capped at <strong>30% monthly</strong> for external borrowers to maintain pool sustainability.
                               </p>
                           </div>
                           <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                               <p className="text-[10px] font-bold text-emerald-700 uppercase">Effective Yield</p>
                               <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                                  Lending pool is {finance.liquidCapital > 0 ? 'Liquid' : 'Fully Utilized'}
                               </p>
                           </div>
                      </div>
                  </Card>
              </div>
          </div>
      </div>
    );
  }

  // --- STANDARD RENDERS ---
  const renderMembers = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Find a member..." 
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
            </div>
            <Button onClick={() => { setSelectedMember(null); setFormData({name:'', phone:'', monthlyPledge:0, status:'ACTIVE', joinDate:new Date().toISOString().split('T')[0]}); setShowMemberModal(true); }}>
                <UserPlus size={18} className="mr-2" /> Add Member
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {members.filter(m => (m.name||'').toLowerCase().includes(memberSearch.toLowerCase())).map(member => (
                <div key={member.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-4">
                           <img src={member.avatarUrl} className="w-12 h-12 rounded-xl object-cover" />
                           <div>
                               <h4 className="font-bold text-slate-900 dark:text-white">{member.name}</h4>
                               <p className="text-xs text-slate-500">{member.phone}</p>
                           </div>
                       </div>
                       <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">#{member.payoutQueuePosition}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-slate-800 my-4">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Monthly</p>
                            <p className="font-black text-slate-900 dark:text-white">{currencySymbol} {member.monthlyPledge}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Balance</p>
                            <p className="font-black text-indigo-600">{currencySymbol} {member.totalContributed}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { setSelectedMember(member); setFormData({...member}); setShowMemberModal(true); }}>Edit Profile</Button>
                </div>
            ))}
        </div>
    </div>
  );

  const renderContributions = () => (
      <div className="space-y-6 animate-fade-in">
          <Card className="overflow-hidden border-0 shadow-lg" noPadding>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Contribution Ledger</h3>
                  <Button size="sm" onClick={() => setShowContributionModal(true)}><Plus size={16} className="mr-2"/> New Entry</Button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 uppercase text-[10px] font-black">
                          <tr>
                              <th className="px-6 py-4">Member</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {contributions.map(con => (
                              <tr key={con.id}>
                                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{members.find(m => m.id === con.memberId)?.name || 'Unknown'}</td>
                                  <td className="px-6 py-4 text-slate-500">{new Date(con.date).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 font-black">R {con.amount.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{con.method}</td>
                                  <td className="px-6 py-4">
                                      <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded text-[10px] font-black uppercase">PAID</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </Card>
      </div>
  );

  return (
    <div className="h-full flex flex-col">
       <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-4 mb-2 border-b border-slate-200/50 dark:border-slate-800/50">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                   <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                       <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                   </button>
                   <div className="flex items-center gap-3">
                       <img src={tenantProfile.branding?.logoUrl} className="w-10 h-10 rounded-xl border border-white shadow-sm" />
                       <div>
                           <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{tenantProfile.branding?.displayName || tenantProfile.name}</h2>
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Yield-Hybrid Stokvel</span>
                       </div>
                   </div>
               </div>
               
               <div className="bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-1 overflow-x-auto max-w-full">
                   {['OVERVIEW', 'MEMBERS', 'CONTRIBUTIONS', 'LOANS', 'SETTINGS'].map(tab => (
                       <button
                           key={tab}
                           onClick={() => setActiveTab(tab as any)}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest ${
                               activeTab === tab 
                               ? 'bg-slate-900 text-white shadow-md' 
                               : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
                           }`}
                           style={activeTab === tab ? { backgroundColor: effectivePrimaryColor } : {}}
                       >
                           {tab}
                       </button>
                   ))}
               </div>
           </div>
       </div>

       <div className="flex-1 py-4">
           {activeTab === 'OVERVIEW' && renderOverview()}
           {activeTab === 'MEMBERS' && renderMembers()}
           {activeTab === 'CONTRIBUTIONS' && renderContributions()}
           {activeTab === 'LOANS' && <LoanDashboard tenantId={tenantId} />}
           {activeTab === 'SETTINGS' && isAdmin && <BusinessSettings tenantId={tenantId} onDelete={onBack} />}
       </div>

       <Modal isOpen={showContributionModal} onClose={() => setShowContributionModal(false)} title="Record Capital Inflow">
            <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Source Member</label>
                    <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none font-bold" value={contributionFormData.memberId} onChange={e => setContributionFormData({...contributionFormData, memberId:e.target.value})}>
                        <option value="">Choose...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-slate-500">Contribution Amount</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none font-bold text-xl" value={contributionFormData.amount} onChange={e => setContributionFormData({...contributionFormData, amount:Number(e.target.value)})} />
                </div>
                <Button className="w-full h-12 font-bold" onClick={async () => {
                    const con = {
                        id: `con_${Date.now()}`,
                        tenantId,
                        memberId: contributionFormData.memberId!,
                        amount: contributionFormData.amount!,
                        date: new Date().toISOString(),
                        period: new Date().toISOString().slice(0, 7),
                        status: ContributionStatus.PAID,
                        method: PaymentMethod.EFT
                    };
                    await addContribution(con);
                    setContributions(p => [con, ...p]);
                    setShowContributionModal(false);
                    addToast('Contribution logged successfully!', 'success');
                }}>Confirm Capital Entry</Button>
            </div>
       </Modal>

       <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title={selectedMember ? 'Edit Profile' : 'Add New Member'}>
            <div className="space-y-4 pt-2">
                <input type="text" className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                <input type="tel" className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" />
                <input type="number" className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none" value={formData.monthlyPledge || ''} onChange={e => setFormData({...formData, monthlyPledge: Number(e.target.value)})} placeholder="Monthly Pledge" />
                <Button className="w-full" onClick={async () => {
                    if (selectedMember) {
                        await updateStokvelMember({...selectedMember, ...formData});
                    } else {
                        await addStokvelMember({id:`m_${Date.now()}`, tenantId, totalContributed:0, payoutQueuePosition: members.length+1, avatarUrl:`https://ui-avatars.com/api/?name=${formData.name}`, ...formData});
                    }
                    window.location.reload();
                }}>Save Member</Button>
            </div>
       </Modal>
    </div>
  );
};
