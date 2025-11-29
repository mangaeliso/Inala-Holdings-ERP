import React, { useState, useEffect } from 'react';
import { getTenants, getStokvelMembers, addTenant } from '../services/firestore';
import { TenantType, Tenant } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Users, ShieldCheck, Wallet, ArrowRight, Calendar, Star, Target, CheckCircle2 } from 'lucide-react';

interface StokvelsProps {
    onOpenModule?: (moduleId: string, tenantId: string) => void;
}

export const Stokvels: React.FC<StokvelsProps> = ({ onOpenModule }) => {
  const [stokvels, setStokvels] = useState<Tenant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  
  // Stats map: tenantId -> { memberCount, totalPool }
  const [stats, setStats] = useState<Record<string, {memberCount: number, totalPool: number}>>({});
  
  // Form State
  const [formData, setFormData] = useState<Partial<Tenant>>({
      name: '',
      type: TenantType.STOKVEL,
      currency: 'ZAR',
      primaryColor: '#0ea5e9',
      subscriptionTier: 'BASIC',
      isActive: true,
      target: 50000
  });

  useEffect(() => {
     const load = async () => {
         const allTenants = await getTenants();
         const stoks = allTenants.filter(t => t.type === TenantType.STOKVEL);
         setStokvels(stoks);

         // Load stats for each stokvel
         const newStats: any = {};
         for (const s of stoks) {
             const members = await getStokvelMembers(s.id);
             newStats[s.id] = {
                 memberCount: members.length,
                 totalPool: members.reduce((sum, m) => sum + m.totalContributed, 0)
             };
         }
         setStats(newStats);
     };
     load();
  }, [refresh]);

  const handleOpenAdd = () => {
      setFormData({
          name: '',
          type: TenantType.STOKVEL,
          currency: 'ZAR',
          primaryColor: '#0ea5e9',
          subscriptionTier: 'BASIC',
          isActive: true,
          target: 50000
      });
      setShowModal(true);
  };

  const handleSave = async () => {
      if (!formData.name) return;
      
      const newTenant: Tenant = {
          ...formData,
          id: `t_stok_${Date.now()}`,
          logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || '')}&background=${formData.primaryColor?.replace('#', '')}&color=fff&size=128`
      } as Tenant;

      await addTenant(newTenant);
      setShowModal(false);
      setRefresh(prev => prev + 1);
  };
  
  const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#1e293b'];

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Stokvel Groups</h2>
                <p className="text-slate-500 mt-2 text-base">Manage your cooperative savings groups, member rotations, and automated payouts.</p>
            </div>
            <Button className="shadow-lg shadow-indigo-500/20" onClick={handleOpenAdd}>
                <Plus size={18} className="mr-2" />
                Register New Group
            </Button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stokvels.map(stok => {
                const sStats = stats[stok.id] || { memberCount: 0, totalPool: 0 };
                const target = stok.target || 100000;
                const progress = Math.min(100, (sStats.totalPool / target) * 100);

                return (
                    <div 
                        key={stok.id} 
                        className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        {/* Top Accent Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 opacity-50 z-0"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-bl-full z-0" style={{ color: stok.primaryColor }}></div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 rounded-2xl p-1 bg-white dark:bg-slate-800 shadow-sm">
                                    <img src={stok.logoUrl} alt={stok.name} className="w-full h-full rounded-xl object-cover" />
                                </div>
                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <Star size={12} className="text-amber-400 fill-amber-400" /> Premium
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{stok.name}</h3>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                                A community savings group dedicated to mutual financial growth and support.
                            </p>

                            {/* Stats Strip */}
                            <div className="grid grid-cols-3 gap-2 mb-4 border-y border-slate-100 dark:border-slate-800 py-4">
                                <div className="text-center">
                                    <div className="text-indigo-500 mb-1 flex justify-center"><Users size={18}/></div>
                                    <div className="font-bold text-slate-900 dark:text-white">{sStats.memberCount}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Members</div>
                                </div>
                                <div className="text-center border-l border-slate-100 dark:border-slate-800">
                                    <div className="text-emerald-500 mb-1 flex justify-center"><Wallet size={18}/></div>
                                    <div className="font-bold text-slate-900 dark:text-white">{(sStats.totalPool/1000).toFixed(1)}k</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Pool</div>
                                </div>
                                <div className="text-center border-l border-slate-100 dark:border-slate-800">
                                    <div className="text-amber-500 mb-1 flex justify-center"><Calendar size={18}/></div>
                                    <div className="font-bold text-slate-900 dark:text-white">25th</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Payout</div>
                                </div>
                            </div>

                            {/* Target Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <Target size={12} />
                                        <span>Goal: {stok.currency} {target.toLocaleString()}</span>
                                    </div>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <Button 
                                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors h-11"
                                onClick={() => onOpenModule && onOpenModule('stokvel-dashboard', stok.id)}
                            >
                                Open Dashboard <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )
            })}
            
            {/* Create New Card */}
            <button 
                onClick={handleOpenAdd}
                className="relative group rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-300 min-h-[420px]"
            >
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 flex items-center justify-center mb-4 transition-colors">
                    <Plus size={32} className="text-slate-400 group-hover:text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Start a New Stokvel</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">Create a new group, invite members, set targets and set up automated contribution tracking.</p>
            </button>
        </div>

        {/* Create Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Start New Stokvel">
            <div className="space-y-6 pt-2">
                 {/* Branding Preview */}
                 <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-colors" style={{ backgroundColor: formData.primaryColor }}>
                        {formData.name ? formData.name.charAt(0).toUpperCase() : <Users size={32} />}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Stokvel Name</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Sisonke Savings"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Amount</label>
                        <input 
                            type="number" 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            value={formData.target}
                            onChange={e => setFormData({...formData, target: Number(e.target.value)})}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Currency</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.currency}
                            onChange={e => setFormData({...formData, currency: e.target.value})}
                        >
                            <option value="ZAR">ZAR (Rand)</option>
                            <option value="USD">USD (Dollar)</option>
                            <option value="MZN">MZN (Metical)</option>
                        </select>
                     </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Theme Color</label>
                    <div className="flex flex-wrap gap-3">
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => setFormData({...formData, primaryColor: color})}
                                className={`w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${formData.primaryColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900 scale-110' : ''}`}
                                style={{ backgroundColor: color }}
                            >
                                {formData.primaryColor === color && <CheckCircle2 size={16} className="text-white" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        Create Group
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
