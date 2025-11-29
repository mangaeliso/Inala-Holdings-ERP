import React, { useState } from 'react';
import { INALA_HOLDINGS_TENANT } from '../services/mockData';
import { getUsers, getTenants } from '../services/firestore';
import { User, Tenant } from '../types';
import { Button } from '../components/ui/Button';
import { ArrowRight, Lock, Mail, ShieldCheck, Building2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User, tenant: Tenant) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const users = await getUsers();
        // Simple mock authentication by email matching
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
             let tenant: Tenant | undefined;
             if (user.tenantId === 'GLOBAL') {
                 tenant = INALA_HOLDINGS_TENANT;
             } else {
                 const tenants = await getTenants();
                 tenant = tenants.find(t => t.id === user.tenantId);
             }

             if (tenant) {
                 onLogin(user, tenant);
             } else {
                 alert('Tenant not found');
             }
        } else {
            // Fallback for demo if no email matches, log in as super admin
            onLogin(users[0], INALA_HOLDINGS_TENANT);
        }
    } catch (error) {
        console.error(error);
        alert('Login failed');
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickLogin = async (index: number) => {
    setIsLoading(true);
    try {
        const users = await getUsers();
        // Safe access
        if (users.length <= index) return;
        
        const user = users[index];
        let tenant: Tenant | undefined;
        
        if (user.tenantId === 'GLOBAL') {
            tenant = INALA_HOLDINGS_TENANT;
        } else {
            const tenants = await getTenants();
            tenant = tenants.find(t => t.id === user.tenantId);
        }

        if (user && tenant) {
            onLogin(user, tenant);
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-600/20 blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-600/20 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 shadow-2xl rounded-3xl overflow-hidden m-4">
            
            {/* Left Panel - Brand */}
            <div className="bg-slate-800/50 backdrop-blur-xl p-8 md:p-12 flex flex-col justify-between border-r border-white/5 relative">
                <div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-6">
                        I
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">INALA HOLDINGS</h1>
                    <p className="text-slate-400">Enterprise Resource Planning for modern businesses and cooperatives.</p>
                </div>
                
                <div className="mt-12 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Enterprise Security</h3>
                            <p className="text-sm text-slate-500">Bank-grade encryption and multi-tenant isolation.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Multi-Tenant Architecture</h3>
                            <p className="text-sm text-slate-500">Manage unlimited branches and subsidiaries from one dashboard.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 text-xs text-slate-500">
                    &copy; 2025 INALA Holdings Ltd. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="bg-white dark:bg-slate-950 p-8 md:p-12 flex flex-col justify-center">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
                    <p className="text-slate-500 text-sm">Please sign in to your account.</p>
                </div>

                <form onSubmit={handleManualLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            Remember me
                        </label>
                        <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</a>
                    </div>
                    
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Sign In <ArrowRight size={16} className="ml-2" />
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-900">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Demo Quick Access</p>
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => handleQuickLogin(0)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left group"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                <ShieldCheck size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Super Admin</p>
                                <p className="text-xs text-slate-500">Global INALA Access</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleQuickLogin(1)}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left group"
                        >
                            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center">
                                <Building2 size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600">Tenant Admin</p>
                                <p className="text-xs text-slate-500">African Man Group</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
