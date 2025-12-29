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
    // Fix: Removed missing export 'addBusinessAdmin'
    uploadFileToFirebaseStorage,
    getBillingPlans,
    getTenantBilling,
    getInvoices,
    updateTenantBilling,
    getGlobalSettings,
    deleteTenant
} from '../services/firestore';
import { Tenant, User, UserRole, TenantType, BrandingSettings, BillingPlan, TenantBilling, Invoice, GlobalSettings } from '../types';
import { fileToBase64 } from '../lib/utils';
import { 
  Building2, Users, Mail, Bell, RefreshCw, ShoppingCart, Database, Shield,
  Save, Edit2, Plus, Trash2, CheckCircle2, AlertTriangle, Send, Lock, CreditCard, Download, ExternalLink, Globe
} from 'lucide-react';

interface BusinessSettingsProps {
  tenantId: string;
  onDelete?: () => void; // Optional callback after successful deletion
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

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ tenantId, onDelete }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      let finalLogoUrl = typeof profile.branding?.logoUrl === 'string' ? profile.branding.logoUrl : '';
      
      // Ensure we don't try to upload if it's not a data URL (already a remote URL)
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

      // Explicitly construct Branding Settings using primitives to avoid circular references
      const updatedBranding: BrandingSettings = {
          displayName: String(profile.branding?.displayName || profile.name || 'Business'),
          primaryColor: String(profile.branding?.primaryColor || '#6366f1'),
          secondaryColor: String(profile.branding?.secondaryColor || '#0ea5e9'),
          slogan: String(profile.branding?.slogan || ''),
          logoUrl: String(finalLogoUrl || '')
      };

      // Manually construct the payload to strip out potential circular references
      const dataToSave: Partial<Tenant> = {
          id: tenantId,
          name: String(profile.name || ''),
          type: profile.type || TenantType.BUSINESS,
          regNumber: String(profile.regNumber || ''),
          taxNumber: String(profile.taxNumber || ''),
          address: String(profile.address || ''),
          contactNumber: String(profile.contactNumber || ''),
          email: String(profile.email || ''),
          website: String(profile.website || ''),
          category: String(profile.category || ''),
          isActive: !!profile.isActive,
          target: Number(profile.target) || 0,
          
          branding: updatedBranding,
          
          // Deep Copy / Manual Construction of other nested objects
          access: {
              subscriptionTier: profile.access?.subscriptionTier || 'BASIC'
          },
          emailConfig: {
              senderEmail: String(profile.emailConfig?.senderEmail || ''),
              templates: Array.isArray(profile.emailConfig?.templates) ? [...profile.emailConfig!.templates] : []
          },
          notifications: {
              emailNewSale: !!profile.notifications?.emailNewSale,
              smsPayment: !!profile.notifications?.smsPayment,
              dailySummary: !!profile.notifications?.dailySummary,
              lowStock: !!profile.notifications?.lowStock,
              creditWarning: !!profile.notifications?.creditWarning,
              autoMonthlyReport: !!profile.notifications?.autoMonthlyReport,
              recipients: Array.isArray(profile.notifications?.recipients) ? [...profile.notifications!.recipients] : []
          },
          posSettings: {
              receiptFooter: String(profile.posSettings?.receiptFooter || ''),
              taxRate: Number(profile.posSettings?.taxRate) || 0,
              enableCash: !!profile.posSettings?.enableCash,
              enableCard: !!profile.posSettings?.enableCard,
              enableCredit: !!profile.posSettings?.enableCredit,
              autoPrint: !!profile.posSettings?.autoPrint,
              currencySymbol: String(profile.posSettings?.currencySymbol || 'R'),
              numberFormat: profile.posSettings?.numberFormat || 'R_COMMA_DECIMAL'
          },
          cycleSettings: {
              startDay: Number(profile.cycleSettings?.startDay) || 1,
              endDay: Number(profile.cycleSettings?.endDay) || 30,
              fiscalStartMonth: Number(profile.cycleSettings?.fiscalStartMonth) || 1,
              currencySymbol: String(profile.cycleSettings?.currencySymbol || 'R')
          },
          // Only include these if they exist and are objects
          dataSettings: profile.dataSettings ? { ...profile.dataSettings } : undefined,
          securitySettings: profile.securitySettings ? { ...profile.securitySettings } : undefined,
      };

      const success = await updateBusinessProfile(tenantId, dataToSave);
      setIsSaving(false);
      
      if (success) {
          setProfile(prev => ({ ...prev, branding: updatedBranding }));
          setTenantBranding(updatedBranding);
          addToast('Settings saved successfully', 'success');
      } else {
          addToast('Failed to save settings', 'error');
      }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteTenant(tenantId);
        addToast('Entity deleted successfully', 'success');
        setShowDeleteModal(false);
        if (onDelete) {
            onDelete();
        } else {
            // Fallback: force return to previous valid state if no callback
            window.location.reload();
        }
    } catch (e) {
        console.error("Delete failed", e);
        addToast('Failed to delete entity', 'error');
    } finally {
        setIsDeleting(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
      try {
          const base64 = await fileToBase64(file);
          if (typeof base64 === 'string') {
              setProfile(prev => ({ 
                ...prev, 
                branding: {
                    ...(prev.branding || DEFAULT_PROFILE.branding!),
                    logoUrl: base64 
                }
              }));
          }
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
                              <FileUploader 
                                onFileSelect={handleLogoUpload} 
                                label="" 
                                previewUrl={profile.branding?.logoUrl} 
                                accept="image/png, image/jpeg, image/svg+xml"
                              />
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
                            onChange={e => setProfile(prev => ({...prev, branding: {...(prev.branding || DEFAULT_PROFILE.branding!), displayName: e.target.value}}))}
                          />
                      </div>
                      <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Slogan</label>
                          <input 
                            type="text" 
                            className="input-field mt-1" 
                            value={profile.branding?.slogan || ''} 
                            onChange={e => setProfile(prev => ({...prev, branding: {...(prev.branding || DEFAULT_PROFILE.branding!), slogan: e.target.value}}))}
                          />
                      </div>
                      <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Brand Color</label>
                          <div className="flex gap-2 mt-2">
                              {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                                  <button 
                                    key={c}
                                    onClick={() => setProfile(prev => ({...prev, branding: {...(prev.branding || DEFAULT_PROFILE.branding!), primaryColor: c}}))}
                                    className={`w-8 h-8 rounded-full border-2 ${profile.branding?.primaryColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                  />
                              ))}
                              <input type="color" value={profile.branding?.primaryColor || '#6366f1'} onChange={e => setProfile(prev => ({...prev, branding: {...(prev.branding || DEFAULT_PROFILE.branding!), primaryColor: e.target.value}}))} className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer" />
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
                              {/* Fix: Using string 'LENDING' for compatibility with legacy data as TenantType.LENDING does not exist in the enum */}
                              <option value={'LENDING'}>Lending Institution</option>
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

          {/* Danger Zone */}
          <Card className="border-2 border-red-500/20 bg-red-50/30 dark:bg-red-900/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                          <AlertTriangle size={18}/> Danger Zone
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                          Permanently delete this {profile.type === TenantType.STOKVEL ? 'Stokvel group' : 'Business entity'} and all associated data.
                      </p>
                  </div>
                  <Button 
                    variant="danger" 
                    onClick={() => setShowDeleteModal(true)}
                    className="shadow-red-500/20"
                  >
                      <Trash2 size={16} className="mr-2" /> 
                      Delete {profile.type === TenantType.STOKVEL ? 'Stokvel' : 'Business'}
                  </Button>
              </div>
          </Card>
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
                              <Mail size={16} className="text-slate-400" />
                              {globalSettingsData.supportEmail}
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Domain</label>
                          <div className="font-medium text-slate-900 dark:text-white text-lg flex items-center gap-2">
                              <Globe size={16} className="text-slate-400" />
                              {globalSettingsData.platformDomain}
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      );
  };

  const CycleTab = () => (
      <div className="space-y-6 animate-fade-in">
          <Card>
              <h4 className="font-bold text-slate-900 dark:text-white mb-6">Financial Cycle Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Cycle Start Day</label>
                      <input type="number" min="1" max="31" value={profile.cycleSettings?.startDay} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, startDay: parseInt(e.target.value)}})} className="input-field" />
                      <p className="text-xs text-slate-400">Day of month when financial period begins.</p>
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Cycle End Day</label>
                      <input type="number" min="1" max="31" value={profile.cycleSettings?.endDay} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, endDay: parseInt(e.target.value)}})} className="input-field" />
                      <p className="text-xs text-slate-400">Day of month when financial period ends.</p>
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Fiscal Start Month</label>
                      <select value={profile.cycleSettings?.fiscalStartMonth} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, fiscalStartMonth: parseInt(e.target.value)}})} className="input-field">
                          {Array.from({length: 12}, (_, i) => (
                              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                          ))}
                      </select>
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Currency Symbol</label>
                      <input type="text" value={profile.cycleSettings?.currencySymbol || 'R'} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, currencySymbol: e.target.value}})} className="input-field" placeholder="e.g. R, $, £" />
                  </div>
              </div>
          </Card>
      </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen gap-8 pb-20 animate-fade-in">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-24">
                <h2 className="text-2xl font-bold mb-6 px-2 text-slate-900 dark:text-white">Settings</h2>
                <div className="space-y-1">
                    {settingsTabs.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === item.id 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <item.icon size={18} /> {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-4xl">
            <style>{`
                .input-field {
                    @apply w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium;
                }
            `}</style>

            <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold capitalize text-slate-800 dark:text-white">{activeTab.replace(/([A-Z])/g, ' $1').trim()}</h3>
                <Button onClick={handleSave} isLoading={isSaving} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg">
                    <Save size={18} className="mr-2"/> Save Changes
                </Button>
            </div>

            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'global' && <GlobalTab />}
            {activeTab === 'cycle' && <CycleTab />}
            
            {/* Placeholder for other tabs */}
            {['admins', 'email', 'notifications', 'pos', 'data', 'security'].includes(activeTab) && (
                <Card className="text-center py-12">
                    <div className="mb-4 text-slate-300 dark:text-slate-600">
                        <Database size={48} className="mx-auto"/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Section Under Development</h3>
                    <p className="text-slate-500">This settings module is coming soon.</p>
                </Card>
            )}

            {activeTab === 'billing' && (
                <div className="space-y-6 animate-fade-in">
                    <Card>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">Current Subscription</h4>
                                <p className="text-sm text-slate-500">Manage your plan and billing details.</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${billing?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {billing?.status || 'Inactive'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                                <CreditCard size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 dark:text-white">{plans.find(p => p.id === billing?.planId)?.name || 'Unknown Plan'}</p>
                                <p className="text-xs text-slate-500">
                                    Next billing date: {billing?.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handlePortalRedirect}>Manage Billing</Button>
                        </div>

                        <h5 className="font-bold text-slate-900 dark:text-white mb-4">Available Plans</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map(plan => {
                                const isCurrent = billing?.planId === plan.id;
                                return (
                                    <div key={plan.id} className={`p-4 rounded-xl border-2 transition-all ${isCurrent ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-slate-900 dark:text-white">{plan.name}</span>
                                            {isCurrent && <CheckCircle2 size={16} className="text-indigo-600"/>}
                                        </div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                                            {plan.currency} {plan.price}<span className="text-xs font-normal text-slate-400">/{plan.interval}</span>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant={isCurrent ? 'outline' : 'primary'} 
                                            className="w-full"
                                            onClick={() => !isCurrent && handleUpdatePlan(plan)}
                                            disabled={isCurrent}
                                        >
                                            {isCurrent ? 'Current Plan' : 'Switch Plan'}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    <Card>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Invoice History</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(inv.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-bold">{inv.currency} {inv.amount}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{inv.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="text-indigo-600 hover:text-indigo-700 font-medium text-xs flex items-center justify-end gap-1 ml-auto">
                                                    <Download size={12}/> PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal 
            isOpen={showDeleteModal} 
            onClose={() => setShowDeleteModal(false)} 
            title={`Delete ${profile.type === TenantType.STOKVEL ? 'Stokvel Group' : 'Business Entity'}`}
            size="sm"
        >
            <div className="space-y-4 pt-2">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 flex items-start gap-3">
                    <AlertTriangle className="shrink-0 mt-0.5" size={20}/>
                    <div className="text-sm">
                        <p className="font-bold">Extreme Caution Required</p>
                        <p className="mt-1">This action is irreversible. All transactions, members, and data associated with <strong>{profile.name}</strong> will be permanently purged.</p>
                    </div>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Are you absolutely sure you want to proceed?
                </p>

                <div className="pt-4 flex flex-col gap-2">
                    <Button 
                        variant="danger" 
                        className="w-full h-12 font-bold" 
                        onClick={handleDelete}
                        isLoading={isDeleting}
                    >
                        Yes, Delete Permanently
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => setShowDeleteModal(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};