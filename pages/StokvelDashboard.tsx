import React, { useState, useEffect } from 'react';
import { getTenants, getStokvelMembers, getContributions, getLoans, addStokvelMember, updateStokvelMember, deleteStokvelMember, getBusinessProfile } from '../services/firestore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { BusinessSettings } from './BusinessSettings'; // Import BusinessSettings
import { ContributionStatus, LoanStatus, StokvelMember, Contribution, Loan, Tenant, UserRole } from '../types';
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
  const { currentTenant, currentUser, globalSettings, setTenantBranding } = useUI();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'CONTRIBUTIONS' | 'LOANS' | 'PAYOUTS' | 'SETTINGS'>('OVERVIEW');
  const [memberSearch, setMemberSearch] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Local State for Members to allow CRUD
  const [members, setMembers] = useState<StokvelMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tenantProfile, setTenantProfile] = useState<Tenant | null>(null); // Fetch specific tenant profile

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StokvelMember | null>(null);
  const [formData, setFormData] = useState<Partial<StokvelMember>>({});
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    const load = async () => {
        setIsLoading(true);
        try {
            if (!tenantId) return;
            const t = await getBusinessProfile(tenantId); // Fetch specific tenant profile
            if (t) {
                setTenantProfile(t);
                // Set branding context for this Stokvel view
                if (t.branding) {
                    setTenantBranding(t.branding);
                } else {
                    setTenantBranding(null);
                }
            }

            const m = await getStokvelMembers(tenantId);
            setMembers(m);
            const c = await getContributions(tenantId);
            setContributions(c);
            const l = await getLoans(tenantId);
            setLoans(l);
        } catch (error) {
            console.error("Failed to load Stokvel Dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    load();

    // Cleanup branding on unmount
    return () => {
        setTenantBranding(null);
    };
  }, [tenantId, setTenantBranding]);

  // Stats
  const totalPool = members.reduce((sum, m) => sum + (m.totalContributed || 0), 0);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthContributions = contributions.filter(c => c.period === currentMonth);
  const totalCollectedThisMonth = currentMonthContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const expectedCollection = members.reduce((sum, m) => sum + (m.monthlyPledge || 0), 0);
  const collectionRate = expectedCollection > 0 ? (totalCollectedThisMonth / expectedCollection) * 100 : 0;
  
  // Target Calculation
  const targetAmount = tenantProfile?.target || 100000;
  const targetProgress = Math.min(100, (totalPool / (targetAmount || 1)) * 100);

  // Determine effective primary color (tenant override or global default)
  const effectivePrimaryColor = tenantProfile?.branding?.primaryColor || globalSettings.primaryColor;
  const currencySymbol = tenantProfile?.cycleSettings?.currencySymbol || 'R';


  if (isLoading || !tenantProfile) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading Stokvel Dashboard...</p>
    </div>
  );

  // Check if current user has admin role for this tenant or is Super Admin
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || 
                 (currentUser?.tenantId === tenantId && currentUser?.role === UserRole.TENANT_ADMIN);

  // --- CRUD Handlers ---

  const handleOpenAddMember = () => {
      setSelectedMember(null);
      setFormData({
          name: '',
          phone: '',
          email: '',
          monthlyPledge: 0,
          status: 'ACTIVE',
          joinDate: new Date().toISOString().split('T')[0]
      });
      setShowMemberModal(true);
  };

  const handleOpenEditMember = (member: StokvelMember) => {
      setSelectedMember(member);
      setFormData({ ...member, joinDate: member.joinDate.split('T')[0] }); // Format date for input
      setShowMemberModal(true);
  };

  const handleSaveMember = async () => {
      if (!formData.name || !formData.phone || (formData.monthlyPledge === undefined || formData.monthlyPledge < 0)) {
          alert('Please fill in all required fields: Name, Phone, and Monthly Pledge.');
          return;
      }

      if (selectedMember) {
          const updated = { ...selectedMember, ...formData, monthlyPledge: Number(formData.monthlyPledge || 0) } as StokvelMember;
          await updateStokvelMember(updated);
          setMembers(prev => prev.map(m => m.id === selectedMember.id ? updated : m));
      } else {
          const newMember: StokvelMember = {
              id: `sm_${Date.now()}`,
              tenantId: tenantId,
              totalContributed: 0,
              payoutQueuePosition: (members.length || 0) + 1,
              avatarUrl: `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
              ...formData as StokvelMember, // Ensure formData matches StokvelMember
              monthlyPledge: Number(formData.monthlyPledge || 0)
          };
          await addStokvelMember(newMember);
          setMembers(prev => [...prev, newMember]);
      }
      setShowMemberModal(false);
  };

  const handleDeleteMember = async (memberId: string) => {
      if (confirm('Are you sure you want to remove this member? This action cannot be undone.')) {
          if (!tenantId) return; 
          await deleteStokvelMember(tenantId, memberId);
          setMembers(prev => prev.filter(m => m.id !== memberId));
      }
  };

  const handleSendInvite = () => {
      if (!inviteEmail) return;
      alert(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
  };

  const handleProcessPayout = () => {
      setIsProcessingPayout(true);
      setTimeout(() => {
          setIsProcessingPayout(false);
          alert('Payout processed successfully! The member queue has been updated.');
      }, 2000);
  };

  // --- Sub-Components ---

  const renderOverview = () => {
    // Payout Queue Logic
    const payoutQueue = members
        .filter(m => m.status === 'ACTIVE')
        .sort((a, b) => (a.payoutQueuePosition || 999) - (b.payoutQueuePosition || 999));
    const nextRecipient = payoutQueue[0];

    return (
      <div className="space-y-6 animate-fade-in">
          {/* Top Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Balance Card - Dark Gradient */}
              <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl p-8">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
                  
                  <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-indigo-200 font-medium text-sm flex items-center gap-2">
                                <Wallet size={16} /> Total Pool Balance
                              </p>
                              <h2 className="text-5xl font-bold mt-2 tracking-tight">
                                {currencySymbol} {(totalPool || 0).toLocaleString()}
                              </h2>
                          </div>
                          <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium text-indigo-100">
                             Audited: 2 days ago
                          </div>
                      </div>

                      {/* Target Progress Bar inside Hero */}
                      <div className="mt-8 mb-2">
                           <div className="flex justify-between items-end mb-2">
                               <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium">
                                   <Target size={16} />
                                   <span>Fund Goal: {currencySymbol} {(targetAmount || 0).toLocaleString()}</span>
                               </div>
                               <span className="text-2xl font-bold text-white">{(targetProgress || 0).toFixed(1)}%</span>
                           </div>
                           <div className="w-full h-2.5 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                               <div 
                                   className="h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out" 
                                   style={{ width: `${(targetProgress || 0)}%`, backgroundColor: effectivePrimaryColor }}
                               ></div>
                           </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                          <div>
                              <p className="text-indigo-300 text-xs mb-1">Monthly Target</p>
                              <p className="font-semibold text-lg">{currencySymbol} {(expectedCollection || 0).toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-indigo-300 text-xs mb-1">Collected</p>
                              <p className="font-semibold text-lg flex items-center gap-1">
                                {currencySymbol} {(totalCollectedThisMonth || 0).toLocaleString()}
                                <span className="text-emerald-400 text-xs bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center">
                                  <TrendingUp size={10} className="mr-0.5"/> {Math.round(collectionRate || 0)}%
                                </span>
                              </p>
                          </div>
                          <div>
                              <p className="text-indigo-300 text-xs mb-1">Active Members</p>
                              <p className="font-semibold text-lg">{(members.length || 0)}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Next Payout Card - Glass Light */}
              <Card className="flex flex-col justify-between bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden border-t-4" style={{borderColor: effectivePrimaryColor}}>
                  <div className="absolute top-0 right-0 p-20 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div>
                      <div className="flex items-center gap-2 text-amber-600 mb-4" style={{color: effectivePrimaryColor}}>
                          <Trophy size={18} />
                          <span className="font-bold text-sm uppercase tracking-wider">Next Payout</span>
                      </div>
                      
                      {nextRecipient ? (
                        <div className="text-center py-2">
                             <div className="relative inline-block">
                                <img src={nextRecipient.avatarUrl || ''} className="w-20 h-20 rounded-full border-4 border-amber-100 dark:border-amber-900/30 object-cover mx-auto" alt={nextRecipient.name} />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                    Queue #{(nextRecipient.payoutQueuePosition || 0)}
                                </div>
                             </div>
                             <h3 className="mt-4 font-bold text-xl text-slate-900 dark:text-white">{nextRecipient.name}</h3>
                             <p className="text-slate-500 text-sm mt-1">Est. {currencySymbol} {(expectedCollection || 0).toLocaleString()}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          No active members for payout.
                        </div>
                      )}
                  </div>
                  
                  <Button 
                    className="w-full mt-4 text-white shadow-amber-500/20 border-none" 
                    style={{backgroundColor: effectivePrimaryColor}}
                    onClick={() => setActiveTab('PAYOUTS')}
                  >
                      View Schedule
                  </Button>
              </Card>
          </div>

          {/* Activity & Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Financial Chart */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Activity size={18} className="text-indigo-500"/> Fund Performance
                      </h3>
                      <div className="flex gap-2">
                          <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">6 Months</span>
                      </div>
                  </div>
                  <div className="w-full h-[300px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                            { name: 'Sep', amount: (expectedCollection || 0) * 0.9 },
                            { name: 'Oct', amount: (expectedCollection || 0) },
                            { name: 'Nov', amount: (expectedCollection || 0) * 0.95 },
                            { name: 'Dec', amount: (expectedCollection || 0) * 1.2 }, 
                            { name: 'Jan', amount: (expectedCollection || 0) * 0.8 },
                            { name: 'Feb', amount: (totalCollectedThisMonth || 0) },
                        ]}>
                            <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={effectivePrimaryColor} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={effectivePrimaryColor} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} 
                                itemStyle={{color: '#fff'}}
                                cursor={{stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4'}}
                            />
                            <Area type="monotone" dataKey="amount" stroke={effectivePrimaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Quick Actions & Payout List */}
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setActiveTab('CONTRIBUTIONS')} className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 transition-all text-left group">
                          <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                              <Plus size={20} />
                          </div>
                          <span className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Add Funds</span>
                      </button>
                      <button onClick={() => setActiveTab('LOANS')} className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 border border-amber-100 dark:border-amber-500/20 transition-all text-left group">
                          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                              <CreditCard size={20} />
                          </div>
                          <span className="font-bold text-amber-900 dark:text-amber-300 text-sm">New Loan</span>
                      </button>
                  </div>

                  <Card className="flex-1" noPadding>
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Upcoming Queue</h4>
                      </div>
                      <div className="p-2 space-y-1">
                          {payoutQueue.slice(0, 3).map((m, i) => (
                              <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`} style={{backgroundColor: i === 0 ? effectivePrimaryColor : undefined}}>
                                      {(m.payoutQueuePosition || 0)}
                                  </div>
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">{m.name}</span>
                                  <span className="text-xs text-slate-400">{currencySymbol} {(m.monthlyPledge || 0).toLocaleString()}</span>
                              </div>
                          ))}
                          {payoutQueue.length === 0 && (
                            <div className="text-center text-xs text-slate-400 py-4">No members in payout queue.</div>
                          )}
                      </div>
                  </Card>
              </div>
          </div>
      </div>
    );
  }

  const renderMembers = () => {
    const filteredMembers = members.filter(m => (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()));

    return (
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
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowInviteModal(true)} className="bg-white dark:bg-slate-800">
                        <Mail size={18} className="mr-2" /> Invite Member
                    </Button>
                    <Button onClick={handleOpenAddMember}>
                        <UserPlus size={18} className="mr-2" /> Add Member
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMembers.map(member => (
                    <div key={member.id} className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-4">
                               <div className="relative">
                                   <img src={member.avatarUrl || ''} className="w-16 h-16 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform" alt={member.name} />
                                   <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-1 rounded-full">
                                       <div className={`w-3 h-3 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                   </div>
                               </div>
                               <div>
                                   <h4 className="font-bold text-lg text-slate-900 dark:text-white">{member.name}</h4>
                                   <p className="text-sm text-slate-500">{member.phone}</p>
                                   <p className="text-xs text-slate-400 truncate max-w-[150px]">{member.email}</p>
                               </div>
                           </div>
                           <div className="flex flex-col gap-2 items-end">
                               <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-400">
                                   #{(member.payoutQueuePosition || 0)}
                               </div>
                               <div className="flex gap-1">
                                   <button 
                                      onClick={() => handleOpenEditMember(member)}
                                      className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="Edit Profile"
                                   >
                                       <Edit size={16} />
                                   </button>
                                   <button 
                                      onClick={() => handleDeleteMember(member.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete Member"
                                   >
                                       <Trash2 size={16} />
                                   </button>
                               </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-100 dark:border-slate-800 mb-4">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pledge</p>
                                <p className="font-bold text-slate-700 dark:text-slate-200">{currencySymbol} {(member.monthlyPledge || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Saved</p>
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">{currencySymbol} {(member.totalContributed || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Consistency Bar */}
                        <div className="mb-4">
                             <div className="flex justify-between text-xs mb-1">
                                 <span className="text-slate-500">Contribution Consistency</span>
                                 <span className="text-emerald-500 font-bold">98%</span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500 w-[98%] rounded-full"></div>
                             </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => handleOpenEditMember(member)} className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 transition-colors">
                                View Profile
                            </button>
                            <button className="flex-1 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
                                Log Payment
                            </button>
                        </div>
                    </div>
                ))}
                {filteredMembers.length === 0 && (
                    <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        No members found.
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderContributions = () => (
      <div className="space-y-6 animate-fade-in">
          <Card className="overflow-hidden border-0 shadow-lg" noPadding>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900">
                  <div>
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white">Contribution Ledger</h3>
                      <p className="text-sm text-slate-500">Showing entries for <span className="font-semibold text-indigo-600">{currentMonth}</span></p>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm">Export CSV</Button>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus size={16} className="mr-2"/> New Entry</Button>
                  </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 uppercase text-xs font-semibold">
                          <tr>
                              <th className="px-6 py-4">Transaction Details</th>
                              <th className="px-6 py-4">Date & Time</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Method</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {contributions.map(con => {
                              const member = members.find(m => m.id === con.memberId);
                              return (
                                  <tr key={con.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                  {(member?.name || 'U').charAt(0)}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-slate-900 dark:text-white">{member?.name || 'Unknown'}</p>
                                                  <p className="text-xs text-slate-500">Monthly Contribution</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-slate-500">
                                          {new Date(con.date).toLocaleDateString()}
                                          <span className="block text-xs text-slate-400">{new Date(con.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </td>
                                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{currencySymbol} {(con.amount || 0).toFixed(2)}</td>
                                      <td className="px-6 py-4">
                                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300">{con.method}</span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Paid
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ChevronRight size={16}/></Button>
                                      </td>
                                  </tr>
                              );
                          })}
                          {contributions.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No contributions found for this period.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </Card>
      </div>
  );

  const renderLoans = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-amber-500 rounded-3xl text-white shadow-xl shadow-amber-500/20 relative overflow-hidden">
               <div className="absolute -left-10 -bottom-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
               <div className="relative z-10">
                   <h3 className="text-2xl font-bold flex items-center gap-2"><Sparkles size={24} /> Internal Lending Pool</h3>
                   <p className="text-amber-100 mt-2 max-w-lg">Members can borrow from the accumulated pool at low interest rates. Total active book value is {currencySymbol} {(loans.reduce((acc, l) => acc + (l.balanceRemaining || 0), 0) || 0).toLocaleString()}.</p>
               </div>
               <Button className="bg-white text-amber-600 hover:bg-amber-50 border-none shadow-lg relative z-10">
                   Apply for Loan
               </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loans.length > 0 ? loans.map(loan => (
                  <div key={loan.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-xl text-amber-600">
                                  <CreditCard size={24} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-lg dark:text-white">{loan.customerName}</h4>
                                  <p className="text-xs text-slate-500">Loan #{loan.id.slice(-4)}</p>
                              </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              loan.status === LoanStatus.ACTIVE ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                              {loan.status}
                          </span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Principal</span>
                              <span className="font-bold dark:text-white">{currencySymbol} {(loan.amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Interest Rate</span>
                              <span className="font-bold dark:text-white">{(loan.interestRate || 0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Total Repayable</span>
                              <span className="font-bold dark:text-white">{currencySymbol} {(loan.totalRepayable || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Balance Remaining</span>
                              <span className="font-bold text-red-500">{currencySymbol} {(loan.balanceRemaining || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Due Date</span>
                              <span className="font-bold dark:text-white">{new Date(loan.dueDate).toLocaleDateString()}</span>
                          </div>
                      </div>

                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
                          View Repayments
                      </Button>
                  </div>
              )) : (
                <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No loans found.
                </div>
              )}
          </div>
      </div>
  );

  const renderPayouts = () => (
      <div className="space-y-6 animate-fade-in">
          <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Payout Schedule</h3>
              <p className="text-sm text-slate-500 mb-6">
                  Members are paid out in a rotating queue. The next payout is scheduled for the {(tenantProfile.cycleSettings?.endDay || 0)}th of each month.
              </p>
              
              <div className="space-y-4">
                  {members.filter(m => m.status === 'ACTIVE').sort((a,b) => (a.payoutQueuePosition || 999) - (b.payoutQueuePosition || 999)).map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-indigo-100 text-indigo-600`}>
                                  {(member.payoutQueuePosition || 0)}
                              </div>
                              <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                                  <p className="text-xs text-slate-500">Next payout in 3 cycles</p> {/* Mock remaining cycles */}
                              </div>
                          </div>
                          <Button size="sm" variant="outline">View History</Button>
                      </div>
                  ))}
                   {members.filter(m => m.status === 'ACTIVE').length === 0 && (
                        <div className="text-center text-slate-400 py-4">No active members to schedule payouts.</div>
                   )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    onClick={handleProcessPayout}
                    isLoading={isProcessingPayout}
                  >
                      {isProcessingPayout ? 'Processing...' : 'Process Next Payout'}
                  </Button>
              </div>
          </Card>
      </div>
  );

  return (
    <div className="h-full flex flex-col">
       {/* Sticky Header */}
       <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-4 mb-2 border-b border-slate-200/50 dark:border-slate-800/50">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                   <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                       <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                   </button>
                   <div className="flex items-center gap-3">
                       <img src={tenantProfile.branding?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenantProfile.name || '')}&background=${(effectivePrimaryColor || globalSettings.primaryColor)?.replace('#', '')}&color=fff&size=128`} alt={tenantProfile.branding?.displayName || tenantProfile.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm" />
                       <div>
                           <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none">{tenantProfile.branding?.displayName || tenantProfile.name}</h2>
                           <span className="text-xs text-slate-500">Stokvel Management</span>
                       </div>
                   </div>
               </div>
               
               {/* Floating Tab Dock */}
               <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex gap-1 overflow-x-auto max-w-full">
                   {['OVERVIEW', 'MEMBERS', 'CONTRIBUTIONS', 'PAYOUTS', 'LOANS', 'SETTINGS'].map(tab => (
                       <button
                           key={tab}
                           onClick={() => setActiveTab(tab as any)}
                           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                               activeTab === tab 
                               ? 'bg-slate-900 text-white shadow-md' // Default active style
                               : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
                           }`}
                           style={activeTab === tab ? { backgroundColor: effectivePrimaryColor } : {}} // Apply dynamic color here
                       >
                           {tab.charAt(0) + tab.slice(1).toLowerCase()}
                       </button>
                   ))}
               </div>
           </div>
       </div>

       {/* Content */}
       <div className="flex-1 py-4">
           {activeTab === 'OVERVIEW' && renderOverview()}
           {activeTab === 'MEMBERS' && renderMembers()}
           {activeTab === 'CONTRIBUTIONS' && renderContributions()}
           {activeTab === 'PAYOUTS' && renderPayouts()}
           {activeTab === 'LOANS' && renderLoans()}
           {activeTab === 'SETTINGS' && isAdmin && <BusinessSettings tenantId={tenantId} />}
           {activeTab === 'SETTINGS' && !isAdmin && (
                <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl mx-auto max-w-md mt-10">
                    <AlertCircle size={48} className="mx-auto mb-4"/>
                    <h3 className="font-bold text-xl">Access Denied</h3>
                    <p className="text-sm mt-2">You do not have sufficient permissions to view these settings.</p>
                </div>
            )}
       </div>

       {/* Member Add/Edit Modal */}
       <Modal 
         isOpen={showMemberModal} 
         onClose={() => setShowMemberModal(false)} 
         title={selectedMember ? 'Edit Profile' : 'Add New Member'} 
         size="md"
       >
         <div className="space-y-4 pt-2">
             <div className="space-y-1.5">
                 <label className="text-sm font-semibold">Full Name</label>
                 <input 
                    type="text" 
                    className="input-field w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                 />
             </div>
             <div className="space-y-1.5">
                 <label className="text-sm font-semibold">Phone Number</label>
                 <input 
                    type="tel" 
                    className="input-field w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                    value={formData.phone || ''} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. +27 82 123 4567"
                 />
             </div>
             <div className="space-y-1.5">
                 <label className="text-sm font-semibold">Email (Optional)</label>
                 <input 
                    type="email" 
                    className="input-field w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                    value={formData.email || ''} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. john.doe@example.com"
                 />
             </div>
             <div className="space-y-1.5">
                 <label className="text-sm font-semibold">Monthly Pledge ({currencySymbol})</label>
                 <input 
                    type="number" 
                    className="input-field w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                    value={formData.monthlyPledge || ''} 
                    onChange={e => setFormData({...formData, monthlyPledge: Number(e.target.value)})}
                    placeholder="e.g. 1000"
                 />
             </div>
             <div className="space-y-1.5">
                 <label className="text-sm font-semibold">Join Date</label>
                 <input 
                    type="date" 
                    className="input-field w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                    value={formData.joinDate || new Date().toISOString().split('T')[0]} 
                    onChange={e => setFormData({...formData, joinDate: e.target.value})}
                 />
             </div>
             <div className="pt-4 flex justify-end gap-2">
                 <Button variant="ghost" onClick={() => setShowMemberModal(false)}>Cancel</Button>
                 <Button onClick={handleSaveMember}>
                    <Save size={18} className="mr-2" /> Save Member
                 </Button>
             </div>
         </div>
       </Modal>

       {/* Invite Modal */}
       <Modal
         isOpen={showInviteModal}
         onClose={() => setShowInviteModal(false)}
         title="Invite New Member"
         size="sm"
       >
           <div className="space-y-4 pt-2">
               <input 
                  type="email" 
                  className="input-field w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="Enter email..."
               />
               <div className="pt-2 flex justify-end gap-2">
                   <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                   <Button onClick={handleSendInvite} disabled={!inviteEmail}>
                       <Mail size={18} className="mr-2" /> Send Invite
                   </Button>
               </div>
           </div>
       </Modal>
    </div>
  );
};