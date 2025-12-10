import React, { useState, useEffect } from 'react';
import { getTenants, addTenant, updateTenant, getTenantBrandingSettings } from '../services/firestore'; // Import updated updateTenant
import { TenantType, Tenant, BrandingSettings, BusinessCycleSettings, AccessSettings } from '../types'; // Import additional types
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Plus, LayoutDashboard, ArrowUpRight, Store, MapPin, Edit2, CheckCircle2 } from 'lucide-react';
import { useUI } from '../context/UIContext';

interface BusinessesProps {
    onOpenModule: (moduleId: string, tenantId: string) => void;
}

export const Businesses: React.FC<BusinessesProps> = ({ onOpenModule }) => {
  const { globalSettings } = useUI();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Form State - now reflects the full tenant profile and potential branding settings
  // Initialized with safe defaults using global settings for colors
  const [formData, setFormData] = useState<Partial<Tenant & BrandingSettings & BusinessCycleSettings & AccessSettings>>({
      name: '',
      type: TenantType.BUSINESS,
      regNumber: '',
      taxNumber: '',
      address: '',
      contactNumber: '',
      email: '',
      website: '',
      primaryColor: globalSettings.primaryColor, // From GlobalSettings
      secondaryColor: globalSettings.secondaryColor, // From GlobalSettings
      logoUrl: '', 
      displayName: '', 
      slogan: '', 
      category: 'General',
      isActive: true,
      currencySymbol: 'ZAR', // Currency symbol for cycle settings
      subscriptionTier: 'BASIC' // Subscription tier for access settings
  });

  useEffect(() => {
    const loadTenants = async () => {
        setIsLoading(true);
        try {
            const allTenants = await getTenants();
            // Filter for Business and Lending types, exclude global
            const businessTenants = allTenants.filter(tenant => 
                (tenant.type === TenantType.BUSINESS || tenant.type === TenantType.LENDING) && tenant.id !== 'global'
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
          name: '', type: TenantType.BUSINESS, regNumber: '', taxNumber: '',
          address: '', contactNumber: '', email: '', website: '',
          primaryColor: globalSettings.primaryColor, secondaryColor: globalSettings.secondaryColor,
          logoUrl: '', displayName: '', slogan: '', category: 'General', isActive: true,
          currencySymbol: 'ZAR', subscriptionTier: 'BASIC'
      });
      setShowModal(true);
  };

  const handleOpenEdit = async (tenant: Tenant) => {
      // Fetch full branding settings for editing
      const branding = await getTenantBrandingSettings(tenant.id);
      setEditingTenant(tenant);
      setFormData({
        ...tenant,
        // Overlay tenant's direct fields with branding's displayName/logo if available
        name: tenant.name, // Keep root tenant name
        logoUrl: branding?.logoUrl || undefined, 
        primaryColor: branding?.primaryColor || globalSettings.primaryColor,
        secondaryColor: branding?.secondaryColor || globalSettings.secondaryColor,
        displayName: branding?.displayName || tenant.name,
        slogan: branding?.slogan || tenant.category, // Fallback slogan to category
        currencySymbol: tenant.cycleSettings?.currencySymbol || 'ZAR', // Get currency from cycle settings
        subscriptionTier: tenant.access?.subscriptionTier || 'BASIC' // Get subscription tier from access settings
      });
      setShowModal(true);
  };

  const handleSave = async () => {
      if (!formData.name) return; // Basic validation
      
      // Construct main Tenant object (without nested settings objects)
      const tenantToSave: Tenant = {
          id: editingTenant ? editingTenant.id : `t_biz_${Date.now()}`,
          name: formData.name, // Main name from form
          type: formData.type || TenantType.BUSINESS,
          isActive: formData.isActive ?? true,
          category: formData.category,
          regNumber: formData.regNumber,
          taxNumber: formData.taxNumber,
          address: formData.address,
          contactNumber: formData.contactNumber,
          email: formData.email,
          website: formData.website,
      };

      // Construct BrandingSettings sub-document
      const brandingToSave: BrandingSettings = {
          logoUrl: formData.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || formData.name || '')}&background=${(formData.primaryColor || globalSettings.primaryColor)?.replace('#', '')}&color=fff&size=128`,
          primaryColor: formData.primaryColor || globalSettings.primaryColor,
          secondaryColor: formData.secondaryColor || globalSettings.secondaryColor,
          displayName: formData.displayName || formData.name,
          slogan: formData.slogan || formData.category || 'Business Entity'
      };

      // Construct AccessSettings sub-document
      const accessToSave: AccessSettings = {
        subscriptionTier: formData.subscriptionTier || 'BASIC'
      };

      // Construct BusinessCycleSettings sub-document (for currency symbol)
      const cycleSettingsToSave: BusinessCycleSettings = {
        startDay: 5, // Default
        endDay: 4,   // Default
        fiscalStartMonth: 1, // Default
        currencySymbol: formData.currencySymbol || 'ZAR'
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
          alert("Failed to save tenant. Check console for details.");
      }
  };

  // Use globalSettings primary/secondary colors for the default color palette
  const colors = [
    globalSettings.primaryColor, 
    globalSettings.secondaryColor, 
    '#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#0f172a'
  ];

  if (isLoading) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading business units...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Business Units & Lenders</h2>
                <p className="text-slate-500 mt-2 text-base">Overview of retail outlets, service points, and lending entities.</p>
            </div>
            <Button className="shadow-lg shadow-indigo-500/20" onClick={handleOpenAdd}>
                <Plus size={18} className="mr-2" />
                New Entity
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(biz => {
                const branding = biz.branding; // Access nested branding
                const effectivePrimaryColor = branding?.primaryColor || globalSettings.primaryColor;
                // Fix: Access logoUrl from branding
                const displayLogo = branding?.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(biz.name || '')}&background=${(effectivePrimaryColor || globalSettings.primaryColor)?.replace('#', '')}&color=fff&size=128`;
                const displayName = branding?.displayName || biz.name;
                const displaySlogan = branding?.slogan || biz.category;
                const currencySymbol = biz.cycleSettings?.currencySymbol || 'R';


                return (
                <div 
                    key={biz.id} 
                    className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                    {/* Decorative Brand Accent */}
                    <div 
                        className="absolute top-0 right-0 w-32 h-32 opacity-[0.05] rounded-bl-full -mr-10 -mt-10 pointer-events-none transition-opacity group-hover:opacity-10" 
                        style={{ backgroundColor: effectivePrimaryColor }}
                    ></div>
                    
                    <div className="relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                     {/* Logo container with ring */}
                                    <div className="w-16 h-16 rounded-2xl p-1 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 group-hover:ring-2 group-hover:ring-indigo-100 dark:group-hover:ring-slate-600 transition-all">
                                        <img src={displayLogo} alt={displayName} className="w-full h-full rounded-xl object-cover" />
                                    </div>
                                     {/* Status indicator */}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-900 flex items-center justify-center ${biz.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        {biz.isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl leading-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onOpenModule('business-dashboard', biz.id)}>{displayName}</h3>
                                     {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${biz.type === TenantType.LENDING ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                            {biz.type === TenantType.LENDING ? 'Lender' : displaySlogan}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">
                                            {currencySymbol}
                                        </span>
                                    </div>
                                </div>
                            </div>
                             {/* Options menu / Edit */}
                            <button 
                                onClick={() => handleOpenEdit(biz)}
                                className="text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                                title="Edit Business Settings"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>

                        {/* Location / Meta (Mock) */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                            <MapPin size={14} />
                            <span>{biz.address || 'Main Branch • Johannesburg, ZA'}</span>
                        </div>

                        {/* Stats Section (Mock Data) */}
                        <div className="flex items-center justify-between py-4 border-t border-b border-slate-50 dark:border-slate-800 mb-6 bg-slate-50/50 dark:bg-slate-800/20 -mx-6 px-6">
                            <div>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Active Revenue</p>
                                 <div className="flex items-center gap-2">
                                     <span className="text-lg font-black text-slate-900 dark:text-white">{currencySymbol} 12,450</span>
                                     <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                                         <ArrowUpRight size={10} className="mr-0.5" /> 12%
                                     </span>
                                 </div>
                            </div>
                            <div className="text-right">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">System Status</p>
                                 <span className={`text-xs font-bold flex items-center justify-end gap-1.5 ${biz.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                     <div className={`w-2 h-2 rounded-full ${biz.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                     {biz.isActive ? 'Operational' : 'Offline'}
                                 </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions - Modified to just dashboard full width */}
                    <div className="mt-auto">
                         <Button 
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg shadow-slate-900/10 h-11 transition-all active:scale-95"
                            onClick={() => onOpenModule('business-dashboard', biz.id)}
                         >
                            <LayoutDashboard size={18} /> <span className="font-bold">Dashboard</span>
                         </Button>
                    </div>
                </div>
            )})}
            
            {/* Add New Placeholder Card */}
            <button 
                onClick={handleOpenAdd}
                className="group relative rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[320px] h-full"
            >
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all flex items-center justify-center mb-6">
                    <Plus size={32} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Register New Entity</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                    Add a new retail outlet, branch, or lending service to your organization.
                </p>
            </button>
        </div>

        {/* Create / Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTenant ? 'Edit Business Settings' : 'Register New Business'}>
            <div className="space-y-6 pt-2">
                {/* Branding Section */}
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
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Entity Type</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.type || TenantType.BUSINESS}
                            onChange={e => setFormData({...formData, type: e.target.value as TenantType})}
                        >
                            <option value={TenantType.BUSINESS}>Retail Business</option>
                            <option value={TenantType.LENDING}>LENDING Service</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.category || 'General'}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="General">General Business</option>
                            <option value="Butchery">Butchery / Meat Market</option>
                            <option value="Barber">Barber Shop / Salon</option>
                            <option value="IT">IT & Electronics</option>
                            <option value="Services">Professional Services</option>
                            <option value="Agriculture">Agriculture / Farming</option>
                            <option value="Retail">Retail Store</option>
                            <option value="Restaurant">Restaurant / Catering</option>
                            <option value="Logistics">Logistics / Transport</option>
                            <option value="Healthcare">Healthcare / Pharmacy</option>
                            <option value="Education">Education / Training</option>
                            <option value="Construction">Construction / Hardware</option>
                            <option value="Automotive">Automotive / Spares</option>
                            <option value="Fashion">Fashion / Clothing</option>
                            <option value="Entertainment">Entertainment / Events</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Other">Other</option>
                        </select>
                     </div>
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
                            <option value="GBP">GBP (Pound)</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plan Tier</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.subscriptionTier || 'BASIC'}
                            onChange={e => setFormData({...formData, subscriptionTier: e.target.value as any})}
                        >
                            <option value="BASIC">Basic</option>
                            <option value="PRO">Pro</option>
                            <option value="ENTERPRISE">Enterprise</option>
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
                        {/* Custom color picker */}
                        <input type="color" value={formData.primaryColor || '#6366f1'} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-10 h-10 p-0 border-0 rounded-full overflow-hidden" />
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