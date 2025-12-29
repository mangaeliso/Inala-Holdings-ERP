
import React, { useState, useEffect } from 'react';
import { getTenants, addTenant, updateTenant, getTenantBrandingSettings, getTransactions, getLoans } from '../services/firestore';
import { TenantType, Tenant, BrandingSettings, BusinessCycleSettings, AccessSettings, TransactionType, BusinessMode } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, LayoutDashboard, Store, MapPin, Edit2, CheckCircle2, CreditCard, ShoppingBag } from 'lucide-react';
import { useUI } from '../context/UIContext';

interface BusinessesProps {
    onOpenModule: (moduleId: string, tenantId: string) => void;
}

const BusinessCard: React.FC<{ 
    tenant: Tenant, 
    onOpen: (id: string) => void, 
    onEdit: (t: Tenant) => void,
    globalPrimary: string 
}> = ({ tenant, onOpen, onEdit, globalPrimary }) => {
    const [revenue, setRevenue] = useState<number | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoadingStats(true);
            try {
                // Determine metrics based on mode or legacy type
                const isLendingOnly = tenant.businessMode === 'LOANS' || (tenant.type as string) === 'LOAN' || (tenant.type as string) === 'LENDING';
                
                if (isLendingOnly) {
                    const loans = await getLoans(tenant.id);
                    const totalRemaining = loans.reduce((sum, l) => sum + (l.balanceRemaining || 0), 0);
                    setRevenue(totalRemaining);
                } else {
                    const txs = await getTransactions(tenant.id);
                    const total = txs
                        .filter(t => t.type === TransactionType.SALE && t.status !== 'VOIDED') // FIXED: Exclude voided transactions
                        .reduce((sum, t) => sum + (t.amount || 0), 0);
                    setRevenue(total);
                }
            } catch (err) {
                console.error(`Failed to fetch stats for ${tenant.id}:`, err);
                setRevenue(0);
            } finally {
                setIsLoadingStats(false);
            }
        };
        fetchStats();
    }, [tenant.id, tenant.type, tenant.businessMode]);

    const branding = tenant.branding;
    const effectivePrimaryColor = branding?.primaryColor || globalPrimary;
    const displayLogo = branding?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.name || '')}&background=${(effectivePrimaryColor).replace('#', '')}&color=fff&size=128`;
    const displayName = branding?.displayName || tenant.name;
    const displaySlogan = branding?.slogan || tenant.category;
    const currencySymbol = tenant.cycleSettings?.currencySymbol || 'R';
    
    const mode = tenant.businessMode || 'RETAIL';

    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            <div 
                className="absolute top-0 right-0 w-32 h-32 opacity-[0.05] rounded-bl-full -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-10" 
                style={{ backgroundColor: effectivePrimaryColor }}
            ></div>
            
            <div className="relative z-10 flex-1">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl p-1 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 group-hover:ring-2 group-hover:ring-indigo-100 dark:group-hover:ring-slate-600 transition-all">
                                <img src={displayLogo} alt={displayName} className="w-full h-full rounded-xl object-cover" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-900 flex items-center justify-center ${tenant.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                {tenant.isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl leading-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onOpen(tenant.id)}>
                                {displayName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${mode === 'LOANS' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                    {mode === 'LOANS' ? <CreditCard size={10}/> : <ShoppingBag size={10}/>}
                                    {mode === 'LOANS' ? 'Lender' : mode === 'BOTH' ? 'Retail + Loans' : 'Retail'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">
                                    {currencySymbol}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => onEdit(tenant)}
                        className="text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <Edit2 size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <MapPin size={14} />
                    <span>{tenant.address || 'Location not specified'}</span>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-b border-slate-50 dark:border-slate-800 mb-6 bg-slate-50/50 dark:bg-slate-800/20 -mx-6 px-6">
                    <div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">
                            {mode === 'LOANS' ? 'Portfolio Value' : 'Revenue'}
                         </p>
                         <div className="flex items-center gap-2">
                             {isLoadingStats ? (
                                 <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
                             ) : (
                                <span className="text-lg font-black text-slate-900 dark:text-white">
                                    {currencySymbol} {(revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                             )}
                         </div>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">System Status</p>
                         <span className={`text-xs font-bold flex items-center justify-end gap-1.5 ${tenant.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                             <div className={`w-2 h-2 rounded-full ${tenant.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                             Operational
                         </span>
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                 <Button 
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg shadow-slate-900/10 h-11 transition-all active:scale-95"
                    onClick={() => onOpen(tenant.id)}
                 >
                    <LayoutDashboard size={18} /> <span className="font-bold">Dashboard</span>
                 </Button>
            </div>
        </div>
    );
};

export const Businesses: React.FC<BusinessesProps> = ({ onOpenModule }) => {
  const { globalSettings } = useUI();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Tenant & BrandingSettings & BusinessCycleSettings & AccessSettings>>({
      name: '',
      type: TenantType.BUSINESS,
      businessMode: 'RETAIL',
      regNumber: '',
      taxNumber: '',
      address: '',
      contactNumber: '',
      email: '',
      website: '',
      primaryColor: globalSettings.primaryColor,
      secondaryColor: globalSettings.secondaryColor,
      logoUrl: '', 
      displayName: '', 
      slogan: '', 
      category: 'General',
      isActive: true,
      currencySymbol: 'ZAR',
      subscriptionTier: 'BASIC'
  });

  useEffect(() => {
    const loadTenants = async () => {
        setIsLoading(true);
        try {
            const allTenants = await getTenants();
            const businessTenants = allTenants.filter(tenant => 
                tenant.id !== 'global' && 
                (tenant.type === TenantType.BUSINESS || (tenant.type as string) === 'LOAN' || (tenant.type as string) === 'LENDING')
            );
            
            setTenants(businessTenants);
        } catch (error) {
            console.error("Failed to load business tenants:", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadTenants();
  }, [refresh, globalSettings]);

  const handleOpenAdd = () => {
      setEditingTenant(null);
      setFormData({
          name: '', type: TenantType.BUSINESS, businessMode: 'RETAIL', regNumber: '', taxNumber: '',
          address: '', contactNumber: '', email: '', website: '',
          primaryColor: globalSettings.primaryColor, secondaryColor: globalSettings.secondaryColor,
          logoUrl: '', displayName: '', slogan: '', category: 'General', isActive: true,
          currencySymbol: 'ZAR', subscriptionTier: 'BASIC'
      });
      setShowModal(true);
  };

  const handleOpenEdit = async (tenant: Tenant) => {
      const branding = await getTenantBrandingSettings(tenant.id);
      setEditingTenant(tenant);
      setFormData({
        ...tenant,
        name: tenant.name, 
        businessMode: tenant.businessMode || 'RETAIL',
        logoUrl: branding?.logoUrl || undefined, 
        primaryColor: branding?.primaryColor || globalSettings.primaryColor,
        secondaryColor: branding?.secondaryColor || globalSettings.secondaryColor,
        displayName: branding?.displayName || tenant.name,
        slogan: branding?.slogan || tenant.category,
        currencySymbol: tenant.cycleSettings?.currencySymbol || 'ZAR',
        subscriptionTier: tenant.access?.subscriptionTier || 'BASIC'
      });
      setShowModal(true);
  };

  const handleSave = async () => {
      if (!formData.name) return;
      
      const tenantToSave: Tenant = {
          id: editingTenant ? editingTenant.id : `t_biz_${Date.now()}`,
          name: String(formData.name || ''),
          type: TenantType.BUSINESS,
          businessMode: formData.businessMode || 'RETAIL',
          isActive: !!formData.isActive,
          category: String(formData.category || ''),
          regNumber: String(formData.regNumber || ''),
          taxNumber: String(formData.taxNumber || ''),
          address: String(formData.address || ''),
          contactNumber: String(formData.contactNumber || ''),
          email: String(formData.email || ''),
          website: String(formData.website || ''),
      };

      const brandingToSave: BrandingSettings = {
          logoUrl: String(formData.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || formData.name || '')}&background=${(formData.primaryColor || globalSettings.primaryColor)?.replace('#', '')}&color=fff&size=128`),
          primaryColor: String(formData.primaryColor || globalSettings.primaryColor),
          secondaryColor: String(formData.secondaryColor || globalSettings.secondaryColor),
          displayName: String(formData.displayName || formData.name),
          slogan: String(formData.slogan || formData.category || 'Business Entity')
      };

      const accessToSave: AccessSettings = {
        subscriptionTier: formData.subscriptionTier || 'BASIC'
      };

      const cycleSettingsToSave: BusinessCycleSettings = {
        startDay: 5,
        endDay: 4,
        fiscalStartMonth: 1,
        currencySymbol: String(formData.currencySymbol || 'ZAR')
      };

      try {
          if (editingTenant) {
              await updateTenant({
                ...tenantToSave,
                branding: brandingToSave,
                access: accessToSave,
                cycleSettings: cycleSettingsToSave
              });
          } else {
              await addTenant({
                ...tenantToSave,
                branding: brandingToSave,
                access: accessToSave,
                cycleSettings: cycleSettingsToSave
              });
          }
          setShowModal(false);
          setRefresh(prev => prev + 1);
      } catch (error) {
          console.error("Failed to save tenant:", error);
      }
  };

  const colors = [globalSettings.primaryColor, globalSettings.secondaryColor, '#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#0f172a'];

  if (isLoading) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Scanning business units...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Business Units</h2>
                <p className="text-slate-500 mt-2 text-base">Overview of retail outlets and core business entities.</p>
            </div>
            <Button className="shadow-lg shadow-indigo-500/20" onClick={handleOpenAdd}>
                <Plus size={18} className="mr-2" />
                New Entity
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(biz => (
                <BusinessCard 
                    key={biz.id} 
                    tenant={biz} 
                    onOpen={(id) => onOpenModule('business-dashboard', id)} 
                    onEdit={handleOpenEdit}
                    globalPrimary={globalSettings.primaryColor}
                />
            ))}
            
            <button 
                onClick={handleOpenAdd}
                className="group relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[320px] h-full"
            >
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all flex items-center justify-center mb-6">
                    <Plus size={32} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Register New Entity</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                    Add a new retail outlet or branch to your organization.
                </p>
            </button>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTenant ? 'Edit Business Settings' : 'Register New Business'}>
            <div className="space-y-6 pt-2">
                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-colors" style={{ backgroundColor: formData.primaryColor || globalSettings.primaryColor }}>
                            {(formData.name || 'B').charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-md border border-slate-100 dark:border-slate-700">
                            <Edit2 size={14} className="text-slate-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Business Name</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value, displayName: e.target.value})}
                        placeholder="e.g. Inala Logistics"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Business Mode</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.businessMode || 'RETAIL'}
                            onChange={e => setFormData({...formData, businessMode: e.target.value as BusinessMode})}
                        >
                            <option value="RETAIL">Retail Only</option>
                            <option value="LOANS">Lending Only</option>
                            <option value="BOTH">Retail + Lending</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                            value={formData.category || ''}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            placeholder="e.g. Butchery"
                        />
                     </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Physical Address</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        value={formData.address || ''}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="e.g. 123 Main St, Pretoria"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Currency</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.currencySymbol || 'ZAR'} 
                            onChange={e => setFormData({...formData, currencySymbol: e.target.value})}
                        >
                            <option value="ZAR">ZAR (Rand)</option>
                            <option value="USD">USD (Dollar)</option>
                            <option value="MZN">MZN (Metical)</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.isActive ? 'true' : 'false'}
                            onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}
                        >
                            <option value="true">Active / Operational</option>
                            <option value="false">Inactive / Suspended</option>
                        </select>
                     </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Brand Color</label>
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
                        {editingTenant ? 'Save Changes' : 'Create Entity'}
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
