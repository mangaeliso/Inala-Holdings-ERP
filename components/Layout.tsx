
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Users, CreditCard, FileText, Settings, Menu, Bell, Search, LogOut,
  Store, RefreshCw, Mail, User as UserIcon, Sun, Moon, ChevronRight, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Tenant, User } from '../types';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  children, activeTab, onNavigate, currentUser, currentTenant, onLogout, isDarkMode, toggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { addToast } = useUI();
  
  // Dynamic Logo Logic (Use tenant logo if available, else initial)
  const displayLogo = currentTenant.logoUrl || "https://ui-avatars.com/api/?name=Inala+Holdings&background=0f172a&color=fff&size=128&bold=true";

  // Navigation Config
  const globalNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'businesses', label: 'Businesses', icon: Store },
    { id: 'stokvels', label: 'Stokvels', icon: Users },
    { id: 'exchange', label: 'Exchange', icon: RefreshCw },
    { id: 'inbox', label: 'Inbox', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const tenantNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS / Sales', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: FileText },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = currentUser.tenantId === 'GLOBAL' ? globalNavItems : tenantNavItems;

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
            className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shrink-0 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => onNavigate('dashboard')}
          >
             <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
          </motion.div>
          
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="font-bold text-lg tracking-tight truncate">{currentTenant.name}</h1>
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
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-indigo-600' 
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
                    className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" 
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
                    <img src={currentUser.avatarUrl} alt="User" className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-800 group-hover:ring-indigo-500 transition-all" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{currentUser.name}</p>
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
             <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
             </div>
             <span className="font-bold text-sm">{currentTenant.name}</span>
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
                                activeTab === item.id ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'text-slate-600 dark:text-slate-400'
                            }`}
                            >
                            <item.icon size={20} />
                            {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                         <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <img src={currentUser.avatarUrl} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-bold text-sm">{currentUser.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{currentUser.role.replace('_', ' ').toLowerCase()}</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                             <button onClick={toggleTheme} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium">
                                 {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>} Theme
                             </button>
                             <button onClick={onLogout} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                                 <LogOut size={18}/> Logout
                             </button>
                         </div>
                    </div>
                 </motion.div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-20 items-center justify-between px-8 py-4 sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
           <div className="flex-1 max-w-md">
             {/* Breadcrumb-ish indicator */}
             <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                 <span className="hover:text-indigo-500 cursor-pointer">App</span>
                 <ChevronRight size={12} />
                 <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{activeTab}</span>
             </div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize tracking-tight">{activeTab}</h2>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search..." 
                     className="w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm transition-all"
                   />
              </div>

              <button 
                onClick={toggleTheme}
                className="p-2.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button className="relative p-2.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              </button>
           </div>
        </header>

        {/* Scrollable Content */}
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
