import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileUploader } from '../components/ui/FileUploader';
import { useUI } from '../context/UIContext';
import { 
  getGlobalSettings, updateGlobalSettings, uploadFileToFirebaseStorage, 
  getTenants, INITIAL_GLOBAL_SETTINGS, getUsers, addBusinessAdmin, 
  updateUser, deleteUser, updateTenant, logAudit, getBillingPlans, saveBillingPlan,
  updateSystemBranding, triggerSystemEmail
} from '../services/firestore';
import { GlobalSettings as GlobalSettingsType, Tenant, User, UserRole, BillingPlan, BillingInterval } from '../types';
import { fileToBase64 } from '../lib/utils';
import { checkDBConnection } from '../lib/db';
import { 
  Building2, Save, CheckCircle2, AlertCircle, Upload, Plus, Edit2,
  Settings as SettingsIcon, LayoutDashboard, DollarSign, Users as UsersIcon, Mail, ShieldAlert,
  Database, Server, Key, ToggleLeft, ToggleRight, Eye, Trash2, Lock, UserPlus, Power, Check, CreditCard
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';


export const GlobalSettings: React.FC = () => {
  const { addToast, globalSettings, setGlobalSettings, currentUser } = useUI();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<GlobalSettingsType>(INITIAL_GLOBAL_SETTINGS);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'tenants' | 'users' | 'system' | 'billing' | 'support'>('general');
  const [dbStatus, setDbStatus] = useState<{ok: boolean, latency?: number, message?: string}>({ok: false});

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({});

  // Billing Plan State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planFormData, setPlanFormData] = useState<Partial<BillingPlan>>({});

  useEffect(() => {
    const loadData = async () => {
      // Access Control Check inside loading logic
      if (currentUser?.role !== UserRole.SUPER_ADMIN) {
          setIsLoading(false);
          return;
      }

      setIsLoading(true);
      try {
        const fetchedGlobalSettings = await getGlobalSettings();
        setFormData(fetchedGlobalSettings); // Set local state for form editing
        setGlobalSettings(fetchedGlobalSettings); // Sync context just in case

        const allTenants = await getTenants();
        setTenants(allTenants.filter(t => t.id !== 'global')); // Exclude the global "INALA HOLDINGS" itself
        
        const allUsers = await getUsers();
        setUsers(allUsers);

        const allPlans = await getBillingPlans();
        setPlans(allPlans);

        // Check DB Connection
        const status = await checkDBConnection();
        setDbStatus(status);

      } catch (e) {
        console.error("Failed to load global settings or tenants", e);
        addToast("Error loading global settings", "error");
        setFormData(globalSettings); // Fallback to context
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser?.role]); // Re-run if role changes, though unlikely on this page

  const handleSave = async () => {
    setIsSaving(true);
    let updatedLogoUrl = formData.erpLogoUrl;

    // Handle logo upload to Firebase Storage if it's a base64 string (newly uploaded)
    if (updatedLogoUrl && updatedLogoUrl.startsWith('data:image')) {
        try {
            const fileBlob = await fetch(updatedLogoUrl).then(res => res.blob());
            const file = new File([fileBlob], `systemLogo.png`, { type: fileBlob.type });
            // Upload to branding/systemLogo.png as requested
            const downloadURL = await uploadFileToFirebaseStorage(file, `branding/systemLogo.png`);
            updatedLogoUrl = downloadURL;
            
            // Save to system_settings/branding doc as requested
            await updateSystemBranding({ logoUrl: downloadURL });
            
            addToast('System logo uploaded successfully', 'success');
        } catch (uploadError) {
            console.error("Failed to upload ERP logo:", uploadError);
            addToast('Failed to upload ERP logo', 'error');
            setIsSaving(false);
            return;
        }
    }

    const updatedSettings = { ...formData, erpLogoUrl: updatedLogoUrl };
    const success = await updateGlobalSettings(updatedSettings);
    setIsSaving(false);
    if (success) {
      setGlobalSettings(updatedSettings as GlobalSettingsType); // Update UIContext immediately
      setFormData(updatedSettings as GlobalSettingsType); // Update local state
      addToast('Global settings saved successfully', 'success');
    } else {
      addToast('Failed to save global settings', 'error');
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, erpLogoUrl: base64 }));
    } catch (e) {
      addToast('Logo preview failed', 'error');
    }
  };

  const handleClearLogo = () => {
    setFormData(prev => ({ ...prev, erpLogoUrl: '' })); // Clear from form data
  };

  // --- User Management Handlers ---
  const handleOpenUserModal = (user: User | null = null) => {
      setSelectedUser(user);
      setUserFormData(user ? { ...user } : { role: UserRole.MEMBER, isActive: true, tenantId: '' });
      setShowUserModal(true);
  };

  const handleSaveUser = async () => {
      if (!userFormData.email || !userFormData.name) {
          addToast('Please fill in required fields', 'error');
          return;
      }

      try {
          if (selectedUser) {
              await updateUser(selectedUser.id, userFormData);
              setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...userFormData } as User : u));
              addToast('User updated successfully', 'success');
              await logAudit({ action: 'UPDATE_USER', details: `Updated user ${userFormData.email}`, userId: currentUser?.id || 'system', tenantId: 'global' });
          } else {
              const newUser: User = {
                  id: `u_${Date.now()}`,
                  name: userFormData.name,
                  email: userFormData.email,
                  role: userFormData.role || UserRole.MEMBER,
                  tenantId: userFormData.tenantId || 'global',
                  isActive: true,
                  avatarUrl: `https://ui-avatars.com/api/?name=${userFormData.name}&background=random`,
                  createdAt: new Date().toISOString(),
                  ...userFormData
              } as User;
              await addBusinessAdmin(newUser);
              setUsers(prev => [...prev, newUser]);
              
              // Trigger Welcome Email
              await triggerSystemEmail('WELCOME_EMAIL', { email: newUser.email, name: newUser.name });
              
              addToast('User created successfully', 'success');
              await logAudit({ action: 'CREATE_USER', details: `Created user ${userFormData.email}`, userId: currentUser?.id || 'system', tenantId: 'global' });
          }
          setShowUserModal(false);
      } catch (e) {
          console.error(e);
          addToast('Failed to save user', 'error');
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if (confirm('Are you sure? This user will lose access immediately.')) {
          await deleteUser(userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
          addToast('User deleted', 'success');
          await logAudit({ action: 'DELETE_USER', details: `Deleted user ${userId}`, userId: currentUser?.id || 'system', tenantId: 'global' });
      }
  };

  const handleResendActivation = async (email: string, name: string) => {
      await triggerSystemEmail('ACTIVATION_EMAIL', { email, name });
      addToast(`Activation email sent to ${email}`, 'success');
  };

  const toggleTenantStatus = async (tenant: Tenant) => {
      const newStatus = !tenant.isActive;
      await updateTenant({ id: tenant.id, isActive: newStatus });
      setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, isActive: newStatus } : t));
      addToast(`Tenant ${newStatus ? 'activated' : 'deactivated'}`, 'success');
  };

  // --- Billing Plan Handlers ---
  const handleOpenPlanModal = (plan: BillingPlan | null = null) => {
      setPlanFormData(plan ? { ...plan } : { currency: 'ZAR', interval: BillingInterval.MONTHLY, isActive: true, features: [] });
      setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
      if (!planFormData.name || !planFormData.price) {
          addToast('Please fill in required fields', 'error');
          return;
      }
      
      const newPlan = { 
          ...planFormData, 
          id: planFormData.id || `plan_${Date.now()}` 
      } as BillingPlan;

      await saveBillingPlan(newPlan);
      
      setPlans(prev => {
          const exists = prev.find(p => p.id === newPlan.id);
          if (exists) return prev.map(p => p.id === newPlan.id ? newPlan : p);
          return [...prev, newPlan];
      });
      
      setShowPlanModal(false);
      addToast('Plan saved successfully', 'success');
  };

  // Access Control View
  if (currentUser?.role !== UserRole.SUPER_ADMIN) {
      return (
          <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
                  <ShieldAlert size={48} className="text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
              <p className="text-slate-500 max-w-md">
                  You do not have permission to view Global ERP Settings. This area is restricted to Super Administrators only.
              </p>
          </div>
      );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading global ERP settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen gap-8 pb-20 animate-fade-in">
        {/* Settings Nav */}
        <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-6">
                <h2 className="text-2xl font-bold mb-6 px-2 text-slate-900 dark:text-white">ERP Settings</h2>
                <div className="space-y-1">
                    {[
                        { id: 'general', icon: SettingsIcon, label: 'General' },
                        { id: 'system', icon: Server, label: 'System & DB' },
                        { id: 'tenants', icon: Building2, label: 'Tenant Management' },
                        { id: 'users', icon: UsersIcon, label: 'User Management' },
                        { id: 'billing', icon: DollarSign, label: 'Billing & Plans' },
                        { id: 'support', icon: Mail, label: 'Support & Contacts' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
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
                {(activeTab === 'general' || activeTab === 'system') && (
                    <Button onClick={handleSave} isLoading={isSaving} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg">
                        <Save size={18} className="mr-2"/> Save Changes
                    </Button>
                )}
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6 animate-fade-in">
                    <Card>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Platform Identity</h4>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                                {formData.erpLogoUrl ? (
                                    <img src={formData.erpLogoUrl} alt="ERP Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <Building2 size={32} className="text-slate-300" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">Change</span>
                                </div>
                                <div className="absolute inset-0 opacity-0 cursor-pointer">
                                    <FileUploader onFileSelect={handleLogoUpload} onClear={handleClearLogo} label="" previewUrl={formData.erpLogoUrl}/>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Max 2MB (PNG/JPG)</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">ERP Name</label>
                                <input type="text" value={formData.erpName || ''} onChange={e => setFormData({...formData, erpName: e.target.value})} className="input-field" placeholder="e.g. Inala Holdings ERP" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Platform Domain</label>
                                <input type="text" value={formData.platformDomain || ''} onChange={e => setFormData({...formData, platformDomain: e.target.value})} className="input-field" placeholder="e.g. erp.inala.holdings" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Primary Color</label>
                                <div className="flex gap-2 mt-1">
                                    {['#6366f1', '#0ea5e9', '#10b981', '#eab308', '#ef4444', '#0f172a'].map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setFormData(prev => ({...prev, primaryColor: c}))}
                                            className={`w-8 h-8 rounded-full border-2 ${formData.primaryColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        >
                                            {formData.primaryColor === c && <CheckCircle2 size={16} className="text-white mx-auto" />}
                                        </button>
                                    ))}
                                    <input type="color" value={formData.primaryColor || '#6366f1'} onChange={e => setFormData(prev => ({...prev, primaryColor: e.target.value}))} className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Secondary Color</label>
                                <div className="flex gap-2 mt-1">
                                    {['#0ea5e9', '#6366f1', '#f97316', '#a855f7', '#fbbf24', '#be185d'].map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setFormData(prev => ({...prev, secondaryColor: c}))}
                                            className={`w-8 h-8 rounded-full border-2 ${formData.secondaryColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        >
                                            {formData.secondaryColor === c && <CheckCircle2 size={16} className="text-white mx-auto" />}
                                        </button>
                                    ))}
                                    <input type="color" value={formData.secondaryColor || '#0ea5e9'} onChange={e => setFormData(prev => ({...prev, secondaryColor: e.target.value}))} className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Database Status Card */}
                    <Card>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Database size={20} className="text-indigo-500" /> Database Connection
                        </h4>
                        <div className={`p-4 rounded-xl border ${dbStatus.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${dbStatus.ok ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="font-bold text-sm">Google Cloud Firestore</span>
                                </div>
                                <span className="text-xs font-mono opacity-80">{dbStatus.ok ? 'Connected' : 'Disconnected'}</span>
                            </div>
                            <div className="mt-3 text-xs opacity-70 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block font-bold mb-1">Latency</span>
                                    {dbStatus.latency ? `${dbStatus.latency}ms` : 'N/A'}
                                </div>
                                <div>
                                    <span className="block font-bold mb-1">Project ID</span>
                                    inala-holdings
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Email / SMTP Settings */}
                    <Card>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Mail size={20} className="text-blue-500" /> Email & SMTP
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">Configure outgoing mail for system alerts.</p>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">System Email</label>
                                <input 
                                    type="email" 
                                    className="input-field" 
                                    placeholder="inala.holdingz@gmail.com" 
                                    value={formData.supportEmail || 'inala.holdingz@gmail.com'}
                                    onChange={e => setFormData({...formData, supportEmail: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">SendGrid API Key</label>
                                <input 
                                    type="password" 
                                    className="input-field" 
                                    placeholder="SG.xxxx..." 
                                    value={formData.apiKeys?.sendGrid || ''}
                                    onChange={e => setFormData({
                                        ...formData, 
                                        apiKeys: { ...formData.apiKeys, sendGrid: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* System Controls */}
                    <Card>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <SettingsIcon size={20} className="text-slate-500" /> System Controls
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">Maintenance Mode</p>
                                    <p className="text-xs text-slate-500">Disable access for non-admin users.</p>
                                </div>
                                <button 
                                    onClick={() => setFormData({
                                        ...formData, 
                                        system: { ...formData.system!, maintenanceMode: !formData.system?.maintenanceMode }
                                    })}
                                    className={`transition-colors ${formData.system?.maintenanceMode ? 'text-indigo-600' : 'text-slate-400'}`}
                                >
                                    {formData.system?.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">Allow Public Signups</p>
                                    <p className="text-xs text-slate-500">Let new tenants register themselves.</p>
                                </div>
                                <button 
                                    onClick={() => setFormData({
                                        ...formData, 
                                        system: { ...formData.system!, allowSignup: !formData.system?.allowSignup }
                                    })}
                                    className={`transition-colors ${formData.system?.allowSignup ? 'text-indigo-600' : 'text-slate-400'}`}
                                >
                                    {formData.system?.allowSignup ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Tenant Management */}
            {activeTab === 'tenants' && (
                <div className="space-y-6 animate-fade-in">
                    <Card noPadding className="overflow-hidden">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Registered Tenants</h4>
                            <p className="text-sm text-slate-500">Manage all business and stokvel entities in the ERP.</p>
                        </div>
                        <div className="p-4">
                            {tenants.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">No tenants registered yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {tenants.map(tenant => (
                                        <div key={tenant.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                                    {tenant.branding?.logoUrl && !tenant.branding.logoUrl.includes('ui-avatars') ? (
                                                        <img src={tenant.branding.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building2 size={18} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{tenant.branding?.displayName || tenant.name}</p>
                                                    <p className="text-xs text-slate-500">{tenant.type} • {tenant.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => toggleTenantStatus(tenant)}
                                                    className={`text-[10px] px-2 py-1 rounded font-bold uppercase transition-colors ${tenant.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-emerald-100 hover:text-emerald-700'}`}
                                                >
                                                    {tenant.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                                                    <Edit2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* User Management */}
            {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">User Management</h4>
                            <p className="text-sm text-slate-500">Manage access across all tenants.</p>
                        </div>
                        <Button onClick={() => handleOpenUserModal(null)}>
                            <UserPlus size={16} className="mr-2"/> Add User
                        </Button>
                    </div>

                    <Card noPadding>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Tenant</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {users.map(user => {
                                        const userTenant = tenants.find(t => t.id === user.tenantId) || (user.tenantId === 'global' ? { name: 'Global' } : null);
                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={user.avatarUrl} className="w-8 h-8 rounded-full" />
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-bold">
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                                                    {userTenant ? userTenant.name : 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${user.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {user.isActive !== false ? 'Active' : 'Deactivated'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleResendActivation(user.email, user.name)}
                                                            className="text-slate-400 hover:text-blue-600 p-1"
                                                            title="Resend Activation Email"
                                                        >
                                                            <Mail size={16}/>
                                                        </button>
                                                        <button onClick={() => handleOpenUserModal(user)} className="text-slate-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button>
                                                        <button onClick={() => handleDeleteUser(user.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Billing & Plans Tab (Admin View) */}
            {activeTab === 'billing' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Subscription Plans</h4>
                            <p className="text-sm text-slate-500">Manage billing tiers for tenants.</p>
                        </div>
                        <Button onClick={() => handleOpenPlanModal(null)}>
                            <Plus size={16} className="mr-2"/> Create Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <Card key={plan.id} className="relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-sky-500"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <h5 className="font-bold text-xl text-slate-900 dark:text-white">{plan.name}</h5>
                                    {plan.isActive ? (
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Active</span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Archived</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 mb-6 h-10">{plan.description}</p>
                                <div className="mb-6">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.currency} {plan.price}</span>
                                    <span className="text-sm text-slate-400"> / {plan.interval}</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {plan.features.slice(0, 3).map((f, i) => (
                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-indigo-500"/> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="outline" className="w-full" onClick={() => handleOpenPlanModal(plan)}>Edit Plan</Button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'support' && (
                <div className="space-y-6 animate-fade-in">
                    <Card className="text-center py-10">
                        <Mail size={48} className="mx-auto text-blue-500 mb-4 opacity-60"/>
                        <h4 className="font-bold text-xl text-slate-900 dark:text-white">Support & Contact</h4>
                        <p className="text-slate-500 mt-2">Reach out to Inala Holdings support or view documentation.</p>
                        <Button className="mt-6">Open Support Ticket</Button>
                    </Card>
                </div>
            )}
        </div>

        {/* User Edit/Add Modal */}
        <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={selectedUser ? 'Edit User' : 'Add New User'} size="md">
            <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full Name</label>
                    <input type="text" className="input-field" value={userFormData.name || ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email Address</label>
                    <input type="email" className="input-field" value={userFormData.email || ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Role</label>
                        <select className="input-field" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}>
                            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                            <option value={UserRole.TENANT_ADMIN}>Tenant Admin</option>
                            <option value={UserRole.BRANCH_MANAGER}>Branch Manager</option>
                            <option value={UserRole.CASHIER}>Cashier</option>
                            <option value={UserRole.MEMBER}>Stokvel Member</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Status</label>
                        <select className="input-field" value={userFormData.isActive ? 'true' : 'false'} onChange={e => setUserFormData({...userFormData, isActive: e.target.value === 'true'})}>
                            <option value="true">Active</option>
                            <option value="false">Deactivated</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Assign Tenant</label>
                    <select className="input-field" value={userFormData.tenantId || ''} onChange={e => setUserFormData({...userFormData, tenantId: e.target.value})}>
                        <option value="">Select Tenant...</option>
                        <option value="global">Global (Super Admin Only)</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                        ))}
                    </select>
                </div>
                <Button className="w-full mt-4" onClick={handleSaveUser}>
                    {selectedUser ? 'Save Changes' : 'Create User'}
                </Button>
            </div>
        </Modal>

        {/* Plan Edit/Add Modal */}
        <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title="Manage Subscription Plan" size="md">
            <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Plan Name</label>
                    <input type="text" className="input-field" value={planFormData.name || ''} onChange={e => setPlanFormData({...planFormData, name: e.target.value})} placeholder="e.g. Pro Plan" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Description</label>
                    <input type="text" className="input-field" value={planFormData.description || ''} onChange={e => setPlanFormData({...planFormData, description: e.target.value})} placeholder="Short summary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Price</label>
                        <input type="number" className="input-field" value={planFormData.price || ''} onChange={e => setPlanFormData({...planFormData, price: Number(e.target.value)})} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Currency</label>
                        <select className="input-field" value={planFormData.currency || 'ZAR'} onChange={e => setPlanFormData({...planFormData, currency: e.target.value})}>
                            <option value="ZAR">ZAR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Interval</label>
                        <select className="input-field" value={planFormData.interval || BillingInterval.MONTHLY} onChange={e => setPlanFormData({...planFormData, interval: e.target.value as BillingInterval})}>
                            <option value={BillingInterval.MONTHLY}>Monthly</option>
                            <option value={BillingInterval.YEARLY}>Yearly</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Tier Mapping</label>
                        <select className="input-field" value={planFormData.tier || 'BASIC'} onChange={e => setPlanFormData({...planFormData, tier: e.target.value as any})}>
                            <option value="BASIC">Basic</option>
                            <option value="PRO">Pro</option>
                            <option value="ENTERPRISE">Enterprise</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Features (comma separated)</label>
                    <textarea 
                        className="input-field h-24 resize-none" 
                        value={planFormData.features?.join(', ') || ''} 
                        onChange={e => setPlanFormData({...planFormData, features: e.target.value.split(',').map(s => s.trim())})} 
                        placeholder="Feature 1, Feature 2..."
                    />
                </div>
                <Button className="w-full mt-4" onClick={handleSavePlan}>Save Plan</Button>
            </div>
        </Modal>
    </div>
  );
};