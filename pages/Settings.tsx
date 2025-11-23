import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ToggleLeft, ToggleRight, Bell, Shield, Globe, CreditCard } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
                <p className="text-slate-500 text-sm">Manage global configurations and preferences.</p>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation for Settings */}
            <Card className="md:w-64 flex flex-col p-2 h-fit" noPadding>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left ${
                            activeTab === tab.id 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </Card>

            {/* Content Area */}
            <div className="flex-1">
                {activeTab === 'general' && (
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">System Name</label>
                                <input type="text" defaultValue="INALA HOLDINGS ERP" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Support Email</label>
                                <input type="email" defaultValue="support@inala.holdings" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Currency</label>
                                <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option>ZAR (South African Rand)</option>
                                    <option>USD (United States Dollar)</option>
                                    <option>EUR (Euro)</option>
                                </select>
                             </div>
                             <div className="pt-4">
                                <Button>Save Changes</Button>
                             </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'notifications' && (
                    <Card>
                        <h3 className="text-lg font-semibold mb-6">Notification Preferences</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                                    <p className="text-sm text-slate-500">Receive daily summaries and critical alerts.</p>
                                </div>
                                <button onClick={() => setNotifications({...notifications, email: !notifications.email})} className={`text-indigo-600 ${notifications.email ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                    {notifications.email ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Push Notifications</p>
                                    <p className="text-sm text-slate-500">Real-time alerts for sales and approvals.</p>
                                </div>
                                <button onClick={() => setNotifications({...notifications, push: !notifications.push})} className={`text-indigo-600 ${notifications.push ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                    {notifications.push ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">SMS Alerts</p>
                                    <p className="text-sm text-slate-500">Receive OTPs and urgent security messages.</p>
                                </div>
                                <button onClick={() => setNotifications({...notifications, sms: !notifications.sms})} className={`text-indigo-600 ${notifications.sms ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                    {notifications.sms ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'security' && (
                    <Card>
                         <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                         <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                             <h4 className="font-bold text-amber-800 flex items-center gap-2"><Shield size={18}/> Two-Factor Authentication</h4>
                             <p className="text-sm text-amber-700 mt-1">2FA is currently <strong>Enabled</strong> for all Super Admin accounts.</p>
                         </div>
                         <div className="space-y-4">
                             <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                                 <div>
                                     <p className="font-medium">Session Timeout</p>
                                     <p className="text-sm text-slate-500">Auto-logout after inactivity</p>
                                 </div>
                                 <select className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                                     <option>15 minutes</option>
                                     <option>30 minutes</option>
                                     <option>1 hour</option>
                                 </select>
                             </div>
                             <div className="flex justify-between items-center">
                                 <div>
                                     <p className="font-medium">API Access</p>
                                     <p className="text-sm text-slate-500">Allow external integrations</p>
                                 </div>
                                 <Button variant="outline" size="sm">Manage Keys</Button>
                             </div>
                         </div>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
};