
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  Menu,
  Bell,
  Search,
  LogOut,
  Building2,
  Store,
  Landmark,
  Gem,
  Sun,
  Moon,
  RefreshCw,
  Mail
} from 'lucide-react';
import { Tenant, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  currentUser: User;
  currentTenant: Tenant;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onNavigate, 
  currentUser,
  currentTenant,
  onLogout,
  isDarkMode,
  toggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Admin Navigation
  const globalNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'businesses', label: 'Businesses', icon: Store },
    { id: 'stokvels', label: 'Stokvels', icon: Users },
    { id: 'exchange', label: 'Currency Exchange', icon: RefreshCw },
    { id: 'inbox', label: 'Inbox', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Tenant/Standard User Navigation (Fallback)
  const tenantNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS / Sales', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Gem },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'finance', label: 'Finance', icon: FileText },
    { id: 'exchange', label: 'Exchange', icon: RefreshCw },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'inbox', label: 'Inbox', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = currentUser.tenantId === 'GLOBAL' ? globalNavItems : tenantNavItems;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            I
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">INALA</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider">HOLDINGS ERP</p>
          </div>
        </div>

        <div className="px-6 py-2">
           <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-3 border border-slate-200 dark:border-slate-700">
              {currentTenant.logoUrl && <img src={currentTenant.logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover" />}
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{currentTenant.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.role === 'SUPER_ADMIN' ? 'Global Super Admin' : currentTenant.subscriptionTier}</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-indigo-600' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
             <button onClick={() => onNavigate('profile')} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                <img src={currentUser.avatarUrl} alt="User" className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-800 group-hover:ring-indigo-500 transition-all" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-indigo-600">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser.role.replace('_', ' ')}</p>
                </div>
             </button>
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white font-bold">I</div>
             <span className="font-bold">{currentTenant.name}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Nav Drawer (Overlay) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
             <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl ${
                        activeTab === item.id ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <item.icon size={20} />
                      {item.label}
                    </button>
                  ))}
                  
                  <div className="my-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                     <button
                        onClick={() => { onNavigate('profile'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400"
                      >
                        <Users size={20} />
                        My Profile
                      </button>
                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400"
                      >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </button>
                  </div>

                  <button
                    onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 mt-4 border-t border-slate-100 dark:border-slate-800"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </nav>
             </div>
          </div>
        )}

        {/* Top Bar (Desktop) - Search & Notifications & Theme */}
        <header className="hidden md:flex h-16 bg-transparent items-center justify-between px-8 py-4">
           <div className="flex-1 max-w-md">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search across all businesses & stokvels..." 
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 dark:text-white rounded-full border-none shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
             </div>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="relative p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
           </div>
        </header>

        {/* Page Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-between items-center z-40 safe-area-pb">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'fill-current opacity-20' : ''} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
