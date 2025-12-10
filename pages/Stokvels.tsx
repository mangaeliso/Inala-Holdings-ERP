import React, { useState, useEffect } from 'react';
import { getTenants, getStokvelMembers, addTenant } from '../services/firestore'; // Removed updateBusinessProfile, updateTenantBrandingSettings
import { TenantType, Tenant, BrandingSettings, BusinessCycleSettings, AccessSettings } from '../types'; // Import additional types
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, Users, Star, Target, CheckCircle2, ArrowRight, Wallet, Calendar } from 'lucide-react';
import { useUI } from '../context/UIContext';

interface StokvelsProps {
    onOpenModule?: (moduleId: string, tenantId: string) => void;
}

export const Stokvels: React.FC<StokvelsProps> = ({ onOpenModule }) => {
  const { globalSettings } = useUI();
  const [stokvels, setStokvels] = useState<Tenant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stats map: tenantId -> { memberCount, totalPool }
  const [stats, setStats] = useState<Record<string, {memberCount: number, totalPool: number}>>({});
  
  // Form State
  const [formData, setFormData] = useState<Partial<Tenant & BrandingSettings & BusinessCycleSettings & AccessSettings>>({
      name: '',
      type: TenantType.STOKVEL,
      primaryColor: globalSettings.primaryColor,
      secondaryColor: globalSettings.secondaryColor,
      logoUrl: '', // This is for branding, not direct tenant property
      displayName: '',
      slogan: '',
      isActive: true,
      target: 50000,
      currencySymbol: 'ZAR', // Default currency for new stokvel
      subscriptionTier: 'BASIC', // Default subscription for new stokvel
  });

  useEffect(() => {
     const load = async () => {
         setIsLoading(true);
         try {
             const allTenants = await getTenants();
             const stoks = allTenants.filter(t => t.type === TenantType.STOKVEL);

             setStokvels(stoks);

             // Load stats for each stokvel
             const newStats: any = {};
             for (const s of stoks) {
                 const members = await getStokvelMembers(s.id);
                 newStats[s.id] = {
                     memberCount: members.length,
                     totalPool: members.reduce((sum, m) => sum + (m.totalContributed || 0), 0)
                 };
             }
             setStats(newStats);
         } catch (error) {
             console.error("Failed to load stokvels:", error);
         } finally {
             setIsLoading(false);
         }
     };
     load();
  }, [refresh, globalSettings]);

  const handleOpenAdd = () => {
      setFormData({
          name: '', type: TenantType.STOKVEL, target: 50000,
          primaryColor: globalSettings.primaryColor, secondaryColor: globalSettings.secondaryColor,
          logoUrl: '', displayName: '', slogan: 'Community Savings Group', isActive: true,
          currencySymbol: 'ZAR', subscriptionTier: 'BASIC'
      });
      setShowModal(true);
  };

  const handleSave = async () => {
      if (!formData.name) return;
      
      const newTenant: Tenant = {
          id: `t_stok_${Date.now()}`,
          name: formData.name,
          type: TenantType.STOKVEL,
          isActive: formData.isActive ?? true,
          category: 'Community', 
          target: formData.target,
      };

      const brandingToSave: BrandingSettings = {
        logoUrl: formData.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || formData.name || '')}&background=${(formData.primaryColor || globalSettings.primaryColor)?.replace('#', '')}&color=fff&size=128`,
        primaryColor: formData.primaryColor || globalSettings.primaryColor,
        secondaryColor: formData.secondaryColor || globalSettings.secondaryColor,
        displayName: formData.displayName || formData.name,
        slogan: formData.slogan || 'Community Savings Group'
      };

      const accessToSave: AccessSettings = {
        subscriptionTier: formData.subscriptionTier || 'BASIC'
      };

      const cycleSettingsToSave: BusinessCycleSettings = {
        startDay: 25, endDay: 24, fiscalStartMonth: 1, 
        currencySymbol: formData.currencySymbol || 'ZAR' 
      };

      try {
          await addTenant({
            ...newTenant,
            branding: brandingToSave,
            access: accessToSave,
            cycleSettings: cycleSettingsToSave
          });
          
          setShowModal(false);
          setRefresh(prev => prev + 1);
      } catch (error) {
          console.error("Failed to save stokvel:", error);
          alert("Failed to save stokvel. Check console for details.");
      }
  };
  
  const colors = [
    globalSettings.primaryColor, 
    globalSettings.secondaryColor, 
    '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
  ];

  if (isLoading) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading stokvel groups...</p>
        </div>
    );
  }

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
                const progress = Math.min(100, (sStats.totalPool / (target || 1)) * 100);
                
                const branding = stok.branding; // Access nested branding
                const effectivePrimaryColor = branding?.primaryColor || globalSettings.primaryColor;
                const displayLogo = branding?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(stok.name || '')}&background=${(effectivePrimaryColor || globalSettings.primaryColor)?.replace('#', '')}&color=fff&size=128`;
                const displayName = branding?.displayName || stok.name;
                const displaySlogan = branding?.slogan || stok.category;
                const currencySymbol = stok.cycleSettings?.currencySymbol || 'R';


                return (
                    <div 
                        key={stok.id} 
                        className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        {/* Top Accent Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 opacity-50 z-0"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-bl-full z-0" style={{ color: effectivePrimaryColor }}></div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 rounded-2xl p-1 bg-white dark:bg-slate-800 shadow-sm">
                                    <img src={displayLogo} alt={displayName} className="w-full h-full rounded-xl object-cover" />
                                </div>
                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <Star size={12} className="text-amber-400 fill-amber-400" /> Premium
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{displayName}</h3>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                                {displaySlogan}
                            </p>

                            {/* Stats Strip */}
                            <div className="grid grid-cols-3 gap-2 mb-4 border-y border-slate-100 dark:border-slate-800 py-4">
                                <div className="text-center">
                                    <div className="text-indigo-500 mb-1 flex justify-center"><Users size={18}/></div>
                                    <div className="font-bold text-slate-900 dark:text-white">{(sStats.memberCount || 0)}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Members</div>
                                </div>
                                <div className="text-center border-l border-slate-100 dark:border-slate-800">
                                    <div className="text-emerald-500 mb-1 flex justify-center"><Wallet size={18}/></div>
                                    <div className="font-bold text-slate-900 dark:text-white">{(sStats.totalPool / 1000 || 0).toFixed(1)}k</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Pool</div>
                                </div>
                                <div className="text-center border-l border-slate-100 dark:border-slate-800">
                                    <div className="text-amber-500 mb-1 flex justify-center"><Calendar size={18}/></div>
                                    <div className="font-bold text-slate-900 dark:text-white">{(stok.cycleSettings?.endDay || 0)}th</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Payout</div>
                                </div>
                            </div>

                            {/* Target Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <Target size={12} />
                                        <span>Goal: {currencySymbol} {(target || 0).toLocaleString()}</span>
                                    </div>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{(progress || 0).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(progress || 0)}%`, backgroundColor: effectivePrimaryColor }}></div>
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
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-colors" style={{ backgroundColor: formData.primaryColor || globalSettings.primaryColor }}>
                        {(formData.name || 'S').charAt(0).toUpperCase()}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Stokvel Name</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value, displayName: e.target.value})}
                        placeholder="e.g. Sisonke Savings"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Amount</label>
                        <input 
                            type="number" 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            value={formData.target || ''}
                            onChange={e => setFormData({...formData, target: Number(e.target.value)})}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Currency</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.currencySymbol || 'ZAR'} // Default ZAR
                            onChange={e => setFormData({...formData, currencySymbol: e.target.value})}
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
                        {/* Custom color picker */}
                        <input type="color" value={formData.primaryColor || '#6366f1'} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden" />
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