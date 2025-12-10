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
    updateTenantBilling
} from '../services/firestore';
import { Tenant, User, UserRole, TenantType, BrandingSettings, BillingPlan, TenantBilling, Invoice } from '../types';
import { fileToBase64 } from '../lib/utils';
import { 
  Building2, Users, Mail, Bell, RefreshCw, ShoppingCart, Database, Shield,
  Save, Edit2, Plus, Trash2, CheckCircle2, AlertTriangle, Send, Lock, CreditCard, Download, ExternalLink
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
  const { addToast, setTenantBranding } = useUI();

  // Master State
  const [profile, setProfile] = useState<Partial<Tenant>>(DEFAULT_PROFILE);
  const [admins, setAdmins] = useState<User[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [billing, setBilling] = useState<TenantBilling | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
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

  const AdminsTab = () => {
      const [showInvite, setShowInvite] = useState(false);
      const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: UserRole.BRANCH_MANAGER });

      const handleInvite = async () => {
          const newUser: User = {
              id: `u_${Date.now()}`,
              tenantId: tenantId,
              name: newAdmin.name,
              email: newAdmin.email,
              role: newAdmin.role,
              avatarUrl: `https://ui-avatars.com/api/?name=${newAdmin.name}&background=random`
          };
          await addBusinessAdmin(newUser);
          setAdmins([...admins, newUser]);
          setShowInvite(false);
          addToast('Invitation sent', 'success');
      };

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Management</h3>
                  <Button onClick={() => setShowInvite(true)}><Plus size={16} className="mr-2"/> Invite Admin</Button>
              </div>

              <Card noPadding>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {admins.map(admin => (
                              <tr key={admin.id}>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <img src={admin.avatarUrl} className="w-8 h-8 rounded-full" />
                                          <div>
                                              <p className="font-bold text-slate-900 dark:text-white">{admin.name}</p>
                                              <p className="text-xs text-slate-500">{admin.email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-bold">
                                          {admin.role.replace('_', ' ')}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-emerald-600 font-medium text-xs">Active</td>
                                  <td className="px-6 py-4 text-right">
                                      <button className="text-slate-400 hover:text-slate-600"><Edit2 size={16}/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </Card>

              <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite New Administrator" size="sm">
                  <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium">Full Name</label>
                          <input type="text" className="input-field" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium">Email Address</label>
                          <input type="email" className="input-field" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium">Role</label>
                          <select className="input-field" value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value as UserRole})}>
                              <option value={UserRole.TENANT_ADMIN}>Admin (Full Access)</option>
                              <option value={UserRole.BRANCH_MANAGER}>Manager</option>
                              <option value={UserRole.CASHIER}>Cashier</option>
                          </select>
                      </div>
                      <Button className="w-full mt-4" onClick={handleInvite}>Send Invitation</Button>
                  </div>
              </Modal>
          </div>
      );
  };

  const BillingTab = () => {
      const currentPlan = plans.find(p => p.id === billing?.planId);

      return (
          <div className="space-y-8 animate-fade-in">
              {/* Current Plan & Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide">Current Plan</p>
                                  <h3 className="text-3xl font-black mt-1">{currentPlan?.name || 'Free Tier'}</h3>
                              </div>
                              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                                  {billing?.status.toUpperCase() || 'ACTIVE'}
                              </span>
                          </div>
                          
                          <div className="space-y-2 mb-6">
                              <p className="text-sm text-indigo-100">
                                  Renews on {new Date(billing?.currentPeriodEnd || Date.now()).toLocaleDateString()}
                              </p>
                              <p className="text-2xl font-bold">
                                  {currentPlan?.currency} {currentPlan?.price} <span className="text-sm font-normal text-indigo-200">/ {currentPlan?.interval}</span>
                              </p>
                          </div>

                          <div className="flex gap-3">
                              <Button onClick={handlePortalRedirect} className="bg-white text-indigo-600 hover:bg-indigo-50 border-none">
                                  Manage Subscription
                              </Button>
                          </div>
                      </div>
                  </Card>

                  <Card>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-6">Payment Method</h4>
                      <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-8 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                              <CreditCard size={20} className="text-slate-500" />
                          </div>
                          <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                                  {billing?.paymentMethod?.brand || 'Visa'} •••• {billing?.paymentMethod?.last4 || '4242'}
                              </p>
                              <p className="text-xs text-slate-500">
                                  Expires {billing?.paymentMethod?.expMonth || 12}/{billing?.paymentMethod?.expYear || 2026}
                              </p>
                          </div>
                      </div>
                      <Button variant="outline" className="w-full" onClick={handlePortalRedirect}>
                          Update Payment Method <ExternalLink size={14} className="ml-2"/>
                      </Button>
                  </Card>
              </div>

              {/* Available Plans */}
              <div>
                  <h4 className="font-bold text-xl text-slate-900 dark:text-white mb-6">Available Plans</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {plans.map(plan => {
                          const isCurrent = plan.id === billing?.planId;
                          return (
                              <div key={plan.id} className={`relative p-6 rounded-2xl border-2 transition-all ${isCurrent ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}>
                                  {isCurrent && (
                                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                                          CURRENT
                                      </div>
                                  )}
                                  <h5 className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</h5>
                                  <p className="text-sm text-slate-500 mb-4 h-10">{plan.description}</p>
                                  <div className="mb-6">
                                      <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.currency} {plan.price}</span>
                                      <span className="text-sm text-slate-400">/{plan.interval}</span>
                                  </div>
                                  <ul className="space-y-2 mb-6">
                                      {plan.features.map((f, i) => (
                                          <li key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                              <CheckCircle2 size={14} className="text-indigo-500 shrink-0" /> {f}
                                          </li>
                                      ))}
                                  </ul>
                                  <Button 
                                      className={`w-full ${isCurrent ? 'bg-slate-200 text-slate-500 cursor-default' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}
                                      disabled={isCurrent}
                                      onClick={() => handleUpdatePlan(plan)}
                                      isLoading={isSaving && !isCurrent} // Prevent loading state on current button
                                  >
                                      {isCurrent ? 'Current Plan' : (plan.price > (currentPlan?.price || 0) ? 'Upgrade' : 'Downgrade')}
                                  </Button>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Invoices */}
              <Card>
                  <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">Billing History</h4>
                      <Button variant="ghost" size="sm" onClick={handlePortalRedirect}>View All</Button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
                              <tr>
                                  <th className="px-6 py-3 rounded-l-lg">Date</th>
                                  <th className="px-6 py-3">Amount</th>
                                  <th className="px-6 py-3">Plan</th>
                                  <th className="px-6 py-3">Status</th>
                                  <th className="px-6 py-3 rounded-r-lg text-right">Invoice</th>
                              </tr>
                          </thead>
                          <tbody>
                              {invoices.map(inv => (
                                  <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                      <td className="px-6 py-4 font-medium">{new Date(inv.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">{inv.currency} {inv.amount.toFixed(2)}</td>
                                      <td className="px-6 py-4 text-slate-500">{inv.planName}</td>
                                      <td className="px-6 py-4">
                                          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                                              {inv.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <a href={inv.pdfUrl} className="text-indigo-600 hover:text-indigo-700 flex items-center justify-end gap-1 text-xs font-bold">
                                              <Download size={14} /> PDF
                                          </a>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      );
  };

  const EmailTab = () => (
      <div className="space-y-6 animate-fade-in">
          <Card>
              <h4 className="font-bold mb-4">SMTP Configuration</h4>
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">SMTP Host</label>
                      <input type="text" className="input-field" placeholder="smtp.gmail.com" value={profile.emailConfig?.smtpHost || ''} onChange={e => setProfile({...profile, emailConfig: {...profile.emailConfig!, smtpHost: e.target.value}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Port</label>
                      <input type="number" className="input-field" placeholder="587" value={profile.emailConfig?.smtpPort || ''} onChange={e => setProfile({...profile, emailConfig: {...profile.emailConfig!, smtpPort: Number(e.target.value)}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Sender Email</label>
                      <input type="email" className="input-field" placeholder="no-reply@company.com" value={profile.emailConfig?.senderEmail || ''} onChange={e => setProfile({...profile, emailConfig: {...profile.emailConfig!, senderEmail: e.target.value}})} />
                  </div>
              </div>
          </Card>

          <Card>
              <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Email Templates</h4>
                  <Button size="sm" variant="outline"><Plus size={14} className="mr-1"/> Add Template</Button>
              </div>
              <div className="space-y-2">
                  {['Invoice', 'Receipt', 'Welcome Email', 'Payment Reminder'].map(tpl => (
                      <div key={tpl} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                          <span className="font-medium text-sm">{tpl}</span>
                          <button className="text-indigo-600 text-xs font-bold hover:underline">Edit</button>
                      </div>
                  ))}
              </div>
          </Card>
      </div>
  );

  const NotificationsTab = () => (
      <div className="space-y-6 animate-fade-in">
          <Card>
              <h4 className="font-bold mb-6">Alert Preferences</h4>
              <div className="space-y-4">
                  {[
                      { key: 'emailNewSale', label: 'Email me on every new sale' },
                      { key: 'dailySummary', label: 'Send daily sales summary report' },
                      { key: 'lowStock', label: 'Alert when stock is low' },
                      { key: 'creditWarning', label: 'Warn when customer exceeds credit limit' }
                  ].map(item => (
                      <div key={item.key} className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                          <div 
                              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${profile.notifications?.[item.key as keyof typeof profile.notifications] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                              onClick={() => setProfile({
                                  ...profile, 
                                  notifications: { 
                                      ...profile.notifications!, 
                                      [item.key]: !profile.notifications?.[item.key as keyof typeof profile.notifications] 
                                  }
                              })}
                          >
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${profile.notifications?.[item.key as keyof typeof profile.notifications] ? 'translate-x-6' : 'translate-x-0'}`} />
                          </div>
                      </div>
                  ))}
              </div>
          </Card>
      </div>
  );

  const CycleTab = () => (
      <div className="space-y-6 animate-fade-in">
          <Card>
              <h4 className="font-bold mb-4">
                  {profile.type === TenantType.STOKVEL ? 'Contribution Cycle Configuration' : 'Business Cycle Configuration'}
              </h4>
              <p className="text-sm text-slate-500 mb-6">Define your fiscal or contribution month for reporting. Default is 5th to 4th.</p>
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Cycle Start Day</label>
                      <input type="number" className="input-field" value={profile.cycleSettings?.startDay || 5} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, startDay: Number(e.target.value)}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Cycle End Day</label>
                      <input type="number" className="input-field" value={profile.cycleSettings?.endDay || 4} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, endDay: Number(e.target.value)}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Currency Symbol</label>
                      <input type="text" className="input-field" value={profile.cycleSettings?.currencySymbol || 'R'} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, currencySymbol: e.target.value}})} />
                  </div>
              </div>
          </Card>
      </div>
  );

  const POSTab = () => (
      <div className="space-y-6 animate-fade-in">
          <Card>
              <h4 className="font-bold mb-4">Point of Sale Defaults</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Tax Rate (%)</label>
                      <input type="number" className="input-field" value={profile.posSettings?.taxRate || 0} onChange={e => setProfile({...profile, posSettings: {...profile.posSettings!, taxRate: Number(e.target.value)}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Receipt Footer Text</label>
                      <input type="text" className="input-field" value={profile.posSettings?.receiptFooter || ''} onChange={e => setProfile({...profile, posSettings: {...profile.posSettings!, receiptFooter: e.target.value}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Currency Symbol</label>
                      <input type="text" className="input-field" value={profile.posSettings?.currencySymbol || 'R'} onChange={e => setProfile({...profile, posSettings: {...profile.posSettings!, currencySymbol: e.target.value}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Number Format</label>
                      <select className="input-field" value={profile.posSettings?.numberFormat || 'R_COMMA_DECIMAL'} onChange={e => setProfile({...profile, posSettings: {...profile.posSettings!, numberFormat: e.target.value as any}})}>
                          <option value="R_COMMA_DECIMAL">R 1,234.56</option>
                          <option value="COMMA_DECIMAL_R">1,234.56 R</option>
                      </select>
                  </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h5 className="font-bold text-sm mb-4">Payment Methods</h5>
                  <div className="flex gap-4">
                      {['Cash', 'Card', 'Credit', 'Mobile Money'].map(m => (
                          <label key={m} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" defaultChecked /> {m}
                          </label>
                      ))}
                  </div>
              </div>
          </Card>
      </div>
  );

  const DataTab = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <Database size={48} className="mx-auto text-indigo-500 mb-4 opacity-50"/>
              <h3 className="font-bold text-lg mb-2">Export Business Data</h3>
              <p className="text-sm text-slate-500 mb-6">Download a full backup of sales, customers, and inventory.</p>
              <Button variant="outline" className="bg-white dark:bg-slate-800"><CheckCircle2 size={16} className="mr-2"/> Export CSV Backup</Button>
          </div>
          <div className="p-6 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-2xl">
              <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Danger Zone</h4>
              <p className="text-sm text-red-600 dark:text-red-300 mb-4">Deleting business data is irreversible.</p>
              <Button variant="danger" size="sm">Delete All Data</Button>
          </div>
      </div>
  );

  const SecurityTab = () => (
      <div className="space-y-6 animate-fade-in">
          <Card>
              <div className="flex items-center justify-between">
                  <div>
                      <h4 className="font-bold">Two-Factor Authentication</h4>
                      <p className="text-sm text-slate-500">Require OTP for all admin logins.</p>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full p-1 cursor-pointer"><div className="w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
              </div>
          </Card>
          <Card>
              <h4 className="font-bold mb-4">Audit Logs</h4>
              <div className="text-sm text-slate-500 space-y-2">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span>Admin Login (User ID: u_001)</span>
                      <span>2 mins ago</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span>Settings Updated</span>
                      <span>1 hour ago</span>
                  </div>
              </div>
          </Card>
      </div>
  );

  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading Settings...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen gap-8 pb-20 animate-fade-in">
        {/* Settings Nav */}
        <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-6">
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
                <Button onClick={handleSave} isLoading={isSaving} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <Save size={18} className="mr-2"/> Save Changes
                </Button>
            </div>

            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'admins' && <AdminsTab />}
            {activeTab === 'billing' && <BillingTab />}
            {activeTab === 'email' && <EmailTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'cycle' && <CycleTab />}
            {activeTab === 'pos' && <POSTab />}
            {activeTab === 'data' && <DataTab />}
            {activeTab === 'security' && <SecurityTab />}
        </div>
    </div>
  );
};