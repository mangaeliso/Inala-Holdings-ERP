
import React, { useState } from 'react';
import { INITIAL_EMAILS, INITIAL_EMAIL_TEMPLATES, sendMockEmail } from '../services/mockData';
import { EmailMessage } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useUI } from '../context/UIContext';
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
  AlertCircle,
  FileText,
  Paperclip
} from 'lucide-react';

export const Inbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT'>('INBOX');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<EmailMessage[]>(INITIAL_EMAILS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addToast } = useUI();

  // Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });

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
             addToast('New email received', 'info');
        }
    }, 1500);
  };

  const handleSelectEmail = (id: string) => {
      setSelectedEmailId(id);
      // Mark as read
      setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'READ' } : e));
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tplId = e.target.value;
    const tpl = INITIAL_EMAIL_TEMPLATES.find(t => t.id === tplId);
    if (tpl) {
      setComposeData(prev => ({
        ...prev,
        subject: tpl.subject,
        body: tpl.body
      }));
    }
  };

  const handleSendEmail = () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      addToast('Please fill all fields', 'error');
      return;
    }

    const newEmail = sendMockEmail({
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body
    });

    setEmails(prev => [newEmail, ...prev]);
    setShowCompose(false);
    setComposeData({ to: '', subject: '', body: '' });
    addToast('Email sent successfully', 'success');
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setComposeData({
      to: selectedEmail.from,
      subject: `Re: ${selectedEmail.subject}`,
      body: `\n\n> On ${new Date(selectedEmail.timestamp).toLocaleString()}, ${selectedEmail.fromName || selectedEmail.from} wrote:\n> ${selectedEmail.body}`
    });
    setShowCompose(true);
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
                 <Button onClick={() => setShowCompose(true)} className="w-full mb-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
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
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {filteredEmails.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No emails found</div>
                    ) : (
                        filteredEmails.map(email => (
                            <button
                                key={email.id}
                                onClick={() => handleSelectEmail(email.id)}
                                className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedEmailId === email.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'} ${email.status === 'UNREAD' ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className={`text-sm truncate flex-1 pr-2 ${email.status === 'UNREAD' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                        {email.fromName || email.from}
                                    </span>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {new Date(email.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className={`text-sm mb-1 truncate ${email.status === 'UNREAD' ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {email.subject}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-2">
                                    {email.body}
                                </p>
                            </button>
                        ))
                    )}
                 </div>
             </div>

             {/* Email Detail */}
             <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col min-w-0">
                 {selectedEmail ? (
                     <>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-start">
                             <div>
                                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedEmail.subject}</h2>
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold">
                                         {(selectedEmail.fromName || selectedEmail.from).charAt(0)}
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-slate-900 dark:text-white">
                                             {selectedEmail.fromName} <span className="font-normal text-slate-500 text-xs">&lt;{selectedEmail.from}&gt;</span>
                                         </p>
                                         <p className="text-xs text-slate-400">
                                             to {selectedEmail.to} • {new Date(selectedEmail.timestamp).toLocaleString()}
                                         </p>
                                     </div>
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full" title="Star"><Star size={16}/></Button>
                                 <Button onClick={handleReply} variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full" title="Reply"><Reply size={16}/></Button>
                                 <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-full" title="Delete"><Trash2 size={16}/></Button>
                             </div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-900 m-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                             <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                                 {selectedEmail.body}
                             </div>
                        </div>
                     </>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <Mail size={48} className="mb-4 opacity-50" />
                         <p className="text-lg font-medium">Select an email to read</p>
                     </div>
                 )}
             </div>
        </div>

        {/* Compose Modal */}
        <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Email" size="lg">
            <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">To</label>
                        <input 
                            type="email" 
                            value={composeData.to}
                            onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="recipient@example.com"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Load Template</label>
                        <select 
                            onChange={handleTemplateSelect}
                            className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="">Select a template...</option>
                            {INITIAL_EMAIL_TEMPLATES.map(tpl => (
                                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                    <input 
                        type="text" 
                        value={composeData.subject}
                        onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="Email subject"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                    <textarea 
                        value={composeData.body}
                        onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                        className="w-full h-64 px-3 py-3 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none transition-all"
                        placeholder="Write your message..."
                    />
                </div>

                <div className="flex justify-between items-center pt-2">
                    <Button variant="ghost" className="text-slate-500" onClick={() => addToast('Attachment feature coming soon', 'info')}>
                        <Paperclip size={18} className="mr-2" /> Attach File
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setShowCompose(false)}>Discard</Button>
                        <Button onClick={handleSendEmail} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Send size={16} className="mr-2" /> Send Email
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
  );
};