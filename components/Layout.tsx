import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Users, CreditCard, FileText, Settings, Menu, Bell, Search, LogOut,
  Store, RefreshCw, Mail, User as UserIcon, Sun, Moon, ChevronRight, PanelLeftClose, PanelLeftOpen, Upload, Edit,
  X, CheckCircle
} from 'lucide-react';
import { Tenant, User, UserRole } from '../types';
import { useUI } from '../context/UIContext'; // Use globalSettings from UIContext
import { motion, AnimatePresence } from 'framer-motion';
import { updateUser } from '../services/firestore'; // For updating welcome flag

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  currentUser: User;
  currentTenant: Tenant; // This tenant represents the currently "active" tenant context for the user
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onNavigate, currentUser, currentTenant, onLogout, isDarkMode, toggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { addToast, globalSettings, tenantBranding } = useUI(); // Use globalSettings & tenantBranding from UIContext
  
  // Check for welcome tour on mount
  useEffect(() => {
      if (currentUser && currentUser.hasSeenWelcome === false) {
          setShowWelcome(true);
      }
  }, [currentUser]);

  const handleDismissWelcome = async () => {
      setShowWelcome(false);
      // Update user in background
      await updateUser(currentUser.id, { hasSeenWelcome: true });
  };

  // Determine Logo: Tenant Branding > Global Settings > Default
  const displayLogo = tenantBranding?.logoUrl || globalSettings.erpLogoUrl || "https://ui-avatars.com/api/?name=IH&background=0f172a&color=fff&size=128&bold=true";

  // Determine Primary Color: Tenant Branding override > Global Settings > Default
  const primaryBrandColor = tenantBranding?.primaryColor || globalSettings.primaryColor;
  // Determine Secondary Color: Tenant Branding override > Global Settings > Default
  const secondaryBrandColor = tenantBranding?.secondaryColor || globalSettings.secondaryColor;


  // Navigation Config - Global for SuperAdmin
  const globalNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'businesses', label: 'Businesses', icon: Store },
    { id: 'stokvels', label: 'Stokvels', icon: Users },
    { id: 'exchange', label: 'Exchange', icon: RefreshCw },
    { id: 'inbox', label: 'Inbox', icon: Mail },
  ];

  // Tenant-specific navigation items (user's profile, tenant settings)
  const userTenantNavItems = [
    { id: 'profile', label: 'My Profile', icon: UserIcon }
  ];

  let navItems = currentUser.tenantId === 'global' ? globalNavItems : userTenantNavItems;

  // Global ERP Settings for Super Admin only
  if (currentUser.role === UserRole.SUPER_ADMIN) {
      navItems.push({ id: 'global-settings', label: 'ERP Settings', icon: Settings });
  }

  // Inject dynamic CSS variables for theme
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-brand-color', primaryBrandColor);
    document.documentElement.style.setProperty('--secondary-brand-color', secondaryBrandColor);
  }, [primaryBrandColor, secondaryBrandColor]);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="hidden md:flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen z-30"
      >
        <div className="p-6 flex items-center gap-3 relative">
          <motion.div 
            layout
            className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shrink-0 cursor-pointer relative group"
            whileHover={{ scale: 1.05 }}
            onClick={() => onNavigate('dashboard')}
          >
             <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
             
             {/* Logo Upload Provision for Super Admin */}
             {currentUser.role === UserRole.SUPER_ADMIN && (
                 <div 
                    onClick={(e) => { e.stopPropagation(); onNavigate('global-settings'); }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change Logo in Settings"
                 >
                     <Edit size={16} className="text-white" />
                 </div>
             )}
          </motion.div>
          
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="font-bold text-lg tracking-tight truncate">{globalSettings.erpName}</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wider truncate">ERP PLATFORM</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
             onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
             className="absolute -right-3 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-full shadow-sm text-slate-400 hover:text-indigo-600 z-50"
          >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${
                activeTab === item.id 
                  ? 'bg-[var(--primary-brand-color)] text-white shadow-lg shadow-[var(--primary-brand-color)]/20' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'} />
              
              {!isSidebarCollapsed && (
                 <span className="truncate">{item.label}</span>
              )}
              
              {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute left-0 w-1 h-6 rounded-r-full" 
                    style={{ backgroundColor: primaryBrandColor }} // Dynamic indicator color
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
           {!isSidebarCollapsed ? (
               <div className="flex items-center gap-3 px-2 py-2">
                 <button onClick={() => onNavigate('profile')} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                    <img src={currentUser.avatarUrl} alt="User" className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-800 group-hover:ring-[var(--primary-brand-color)] transition-all" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-[var(--primary-brand-color)]">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                 </button>
                 <button onClick={onLogout} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <LogOut size={18} />
                 </button>
               </div>
           ) : (
               <div className="flex flex-col gap-4 items-center">
                   <img src={currentUser.avatarUrl} alt="User" className="w-9 h-9 rounded-full ring-2 ring-white cursor-pointer" onClick={() => onNavigate('profile')} />
                   <button onClick={onLogout} className="text-slate-400 hover:text-red-500"><LogOut size={18}/></button>
               </div>
           )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg overflow-hidden relative group">
                <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
             </div>
             <span className="font-bold text-sm">{globalSettings.erpName}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 md:hidden bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                 <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 p-4 shadow-2xl flex flex-col h-full"
                    onClick={e => e.stopPropagation()}
                 >
                    <div className="flex justify-between items-center mb-6 px-2">
                        <span className="font-bold text-lg">Menu</span>
                        <button onClick={() => setIsMobileMenuOpen(false)}><PanelLeftClose size={24} /></button>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <button
                            key={item.id}
                            onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl ${
                                activeTab === item.id ? 'bg-[var(--primary-brand-color)] text-white' : 'text-slate-600 dark:text-slate-400'
                            }`}
                            >
                            <item.icon size={20} />
                            {item.label}
                            </button>
                        ))}
                    </div>
                    {/* User & Logout for Mobile */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                        <div className="flex items-center gap-3 px-2 py-2">
                            <button onClick={() => { onNavigate('profile'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
                                <img src={currentUser.avatarUrl} alt="User" className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-800" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-[var(--primary-brand-color)]">{currentUser.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{currentUser.role.replace('_', ' ')}</p>
                                </div>
                            </button>
                            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                 </motion.div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Welcome Pop-up */}
        <AnimatePresence>
            {showWelcome && (
                <motion.div 
                    initial={{ opacity: 0, y: -20, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-24 left-6 z-50 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-indigo-100 dark:border-slate-800"
                >
                    <button onClick={handleDismissWelcome} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-4">
                        <CheckCircle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Welcome, {currentUser.name.split(' ')[0]}!</h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                        Welcome to <strong>{globalSettings.erpName}</strong>. Your account is active. 
                        Explore your dashboard to get started with business management.
                    </p>
                    <button 
                        onClick={handleDismissWelcome}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                        Get Started
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 py-4 sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
           <div className="flex-1 max-w-md">
             <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                 <span className="hover:text-[var(--primary-brand-color)] cursor-pointer">App</span>
                 <ChevronRight size={12} />
                 <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{activeTab.replace('-', ' ')}</span>
             </div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary-brand-color)] transition-colors" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search..." 
                     className="w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[var(--primary-brand-color)] outline-none shadow-sm text-sm transition-all"
                   />
              </div>

              <button 
                onClick={toggleTheme}
                className="p-2.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[var(--primary-brand-color)] hover:border-[var(--primary-brand-color)]/20 transition-all"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button className="relative p-2.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-[var(--primary-brand-color)] transition-all">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar">
            <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.3, ease: "easeOut" }}
            >
               {children}
            </motion.div>
        </div>
      </main>
    </div>
  );
};