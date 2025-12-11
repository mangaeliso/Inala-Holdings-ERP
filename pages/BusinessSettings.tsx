import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FileUploader } from '../components/ui/FileUploader';
import { useUI } from '../context/UIContext';
import { 
    getBusinessProfile, 
    updateBusinessProfile, 
    getBusinessAdmins, 
    addBusinessAdmin, 
    uploadFileToFirebaseStorage,
    getBillingPlans,
    getTenantBilling,
    getInvoices,
    updateTenantBilling,
    getGlobalSettings
} from '../services/firestore';
import { Tenant, User, UserRole, TenantType, BrandingSettings, BillingPlan, TenantBilling, Invoice, GlobalSettings } from '../types';
import { fileToBase64 } from '../lib/utils';
import { 
  Building2, Users, Mail, Bell, RefreshCw, ShoppingCart, Database, Shield,
  Save, Edit2, Plus, Trash2, CheckCircle2, AlertTriangle, Send, Lock, CreditCard, Download, ExternalLink, Globe
} from 'lucide-react';

interface BusinessSettingsProps {
  tenantId: string;
}

// Default State to prevent crashes
const DEFAULT_PROFILE: Partial<Tenant> = {
    name: '',
    type: TenantType.BUSINESS,
    branding: {
        displayName: '',
        primaryColor: '#6366f1',
        secondaryColor: '#0ea5e9',
        logoUrl: '',
        slogan: ''
    },
    access: { subscriptionTier: 'BASIC' },
    emailConfig: { senderEmail: '', templates: [] },
    notifications: {
        emailNewSale: true, smsPayment: false, dailySummary: true, 
        lowStock: true, creditWarning: true, autoMonthlyReport: true, recipients: []
    },
    cycleSettings: { startDay: 5, endDay: 4, fiscalStartMonth: 2, currencySymbol: 'R' },
    posSettings: { 
        receiptFooter: 'Thank you for your support!', taxRate: 15, 
        enableCash: true, enableCard: true, enableCredit: true, autoPrint: false,
        currencySymbol: 'R',
        numberFormat: 'R_COMMA_DECIMAL'
    }
};

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast, setTenantBranding, currentUser } = useUI();

  // Master State
  const [profile, setProfile] = useState<Partial<Tenant>>(DEFAULT_PROFILE);
  const [admins, setAdmins] = useState<User[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [billing, setBilling] = useState<TenantBilling | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [globalSettingsData, setGlobalSettingsData] = useState<GlobalSettings | null>(null);
  
  // Load Data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
          const tenantData = await getBusinessProfile(tenantId);
          const adminData = await getBusinessAdmins(tenantId);
          const plansData = await getBillingPlans();
          const billingData = await getTenantBilling(tenantId);
          const invoicesData = await getInvoices(tenantId);
          const globalData = await getGlobalSettings();
          
          if (tenantData) {
              setProfile({
                  ...DEFAULT_PROFILE,
                  ...tenantData,
                  branding: { ...DEFAULT_PROFILE.branding, ...tenantData.branding },
                  access: { ...DEFAULT_PROFILE.access, ...tenantData.access },
                  emailConfig: { ...DEFAULT_PROFILE.emailConfig, ...tenantData.emailConfig },
                  notifications: { ...DEFAULT_PROFILE.notifications, ...tenantData.notifications },
                  cycleSettings: { ...DEFAULT_PROFILE.cycleSettings, ...tenantData.cycleSettings },
                  posSettings: { ...DEFAULT_PROFILE.posSettings, ...tenantData.posSettings }
              });
          }
          setAdmins(adminData);
          setPlans(plansData);
          setBilling(billingData);
          setInvoices(invoicesData);
          setGlobalSettingsData(globalData);
      } catch (e) {
          console.error("Failed to load settings", e);
          addToast("Error loading settings", "error");
      } finally {
          setIsLoading(false);
      }
    };
    load();
  }, [tenantId]);

  // Determine tabs based on tenant type
  const settingsTabs = useMemo(() => {
      const type = profile.type || TenantType.BUSINESS;
      const baseTabs = [
          { id: 'profile', icon: Building2, label: 'Profile & Branding' },
          { id: 'admins', icon: Users, label: 'Admins & Roles' },
          { id: 'billing', icon: CreditCard, label: 'Billing & Plans' }, // New tab
          { id: 'global', icon: Globe, label: 'Platform Info' }, // Added Global Tab
          { id: 'email', icon: Mail, label: 'Email Config' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
      ];

      if (type === TenantType.STOKVEL) {
          baseTabs.push({ id: 'cycle', icon: RefreshCw, label: 'Contribution Cycle' });
      } else {
          // BUSINESS or LENDING
          baseTabs.push({ id: 'cycle', icon: RefreshCw, label: 'Business Cycle' });
          baseTabs.push({ id: 'pos', icon: ShoppingCart, label: 'POS Settings' });
      }

      baseTabs.push({ id: 'data', icon: Database, label: 'Data & Backup' });
      baseTabs.push({ id: 'security', icon: Shield, label: 'Security' });
      
      return baseTabs;
  }, [profile.type]);

  const handleSave = async () => {
      setIsSaving(true);

      // Handle Logo Upload if it's a Base64 string
      let finalLogoUrl = profile.branding?.logoUrl;
      if (finalLogoUrl && finalLogoUrl.startsWith('data:image')) {
          try {
              const fileBlob = await fetch(finalLogoUrl).then(res => res.blob());
              const file = new File([fileBlob], `logo-${tenantId}-${Date.now()}.png`, { type: fileBlob.type });
              finalLogoUrl = await uploadFileToFirebaseStorage(file, `tenants/${tenantId}/branding/logo.png`);
          } catch (error) {
              console.error("Logo upload failed", error);
              addToast('Failed to upload logo image', 'error');
              setIsSaving(false);
              return;
          }
      }

      const updatedBranding = { ...profile.branding, logoUrl: finalLogoUrl };

      const dataToSave: Partial<Tenant> = {
          id: tenantId,
          name: profile.name,
          type: profile.type,
          regNumber: profile.regNumber,
          taxNumber: profile.taxNumber,
          address: profile.address,
          contactNumber: profile.contactNumber,
          email: profile.email,
          website: profile.website,
          category: profile.category,
          isActive: profile.isActive,
          target: profile.target,
          
          branding: updatedBranding as BrandingSettings,
          access: profile.access,
          emailConfig: profile.emailConfig,
          notifications: profile.notifications,
          posSettings: profile.posSettings,
          cycleSettings: profile.cycleSettings,
          dataSettings: profile.dataSettings,
          securitySettings: profile.securitySettings,
      };

      const success = await updateBusinessProfile(tenantId, dataToSave);
      setIsSaving(false);
      
      if (success) {
          // Update local state to reflect the new URL instead of base64
          setProfile(prev => ({ ...prev, branding: updatedBranding as BrandingSettings }));
          
          // Update global context immediately so logo/colors update in Layout
          setTenantBranding(updatedBranding as BrandingSettings);
          
          addToast('Settings saved successfully', 'success');
      } else {
          addToast('Failed to save settings', 'error');
      }
  };

  const handleLogoUpload = async (file: File) => {
      try {
          // Temporarily set as base64 for preview
          const base64 = await fileToBase64(file);
          setProfile(prev => ({ 
            ...prev, 
            branding: {
                ...prev.branding!,
                logoUrl: base64 
            }
          }));
      } catch (e) {
          addToast('Logo preview failed', 'error');
      }
  };

  const handleUpdatePlan = async (plan: BillingPlan) => {
      if (!billing) return;
      
      // Simulate API call to Stripe
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock network delay
      
      const updatedBilling: TenantBilling = {
          ...billing,
          planId: plan.id,
          status: 'active',
          currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
      };
      
      await updateTenantBilling(updatedBilling);
      setBilling(updatedBilling);
      setIsSaving(false);
      addToast(`Switched to ${plan.name} Plan`, 'success');
  };

  const handlePortalRedirect = () => {
      addToast('Redirecting to secure billing portal...', 'info');
      // In production: window.location.href = billingPortalUrl;
  };

  // --- Sub-Components ---

  const ProfileTab = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Business Identity</h4>
                  <div className="flex flex-col items-center mb-6">
                      <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                          {profile.branding?.logoUrl ? (
                              <img src={profile.branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                          ) : (
                              <Building2 size={32} className="text-slate-300" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold">Change</span>
                          </div>
                          <div className="absolute inset-0 opacity-0 cursor-pointer">
                              <FileUploader onFileSelect={handleLogoUpload} label="" previewUrl={profile.branding?.logoUrl} />
                          </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Max 2MB (PNG/JPG)</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Display Name</label>
                          <input 
                            type="text" 
                            className="input-field mt-1" 
                            value={profile.branding?.displayName || ''} 
                            onChange={e => setProfile(prev => ({...prev, branding: {...prev.branding!, displayName: e.target.value}}))}
                          />
                      </div>
                      <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Slogan</label>
                          <input 
                            type="text" 
                            className="input-field mt-1" 
                            value={profile.branding?.slogan || ''} 
                            onChange={e => setProfile(prev => ({...prev, branding: {...prev.branding!, slogan: e.target.value}}))}
                          />
                      </div>
                      <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Brand Color</label>
                          <div className="flex gap-2 mt-2">
                              {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                                  <button 
                                    key={c}
                                    onClick={() => setProfile(prev => ({...prev, branding: {...prev.branding!, primaryColor: c}}))}
                                    className={`w-8 h-8 rounded-full border-2 ${profile.branding?.primaryColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                  />
                              ))}
                              <input type="color" value={profile.branding?.primaryColor || '#6366f1'} onChange={e => setProfile(prev => ({...prev, branding: {...prev.branding!, primaryColor: e.target.value}}))} className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer" />
                          </div>
                      </div>
                  </div>
              </Card>

              <Card className="lg:col-span-2">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-6">Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Entity Name (Registered)</label>
                          <input type="text" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className="input-field" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Type</label>
                          <select value={profile.type} onChange={e => setProfile({...profile, type: e.target.value as any})} className="input-field">
                              <option value={TenantType.BUSINESS}>Retail Business</option>
                              <option value={TenantType.STOKVEL}>Stokvel Group</option>
                              <option value={TenantType.LENDING}>Lending Institution</option>
                          </select>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Registration Number</label>
                          <input type="text" value={profile.regNumber || ''} onChange={e => setProfile({...profile, regNumber: e.target.value})} className="input-field" placeholder="e.g. 2024/123456/07" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Tax / VAT Number</label>
                          <input type="text" value={profile.taxNumber || ''} onChange={e => setProfile({...profile, taxNumber: e.target.value})} className="input-field" placeholder="Optional" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Physical Address</label>
                          <input type="text" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} className="input-field" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Contact Number</label>
                          <input type="tel" value={profile.contactNumber || ''} onChange={e => setProfile({...profile, contactNumber: e.target.value})} className="input-field" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Support Email</label>
                          <input type="email" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className="input-field" />
                      </div>
                  </div>
              </Card>
          </div>
      </div>
  );

  const GlobalTab = () => {
      if (!globalSettingsData) return <div className="p-8 text-center text-slate-400">Loading platform info...</div>;

      return (
          <div className="space-y-6 animate-fade-in">
              <Card>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Globe size={20} className="text-indigo-500" /> Platform Environment
                  </h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                          This business unit operates under the <strong>{globalSettingsData.erpName}</strong> platform umbrella. 
                          These settings are controlled at the organization level by Super Admins.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Name</label>
                          <div className="font-medium text-slate-900 dark:text-white text-lg">
                              {globalSettingsData.erpName}
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Support Contact</label>
                          <div className="font-medium text-slate-900 dark:text-white text-lg flex items-center gap-2">
                              <Mail size={16} className="text-slate-4