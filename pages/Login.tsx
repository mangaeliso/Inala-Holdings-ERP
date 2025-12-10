import React, { useState } from 'react';
import { getUsers, getTenants, getGlobalSettings, getTenantBrandingSettings, ensureGlobalSettings } from '../services/firestore';
import { User, Tenant, UserRole, TenantType, GlobalSettings as GlobalSettingsType, BrandingSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowRight, Lock, Mail, ShieldCheck, Building2, CheckCircle } from 'lucide-react';
import { useUI } from '../context/UIContext';

interface LoginProps {
  onLogin: (user: User, tenant: Tenant) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { setGlobalSettings, setTenantBranding, addToast } = useUI();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Not used for mock auth, but kept for UI
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Default Tenant structure for fallback/initial state (if Firestore is empty/loading)
  const DEFAULT_GLOBAL_TENANT: Tenant = {
    id: 'global',
    name: 'INALA HOLDINGS',
    type: TenantType.BUSINESS,
    isActive: true,
    category: 'Headquarters',
    branding: { displayName: 'INALA Holdings', primaryColor: '#6366f1' }, // Minimal branding for global
    access: { subscriptionTier: 'ENTERPRISE' },
    cycleSettings: { startDay: 1, endDay: 31, fiscalStartMonth: 1, currencySymbol: 'R' },
    posSettings: { receiptFooter: 'Thank you!', taxRate: 15, enableCash: true, enableCard: true, enableCredit: true, autoPrint: true, currencySymbol: 'R', numberFormat: 'R_COMMA_DECIMAL' }
  };

  const authenticateAndSetContext = async (user: User, tenant: Tenant) => {
    // Load global settings
    const globalConfig = await getGlobalSettings();
    setGlobalSettings(globalConfig);

    // Load tenant-specific branding
    if (user.tenantId !== 'global') {
        const branding = await getTenantBrandingSettings(user.tenantId);
        setTenantBranding(branding || null);
    } else {
        setTenantBranding(null); // Clear tenant branding for global admin
    }
    
    // Check if user is active
    if (user.isActive === false) {
        addToast('Account deactivated. Contact administrator.', 'error');
        return;
    }

    onLogin(user, tenant);
  };


  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const users = await getUsers();
        // Simple mock authentication by email matching
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
             let tenant: Tenant | undefined;
             if (user.tenantId === 'global') {
                 tenant = (await getTenants()).find(t => t.id === 'global') || DEFAULT_GLOBAL_TENANT;
             } else {
                 const tenants = await getTenants();
                 tenant = tenants.find(t => t.id === user.tenantId);
             }

             if (tenant) {
                 await authenticateAndSetContext(user, tenant);
             } else {
                 addToast('Tenant not found', 'error');
             }
        } else {
            addToast('Invalid credentials (Try Quick Access for Demo)', 'error');
        }
    } catch (error) {
        console.error(error);
        addToast('Login failed. Check console for details.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickLogin = async (targetUserRole: UserRole) => {
    setIsLoading(true);
    try {
        // Ensure global settings and initial data are present first
        const globalConfig = await ensureGlobalSettings();
        setGlobalSettings(globalConfig); // Set global settings in context

        const users = await getUsers();
        const tenants = await getTenants();
        
        const user = users.find(u => u.role === targetUserRole);
        if (!user) {
          addToast(`No user found with role: ${targetUserRole}`, 'warning');
          setIsLoading(false);
          return;
        }

        let tenant: Tenant | undefined;
        if (user.tenantId === 'global') {
            tenant = tenants.find(t => t.id === 'global') || DEFAULT_GLOBAL_TENANT;
        } else {
            tenant = tenants.find(t => t.id === user.tenantId);
        }

        if (user && tenant) {
            await authenticateAndSetContext(user, tenant);
        } else {
            addToast('User or Tenant data incomplete for quick login.', 'error');
        }
    } catch (error) {
        console.error(error);
        addToast('Quick Login failed. Check console for details.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate password reset logic
      setResetSent(true);
      // In a real app with Firebase Auth, this would call sendPasswordResetEmail(auth, resetEmail)
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
                        <button type="button" onClick={() => setShowForgotModal(true)} className="text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</button>
                    </div>
                    
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        Sign In <ArrowRight size={16} className="ml-2" />
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-900">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">Demo Quick Access</p>
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                            onClick={() => handleQuickLogin(UserRole.SUPER_ADMIN)}
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
                            onClick={() => handleQuickLogin(UserRole.TENANT_ADMIN)}
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

        {/* Forgot Password Modal */}
        <Modal isOpen={showForgotModal} onClose={() => { setShowForgotModal(false); setResetSent(false); setResetEmail(''); }} title="Reset Password" size="sm">
            <div className="space-y-4 pt-2">
                {!resetSent ? (
                    <>
                        <p className="text-sm text-slate-500">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email Address</label>
                            <input 
                                type="email" 
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                                placeholder="name@company.com"
                            />
                        </div>
                        <Button className="w-full mt-2" onClick={handlePasswordReset}>
                            Send Reset Link
                        </Button>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check your email</h4>
                        <p className="text-sm text-slate-500">
                            We have sent a password reset link to <strong>{resetEmail}</strong>.
                        </p>
                        <Button variant="outline" className="mt-6" onClick={() => { setShowForgotModal(false); setResetSent(false); }}>
                            Back to Login
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    </div>
  );
};