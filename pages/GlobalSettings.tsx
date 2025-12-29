import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileUploader } from '../components/ui/FileUploader';
import { useUI } from '../context/UIContext';
import { 
  getGlobalSettings, updateGlobalSettings, uploadFileToFirebaseStorage, 
  getTenants, INITIAL_GLOBAL_SETTINGS, getUsers, 
  // Fix: Removed missing exports 'addBusinessAdmin', 'deleteUser', 'logAudit', 'saveBillingPlan', 'triggerSystemEmail'
  updateUser, updateTenant, getBillingPlans,
  updateSystemBranding
} from '../services/firestore';
import { GlobalSettings as GlobalSettingsType, Tenant, User, UserRole, BillingPlan, BillingInterval, TenantType } from '../types';
import { fileToBase64 } from '../lib/utils';
import { checkDBConnection } from '../lib/db';
import { 
  Building2, Save, CheckCircle2, AlertCircle, Upload, Plus, Edit2,
  Settings as SettingsIcon, LayoutDashboard, DollarSign, Users as UsersIcon, Mail, ShieldAlert,
  Database, Server, Key, ToggleLeft, ToggleRight, Eye, Trash2, Lock, UserPlus, Power, Check, CreditCard,
  ArrowLeft, Store, Briefcase, Layers, Globe
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { BusinessSettings } from './BusinessSettings';
import { GlobalPeople } from './GlobalPeople';


export const GlobalSettings: React.FC = () => {
  const { addToast, globalSettings, setGlobalSettings, currentUser } = useUI();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<GlobalSettingsType>(INITIAL_GLOBAL_SETTINGS);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  
  // Expanded Tabs
  const [activeTab, setActiveTab] = useState<'general' | 'tenants' | 'people' | 'users' | 'system' | 'billing' | 'support'>('general');
  const [dbStatus, setDbStatus] = useState<{ok: boolean, latency?: number, message?: string}>({ok: false});

  // Super Admin Override Mode State
  const [overrideMode, setOverrideMode] = useState(false);
  const [targetTenantId, setTargetTenantId] = useState<string | null>(null);

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({});

  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.role !== UserRole.SUPER_ADMIN) {
          setIsLoading(false);
          return;
      }

      setIsLoading(true);
      try {
        const fetchedGlobalSettings = await getGlobalSettings();
        setFormData(fetchedGlobalSettings);
        setGlobalSettings(fetchedGlobalSettings);

        const allTenants = await getTenants();
        setTenants(allTenants.filter(t => t.id !== 'global'));
        
        const allUsers = await getUsers();
        setUsers(allUsers);

        const allPlans = await getBillingPlans();
        setPlans(allPlans);

        const status = await checkDBConnection();
        setDbStatus(status);

      } catch (e) {
        console.error("Failed to load global settings", e);
        addToast("Error loading global settings", "error");
        setFormData(globalSettings);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser?.role]);

  const handleSave = async () => {
    setIsSaving(true);
    let updatedLogoUrl = typeof formData.erpLogoUrl === 'string' ? formData.erpLogoUrl : '';

    if (updatedLogoUrl && updatedLogoUrl.startsWith('data:image')) {
        try {
            const fileBlob = await fetch(updatedLogoUrl).then(res => res.blob());
            const ext = fileBlob.type.split('/')[1] || 'png';
            const filename = `systemLogo.${ext === 'svg+xml' ? 'svg' : ext}`;
            const file = new File([fileBlob], filename, { type: fileBlob.type });
            updatedLogoUrl = await uploadFileToFirebaseStorage(file, `branding/${filename}`);
            addToast('System logo uploaded', 'success');
        } catch (uploadError) {
            addToast('Failed to upload ERP logo', 'error');
            setIsSaving(false);
            return;
        }
    }

    await updateSystemBranding({ logoUrl: updatedLogoUrl });

    const safeSettings: GlobalSettingsType = {
        id: 'global',
        erpName: formData.erpName || '',
        erpLogoUrl: updatedLogoUrl,
        primaryColor: formData.primaryColor || '',
        secondaryColor: formData.secondaryColor || '',
        supportEmail: formData.supportEmail || '',
        platformDomain: formData.platformDomain || '',
        apiKeys: { ...formData.apiKeys },
        system: { ...formData.system! }
    };

    const success = await updateGlobalSettings(safeSettings);
    setIsSaving(false);
    if (success) {
      setGlobalSettings(safeSettings);
      setFormData(safeSettings);
      addToast('Global settings saved', 'success');
    }
  };

  const handleEditTenantSettings = (tenantId: string) => {
      setTargetTenantId(tenantId);
      setOverrideMode(true);
  };

  if (currentUser?.role !== UserRole.SUPER_ADMIN) return <div className="p-12 text-center">Access Denied</div>;
  if (isLoading) return <div className="p-12 text-center">Loading Organizational Core...</div>;

  if (overrideMode && targetTenantId) {
      return (
          <div className="min-h-screen pb-20 animate-fade-in flex flex-col">
              <div className="sticky top-0 z-20 bg-slate-50/90 py-4 mb-6 border-b border-slate-200 flex justify-between items-center">
                  <Button variant="outline" onClick={() => setOverrideMode(false)}>
                      <ArrowLeft size={16} className="mr-2" /> Back to Organizations
                  </Button>
                  <h2 className="text-xl font-bold">Organization Override: {targetTenantId}</h2>
              </div>
              <BusinessSettings tenantId={targetTenantId} />
          </div>
      );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen gap-8 pb-20 animate-fade-in">
        <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-6">
                <h2 className="text-2xl font-bold mb-6 px-2 text-slate-900 dark:text-white">ERP Platform</h2>
                <div className="space-y-1">
                    {[
                        { id: 'general', icon: SettingsIcon, label: 'Platform Basics' },
                        { id: 'system', icon: Server, label: 'Infrastructure' },
                        { id: 'tenants', icon: Building2, label: 'Organizations' },
                        { id: 'people', icon: Globe, label: 'Global Registry' },
                        { id: 'users', icon: UsersIcon, label: 'Internal Staff' },
                        { id: 'billing', icon: DollarSign, label: 'SaaS Billing' },
                        { id: 'support', icon: Mail, label: 'System Support' },
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

        <div className="flex-1 max-w-4xl">
            <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold capitalize text-slate-800 dark:text-white">{activeTab}</h3>
                {(activeTab === 'general' || activeTab === 'system') && (
                    <Button onClick={handleSave} isLoading={isSaving} className="bg-slate-900 text-white shadow-lg">
                        <Save size={18} className="mr-2"/> Commit Organization Changes
                    </Button>
                )}
            </div>

            {activeTab === 'general' && (
                <div className="space-y-6 animate-fade-in">
                    <Card>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Branding Environment</h4>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Platform Name</label>
                                <input type="text" value={formData.erpName || ''} onChange={e => setFormData({...formData, erpName: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg border" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Domain</label>
                                <input type="text" value={formData.platformDomain || ''} onChange={e => setFormData({...formData, platformDomain: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg border" />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'people' && <GlobalPeople />}

            {activeTab === 'tenants' && (
                <div className="space-y-4">
                    {tenants.map(t => (
                        <Card key={t.id} className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">{t.name}</h4>
                                <p className="text-xs text-slate-500">{t.type} • {t.category}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleEditTenantSettings(t.id)}>Manage</Button>
                        </Card>
                    ))}
                </div>
            )}

            {/* Other tabs placeholders */}
            {['system', 'users', 'billing', 'support'].includes(activeTab) && (
                <Card className="p-12 text-center text-slate-400">Section Active under Organisation ID: global</Card>
            )}
        </div>
    </div>
  );
};