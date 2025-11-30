import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FileUploader } from '../components/ui/FileUploader';
import { useUI } from '../context/UIContext';
import { getBusinessProfile, updateBusinessProfile, getBusinessAdmins, addBusinessAdmin } from '../services/firestore';
import { Tenant, User, UserRole, EmailTemplate, TenantType } from '../types';
import { fileToBase64 } from '../lib/utils';
import { 
  Building2, Users, Mail, Bell, RefreshCw, ShoppingCart, Database, Shield,
  Save, Edit2, Plus, Trash2, CheckCircle2, AlertTriangle, Eye, Send, Lock
} from 'lucide-react';

interface BusinessSettingsProps {
  tenantId: string;
}

// Default State to prevent crashes
const DEFAULT_PROFILE: Partial<Tenant> = {
    name: '',
    type: TenantType.BUSINESS,
    primaryColor: '#6366f1',
    currency: 'ZAR',
    subscriptionTier: 'BASIC',
    emailConfig: { senderEmail: '', templates: [] },
    notifications: {
        emailNewSale: true, smsPayment: false, dailySummary: true, 
        lowStock: true, creditWarning: true, autoMonthlyReport: true, recipients: []
    },
    cycleSettings: { startDay: 5, endDay: 4, fiscalStartMonth: 2 },
    posSettings: { 
        receiptFooter: 'Thank you for your support!', taxRate: 15, 
        enableCash: true, enableCard: true, enableCredit: true, autoPrint: false 
    }
};

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useUI();

  // Master State
  const [profile, setProfile] = useState<Partial<Tenant>>(DEFAULT_PROFILE);
  const [admins, setAdmins] = useState<User[]>([]);
  
  // Load Data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
          const tenantData = await getBusinessProfile(tenantId);
          const adminData = await getBusinessAdmins(tenantId);
          
          if (tenantData) {
              setProfile({
                  ...DEFAULT_PROFILE,
                  ...tenantData,
                  emailConfig: { ...DEFAULT_PROFILE.emailConfig, ...tenantData.emailConfig },
                  notifications: { ...DEFAULT_PROFILE.notifications, ...tenantData.notifications },
                  cycleSettings: { ...DEFAULT_PROFILE.cycleSettings, ...tenantData.cycleSettings },
                  posSettings: { ...DEFAULT_PROFILE.posSettings, ...tenantData.posSettings }
              });
          }
          setAdmins(adminData);
      } catch (e) {
          console.error("Failed to load settings", e);
          addToast("Error loading settings", "error");
      } finally {
          setIsLoading(false);
      }
    };
    load();
  }, [tenantId]);

  const handleSave = async () => {
      setIsSaving(true);
      const success = await updateBusinessProfile(tenantId, profile);
      setIsSaving(false);
      if (success) {
          addToast('Settings saved successfully', 'success');
      } else {
          addToast('Failed to save settings', 'error');
      }
  };

  const handleLogoUpload = async (file: File) => {
      try {
          const base64 = await fileToBase64(file);
          setProfile(prev => ({ ...prev, logoUrl: base64 }));
      } catch (e) {
          addToast('Logo upload failed', 'error');
      }
  };

  // --- Sub-Components ---

  const ProfileTab = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Business Identity</h4>
                  <div className="flex flex-col items-center mb-6">
                      <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                          {profile.logoUrl ? (
                              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                              <Building2 size={32} className="text-slate-300" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-bold">Change</span>
                          </div>
                          <div className="absolute inset-0 opacity-0 cursor-pointer">
                              <FileUploader onFileSelect={handleLogoUpload} label="" />
                          </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Max 2MB (PNG/JPG)</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-sm font-semibold">Brand Color</label>
                          <div className="flex gap-2 mt-1">
                              {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'].map(c => (
                                  <button 
                                    key={c}
                                    onClick={() => setProfile({...profile, primaryColor: c})}
                                    className={`w-8 h-8 rounded-full border-2 ${profile.primaryColor === c ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                  />
                              ))}
                              <input type="color" value={profile.primaryColor || '#6366f1'} onChange={e => setProfile({...profile, primaryColor: e.target.value})} className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden" />
                          </div>
                      </div>
                  </div>
              </Card>

              <Card className="lg:col-span-2">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-6">Business Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Business Name</label>
                          <input type="text" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className="input-field" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Type</label>
                          <select value={profile.type} onChange={e => setProfile({...profile, type: e.target.value as any})} className="input-field">
                              <option value={TenantType.BUSINESS}>Retail Business</option>
                              <option value={TenantType.STOKVEL}>Stokvel Group</option>
                              <option value={TenantType.LENDING}>Lending Institution</option>
                          </select>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Registration Number</label>
                          <input type="text" value={profile.regNumber || ''} onChange={e => setProfile({...profile, regNumber: e.target.value})} className="input-field" placeholder="e.g. 2024/123456/07" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Tax / VAT Number</label>
                          <input type="text" value={profile.taxNumber || ''} onChange={e => setProfile({...profile, taxNumber: e.target.value})} className="input-field" placeholder="Optional" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                          <label className="text-sm font-medium text-slate-600">Physical Address</label>
                          <input type="text" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} className="input-field" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Contact Number</label>
                          <input type="tel" value={profile.contactNumber || ''} onChange={e => setProfile({...profile, contactNumber: e.target.value})} className="input-field" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-600">Support Email</label>
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
                                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
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

  const EmailTab = () => (
      <div className="space-y-6 animate-fade-in">
          <Card>
              <h4 className="font-bold mb-4">SMTP Configuration</h4>
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600">SMTP Host</label>
                      <input type="text" className="input-field" placeholder="smtp.gmail.com" value={profile.emailConfig?.smtpHost || ''} onChange={e => setProfile({...profile, emailConfig: {...profile.emailConfig!, smtpHost: e.target.value}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600">Port</label>
                      <input type="text" className="input-field" placeholder="587" value={profile.emailConfig?.smtpPort || ''} onChange={e => setProfile({...profile, emailConfig: {...profile.emailConfig!, smtpPort: e.target.value}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-600">Sender Email</label>
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
                      <div key={tpl} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
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
                      <div key={item.key} className="flex justify-between items-center pb-4 border-b border-slate-100 last:border-0">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                          <div 
                              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${profile.notifications?.[item.key as keyof typeof profile.notifications] ? 'bg-indigo-600' : 'bg-slate-200'}`}
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
              <h4 className="font-bold mb-4">Business Cycle Configuration</h4>
              <p className="text-sm text-slate-500 mb-6">Define your fiscal month for reporting. Default is 5th to 4th.</p>
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium">Cycle Start Day</label>
                      <input type="number" className="input-field" value={profile.cycleSettings?.startDay || 5} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, startDay: Number(e.target.value)}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium">Cycle End Day</label>
                      <input type="number" className="input-field" value={profile.cycleSettings?.endDay || 4} onChange={e => setProfile({...profile, cycleSettings: {...profile.cycleSettings!, endDay: Number(e.target.value)}})} />
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
                      <label className="text-sm font-medium">Tax Rate (%)</label>
                      <input type="number" className="input-field" value={profile.posSettings?.taxRate || 0} onChange={e => setProfile({...profile, posSettings: {...profile.posSettings!, taxRate: Number(e.target.value)}})} />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-sm font-medium">Receipt Footer Text</label>
                      <input type="text" className="input-field" value={profile.posSettings?.receiptFooter || ''} onChange={e => setProfile({...profile, posSettings: {...profile.posSettings!, receiptFooter: e.target.value}})} />
                  </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
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
              <Button variant="outline"><CheckCircle2 size={16} className="mr-2"/> Export CSV Backup</Button>
          </div>
          <div className="p-6 border border-red-200 bg-red-50 rounded-2xl">
              <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Danger Zone</h4>
              <p className="text-sm text-red-600 mb-4">Deleting business data is irreversible.</p>
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
                  <div className="w-12 h-6 bg-slate-200 rounded-full p-1 cursor-pointer"><div className="w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
              </div>
          </Card>
          <Card>
              <h4 className="font-bold mb-4">Audit Logs</h4>
              <div className="text-sm text-slate-500 space-y-2">
                  <div className="flex justify-between border-b pb-2">
                      <span>Admin Login (User ID: u_001)</span>
                      <span>2 mins ago</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                      <span>Settings Updated</span>
                      <span>1 hour ago</span>
                  </div>
              </div>
          </Card>
      </div>
  );

  if (isLoading) return <div className="p-10 text-center">Loading Settings...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen gap-8 pb-20 animate-fade-in">
        {/* Settings Nav */}
        <div className="w-full md:w-64 shrink-0">
            <div className="sticky top-6">
                <h2 className="text-2xl font-bold mb-6 px-2 text-slate-900 dark:text-white">Settings</h2>
                <div className="space-y-1">
                    {[
                        { id: 'profile', icon: Building2, label: 'Business Profile' },
                        { id: 'admins', icon: Users, label: 'Admins & Roles' },
                        { id: 'email', icon: Mail, label: 'Email Config' },
                        { id: 'notifications', icon: Bell, label: 'Notifications' },
                        { id: 'cycle', icon: RefreshCw, label: 'Business Cycle' },
                        { id: 'pos', icon: ShoppingCart, label: 'POS Settings' },
                        { id: 'data', icon: Database, label: 'Data & Backup' },
                        { id: 'security', icon: Shield, label: 'Security' },
                    ].map(item => (
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