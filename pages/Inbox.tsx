
import React, { useState } from 'react';
import { MOCK_EMAILS } from '../services/mockData';
import { EmailMessage } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Inbox as InboxIcon, 
  Send, 
  Search, 
  RefreshCw, 
  Star, 
  Trash2, 
  MoreHorizontal,
  Reply,
  Forward,
  ChevronLeft,
  ChevronRight,
  Mail,
  AlertCircle
} from 'lucide-react';

export const Inbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT'>('INBOX');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<EmailMessage[]>(MOCK_EMAILS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredEmails = emails.filter(email => 
    email.folder === activeFolder && 
    (email.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
     email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
     email.body.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate IMAP fetch delay
    setTimeout(() => {
        setIsRefreshing(false);
        // Simulate a new email arrival sometimes
        if (Math.random() > 0.5) {
             const newEmail: EmailMessage = {
                id: `em_${Date.now()}`,
                from: 'notifications@inala.holdings',
                fromName: 'System Alert',
                to: 'inala.holdingz@gmail.com',
                subject: 'New User Registration',
                body: 'A new user has requested access to the platform. Please review permissions.',
                timestamp: new Date().toISOString(),
                status: 'UNREAD',
                folder: 'INBOX'
             };
             setEmails(prev => [newEmail, ...prev]);
        }
    }, 1500);
  };

  const handleSelectEmail = (id: string) => {
      setSelectedEmailId(id);
      // Mark as read
      setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'READ' } : e));
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
        <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Mail className="text-indigo-600" /> System Mailbox
                </h2>
                <p className="text-slate-500 text-sm">inala.holdingz@gmail.com • IMAP Synced</p>
             </div>
             <Button onClick={handleRefresh} isLoading={isRefreshing} variant="outline" className="bg-white dark:bg-slate-800">
                 <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Mail
             </Button>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex">
             {/* Sidebar Folders */}
             <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4">
                 <Button className="w-full mb-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                     <Send size={16} className="mr-2" /> Compose
                 </Button>

                 <div className="space-y-1">
                     <button 
                        onClick={() => { setActiveFolder('INBOX'); setSelectedEmailId(null); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'INBOX' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                     >
                         <div className="flex items-center gap-3">
                             <InboxIcon size={18} /> Inbox
                         </div>
                         {emails.filter(e => e.folder === 'INBOX' && e.status === 'UNREAD').length > 0 && (
                             <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                 {emails.filter(e => e.folder === 'INBOX' && e.status === 'UNREAD').length}
                             </span>
                         )}
                     </button>
                     <button 
                        onClick={() => { setActiveFolder('SENT'); setSelectedEmailId(null); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'SENT' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                     >
                         <div className="flex items-center gap-3">
                             <Send size={18} /> Sent
                         </div>
                     </button>
                     <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                         <div className="flex items-center gap-3">
                             <AlertCircle size={18} /> Spam
                         </div>
                     </button>
                     <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                         <div className="flex items-center gap-3">
                             <Trash2 size={18} /> Trash
                         </div>
                     </button>
                 </div>
             </div>

             {/* Email List */}
             <div className="w-80 md:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                     <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input 
                            type="text" 
                            placeholder="Search mail..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                         />
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                     {filteredEmails.length === 0 ? (
                         <div className="p-8 text-center text-slate-400 text-sm">
                             No emails found.
                         </div>
                     ) : (
                         filteredEmails.map(email => (
                             <div 
                                key={email.id}
                                onClick={() => handleSelectEmail(email.id)}
                                className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedEmailId === email.id ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200' : ''} ${email.status === 'UNREAD' ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'}`}
                             >
                                 <div className="flex justify-between items-start mb-1">
                                     <span className={`text-sm truncate max-w-[180px] ${email.status === 'UNREAD' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                         {email.fromName || email.from}
                                     </span>
                                     <span className="text-xs text-slate-400 whitespace-nowrap">
                                         {new Date(email.timestamp).toLocaleDateString()}
                                     </span>
                                 </div>
                                 <h4 className={`text-sm mb-1 truncate ${email.status === 'UNREAD' ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                     {email.subject}
                                 </h4>
                                 <p className="text-xs text-slate-400 line-clamp-2">
                                     {email.body}
                                 </p>
                             </div>
                         ))
                     )}
                 </div>
             </div>

             {/* Email Detail View */}
             <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900">
                 {selectedEmail ? (
                     <>
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><Trash2 size={18}/></button>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><Star size={18}/></button>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><MoreHorizontal size={18}/></button>
                            </div>
                            <div className="flex gap-2 text-slate-400">
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={18}/></button>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={18}/></button>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {selectedEmail.subject}
                                </h2>
                                <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    {selectedEmail.folder}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                                    {(selectedEmail.fromName || selectedEmail.from).charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                        {selectedEmail.fromName} 
                                        <span className="font-normal text-slate-500 text-sm ml-2">&lt;{selectedEmail.from}&gt;</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        to {selectedEmail.to} • {new Date(selectedEmail.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {selectedEmail.body}
                            </div>
                            
                            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex gap-4">
                                <Button variant="outline" className="gap-2">
                                    <Reply size={16} /> Reply
                                </Button>
                                <Button variant="outline" className="gap-2">
                                    <Forward size={16} /> Forward
                                </Button>
                            </div>
                        </div>
                     </>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <Mail size={48} className="mb-4 opacity-20" />
                         <p className="text-lg font-medium">Select an email to read</p>
                     </div>
                 )}
             </div>
        </div>
    </div>
  );
};
