import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  Globe, 
  Users, 
  Shield, 
  Bell, 
  Mail, 
  Save, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  LayoutGrid,
  Lock,
  Smartphone,
  Server
} from 'lucide-react';
import { MOCK_USERS, MOCK_TENANTS } from '../services/mockData';
import { User, UserRole } from '../types';

const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'New User Welcome', subject: 'Welcome to Inala ERP', lastEdited: '2 days ago' },
  { id: 'reset', name: 'Password Reset', subject: 'Reset your password', lastEdited: '1 week ago' },
  { id: 'invoice', name: 'Invoice Generated', subject: 'Invoice #{invoice_id} from {business_name}', lastEdited: '1 month ago' },
  { id: 'payout', name: 'Stokvel Payout Ready', subject: 'Action Required: Payout Authorization', lastEdited: '3 days ago' },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // --- TAB NAVIGATION ---
  const tabs = [
    { id: 'general', label: 'Global Config', icon: Globe, desc: 'System identity & localization' },
    { id: 'users', label: 'User Management', icon: Users, desc: 'Roles, access & permissions' },
    { id: 'communication', label: 'Communication', icon: Mail, desc: 'Templates & notifications' },
    { id: 'security', label: 'Security & Audit', icon: Shield, desc: '2FA, Sessions & Logs' },
  ];

  // --- RENDERERS ---

  // 1. GENERAL SETTINGS
  const GeneralSettings = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <LayoutGrid size={20} className="text-indigo-500"/> System Identity
                </h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Platform Name</label>
                        <input type="text" defaultValue="INALA HOLDINGS ERP" className="input-field" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Support Email</label>
                        <input type="email" defaultValue="support@inala.holdings" className="input-field" />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">White-label Domain</label>
                        <input type="text" defaultValue="app.inala.holdings" className="input-field" />
                    </div>
                </div>
            </Card>
            
            <Card>
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe size={20} className="text-emerald-500"/> Localization
                </h3>
                <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Default Language</label>
                        <select className="input-field">
                            <option>English (UK)</option>
                            <option>Portuguese (Mozambique)</option>
                            <option>Zulu</option>
                            <option>Xhosa</option>
                            <option>Polish</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Timezone</label>
                        <select className="input-field">
                            <option>(GMT+02:00) Johannesburg</option>
                            <option>(GMT+02:00) Maputo</option>
                            <option>(GMT+00:00) London</option>
                            <option>(GMT-05:00) Eastern Time (US)</option>
                        </select>
                    </div>
                </div>
            </Card>
        </div>
        
        <div className="flex justify-end">
             <Button isLoading={isSaving} onClick={() => { setIsSaving(true); setTimeout(() => setIsSaving(false), 1000); }}>
                <Save size={18} className="mr-2" /> Save Global Configuration
             </Button>
        </div>
    </div>
  );

  // 2. USER MANAGEMENT
  const UserManagement = () => {
      const [users, setUsers] = useState(MOCK_USERS);
      const [searchTerm, setSearchTerm] = useState('');
      const [showUserModal, setShowUserModal] = useState(false);
      const [editingUser, setEditingUser] = useState<User | null>(null);

      // Add/Edit Form State
      const [formName, setFormName] = useState('');
      const [formEmail, setFormEmail] = useState('');
      const [formRole, setFormRole] = useState<UserRole>(UserRole.CASHIER);
      const [formTenants, setFormTenants] = useState<string[]>([]); // Multi-select mock

      const handleEdit = (user: User) => {
          setEditingUser(user);
          setFormName(user.name);
          setFormEmail(user.email);
          setFormRole(user.role);
          setFormTenants(user.tenantId === 'GLOBAL' ? [] : [user.tenantId]);
          setShowUserModal(true);
      };

      const handleAdd = () => {
          setEditingUser(null);
          setFormName('');
          setFormEmail('');
          setFormRole(UserRole.CASHIER);
          setFormTenants([]);
          setShowUserModal(true);
      };

      return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search users by name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
                <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus size={18} className="mr-2" /> Add New User
                </Button>
            </div>

            <Card noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Role & Access</th>
                                <th className="px-6 py-4">Assigned Context</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                            user.role === UserRole.TENANT_ADMIN ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}>
                                            {user.role === UserRole.SUPER_ADMIN && <Shield size={12} />}
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.tenantId === 'GLOBAL' ? (
                                            <span className="text-xs font-mono bg-slate-900 text-white px-2 py-0.5 rounded">ALL_SYSTEMS</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                                                    {MOCK_TENANTS.find(t => t.id === user.tenantId)?.name || user.tenantId}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(user)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUser ? 'Edit User' : 'Create New User'}>
                <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold">Full Name</label>
                        <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input-field" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold">Email Address</label>
                        <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="input-field" placeholder="user@inala.holdings" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">System Role</label>
                            <select value={formRole} onChange={e => setFormRole(e.target.value as UserRole)} className="input-field">
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold">Primary Assignment</label>
                            <select className="input-field" disabled={formRole === UserRole.SUPER_ADMIN}>
                                <option value="GLOBAL">Global (Super Admin)</option>
                                {MOCK_TENANTS.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
                        <Button onClick={() => setShowUserModal(false)}>Save User</Button>
                    </div>
                </div>
            </Modal>
        </div>
      );
  };

  // 3. COMMUNICATION
  const CommunicationHub = () => {
      const [showTemplateModal, setShowTemplateModal] = useState(false);
      const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Channels */}
                  <div className="lg:col-span-1 space-y-4">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Notification Channels</h3>
                      <Card className="space-y-4">
                          {[
                              { label: 'Email Alerts', icon: Mail, enabled: true },
                              { label: 'SMS Notifications', icon: Smartphone, enabled: true },
                              { label: 'Push Notifications', icon: Bell, enabled: false },
                              { label: 'Webhook Events', icon: Server, enabled: false }
                          ].map((channel, i) => (
                              <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${channel.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                          <channel.icon size={18} />
                                      </div>
                                      <span className={`font-medium ${channel.enabled ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{channel.label}</span>
                                  </div>
                                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${channel.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${channel.enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                  </div>
                              </div>
                          ))}
                      </Card>
                  </div>

                  {/* Templates */}
                  <div className="lg:col-span-2">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Email Templates</h3>
                          <Button size="sm" onClick={() => { setSelectedTemplate(null); setShowTemplateModal(true); }}>
                              <Plus size={16} className="mr-2"/> New Template
                          </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {EMAIL_TEMPLATES.map(template => (
                              <div 
                                key={template.id} 
                                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 cursor-pointer transition-all group"
                                onClick={() => { setSelectedTemplate(template); setShowTemplateModal(true); }}
                              >
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-lg transition-colors">
                                          <Mail size={20} />
                                      </div>
                                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                                          {template.lastEdited}
                                      </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{template.name}</h4>
                                  <p className="text-xs text-slate-500 truncate">{template.subject}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Template Editor Modal */}
              <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Template Editor" size="lg">
                  <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                          <label className="text-sm font-semibold">Template Name</label>
                          <input type="text" className="input-field" defaultValue={selectedTemplate?.name} placeholder="e.g. Order Confirmation" />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-semibold">Subject Line</label>
                          <input type="text" className="input-field" defaultValue={selectedTemplate?.subject} placeholder="Subject..." />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-sm font-semibold">HTML Content</label>
                          <textarea className="input-field h-64 font-mono text-xs" defaultValue="<html>...</html>"></textarea>
                          <p className="text-xs text-slate-500">Available variables: {'{user_name}, {business_name}, {amount}, {date}'}</p>
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
                          <Button onClick={() => setShowTemplateModal(false)}>Save Template</Button>
                      </div>
                  </div>
              </Modal>
          </div>
      );
  };

  // 4. SECURITY
  const SecuritySettings = () => (
      <div className="space-y-6 animate-fade-in">
          <Card className="border-l-4 border-amber-500">
             <div className="flex items-start gap-4">
                 <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                     <Shield size={24} />
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white">Global Security Policy</h3>
                     <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                         Changes made here affect all tenants and users. Enforcing 2FA will require all users to set up authentication on their next login.
                     </p>
                 </div>
             </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Lock size={18} className="text-indigo-500" /> Authentication
                  </h4>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="font-medium text-sm">Two-Factor Auth (2FA)</p>
                              <p className="text-xs text-slate-500">Mandatory for Admins</p>
                          </div>
                          <div className="w-10 h-6 bg-indigo-600 rounded-full p-1 cursor-pointer"><div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm"></div></div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="font-medium text-sm">Password Rotation</p>
                              <p className="text-xs text-slate-500">Every 90 days</p>
                          </div>
                          <div className="w-10 h-6 bg-slate-300 rounded-full p-1 cursor-pointer"><div className="w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="font-medium text-sm">Session Timeout</p>
                              <p className="text-xs text-slate-500">Auto-lock screen</p>
                          </div>
                          <select className="bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded px-2 py-1 border-none outline-none">
                              <option>15 mins</option>
                              <option>30 mins</option>
                              <option>1 hour</option>
                          </select>
                      </div>
                  </div>
              </Card>

              <Card>
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                      <LayoutGrid size={18} className="text-indigo-500" /> Audit & Logs
                  </h4>
                  <div className="space-y-3">
                      {[
                          { action: 'User Login', user: 'Admin', time: '2 mins ago', ip: '192.168.1.1' },
                          { action: 'Settings Change', user: 'SuperAdmin', time: '1 hour ago', ip: '10.0.0.5' },
                          { action: 'Payout Approved', user: 'Treasurer', time: '3 hours ago', ip: '192.168.1.4' },
                      ].map((log, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <div>
                                  <p className="font-bold text-slate-700 dark:text-slate-300">{log.action}</p>
                                  <p className="text-xs text-slate-500">{log.user} • {log.ip}</p>
                              </div>
                              <span className="text-xs font-mono text-slate-400">{log.time}</span>
                          </div>
                      ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-4 text-xs">View Full Audit Log</Button>
              </Card>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 animate-fade-in">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-100 dark:border-slate-800 h-full flex flex-col">
                <div className="mb-6 px-4 pt-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">System Control Center</p>
                </div>
                
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group ${
                                activeTab === tab.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-100' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:scale-[1.02]'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-indigo-200' : 'text-slate-400 group-hover:text-indigo-500'} />
                                <span className={`font-bold ${activeTab === tab.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {tab.label}
                                </span>
                            </div>
                            <p className={`text-xs ml-8 ${activeTab === tab.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {tab.desc}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-mono">Build v2.4.1</p>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
            <style>{`
                .input-field {
                    @apply w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white;
                }
            `}</style>
            
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'communication' && <CommunicationHub />}
            {activeTab === 'security' && <SecuritySettings />}
        </div>
    </div>
  );
};