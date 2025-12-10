import React, { useState, useEffect } from 'react';
import { getEmails, sendEmail as sendEmailFirestore, getTenantEmailSettings } from '../services/firestore'; // Use Firestore functions
import { EmailMessage, EmailTemplate, EmailSettings } from '../types';
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
  Reply,
  Mail,
  AlertCircle,
  FileText,
  Paperclip
} from 'lucide-react';

export const Inbox: React.FC = () => {
  const { currentTenant, addToast } = useUI();
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT'>('INBOX');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]); // New state for templates
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    const loadEmailsAndTemplates = async () => {
      setIsLoading(true);
      try {
        if (!currentTenant?.id) {
          setEmails([]);
          setEmailTemplates([]);
          setIsLoading(false);
          return;
        }
        // Fix: Call getEmails with tenantId
        const fetchedEmails = await getEmails(currentTenant.id);
        setEmails(fetchedEmails);

        // Fix: Call getTenantEmailSettings with tenantId
        const emailSettings = await getTenantEmailSettings(currentTenant.id);
        setEmailTemplates(emailSettings?.templates || []);
      } catch (error) {
        console.error("Failed to load emails or templates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmailsAndTemplates();
  }, [currentTenant?.id, isRefreshing]); // Refresh when tenant changes or manual refresh

  const filteredEmails = emails.filter(email => 
    email.folder === activeFolder && 
    (email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     email.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     email.body?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Data will re-fetch via useEffect when isRefreshing state changes
  };

  const handleSelectEmail = (id: string) => {
      setSelectedEmailId(id);
      // Mark as read in UI state (Firestore update is optional for a simple inbox)
      setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'READ' } : e));
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tplId = e.target.value;
    const tpl = emailTemplates.find(t => t.id === tplId);
    if (tpl) {
      // Basic variable replacement for preview
      let body = tpl.body;
      body = body.replace(/{{customerName}}/g, 'Valued Customer');
      body = body.replace(/{{amount}}/g, 'R 123.45');
      body = body.replace(/{{date}}/g, new Date().toLocaleDateString());

      setComposeData(prev => ({
        ...prev,
        subject: tpl.subject,
        body: body
      }));
    }
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      addToast('Please fill all fields', 'error');
      return;
    }

    if (!currentTenant?.id) {
      addToast('Tenant ID not available for sending email', 'error');
      return;
    }

    const newEmail: EmailMessage = {
      id: `em_${Date.now()}`,
      from: currentTenant.email || 'no-reply@inala.com', // Use tenant's email
      fromName: currentTenant.name,
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      timestamp: new Date().toISOString(),
      status: 'SENT',
      folder: 'SENT'
    };

    try {
      // Fix: Call sendEmailFirestore with tenantId
      await sendEmailFirestore(currentTenant.id, newEmail); // Send to Firestore
      setEmails(prev => [newEmail, ...prev]);
      setShowCompose(false);
      setComposeData({ to: '', subject: '', body: '' });
      addToast('Email sent successfully', 'success');
    } catch (error) {
      console.error("Failed to send email:", error);
      addToast('Failed to send email', 'error');
    }
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

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
        <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Mail className="text-indigo-600" /> System Mailbox
                </h2>
                <p className="text-slate-500 text-sm">{currentTenant?.email || 'N/A'} • IMAP Synced</p>
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
                         {emails.filter(e => e.folder === 'SENT').length > 0 && (
                             <span className="text-slate-500 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                 {emails.filter(e => e.folder === 'SENT').length}
                             </span>
                         )}
                     </button>
                     <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                         <Star size={18} /> Starred
                     </button>
                     <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                         <Trash2 size={18} /> Trash
                     </button>
                 </div>
             </div>
             
             {/* Email List */}
             <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search mail..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredEmails.map(email => (
                        <div 
                            key={email.id}
                            onClick={() => handleSelectEmail(email.id)}
                            className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedEmailId === email.id ? 'bg-indigo-50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'} ${email.status === 'UNREAD' ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-sm truncate pr-2 ${email.status === 'UNREAD' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                    {email.fromName || email.from}
                                </h4>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                    {new Date(email.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <p className={`text-sm mb-1 truncate ${email.status === 'UNREAD' ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                {email.subject}
                            </p>
                            <p className="text-xs text-slate-400 line-clamp-2">
                                {email.body}
                            </p>
                        </div>
                    ))}
                    {filteredEmails.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No messages found.
                        </div>
                    )}
                </div>
             </div>

             {/* Email Detail View */}
             <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col h-full overflow-hidden">
                 {selectedEmail ? (
                     <>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                             <div>
                                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedEmail.subject}</h3>
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                         {(selectedEmail.fromName || selectedEmail.from).charAt(0)}
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-slate-900 dark:text-white">
                                             {selectedEmail.fromName} <span className="text-slate-500 font-normal">&lt;{selectedEmail.from}&gt;</span>
                                         </p>
                                         <p className="text-xs text-slate-500">
                                             To: {selectedEmail.to} • {new Date(selectedEmail.timestamp).toLocaleString()}
                                         </p>
                                     </div>
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <Button variant="outline" size="sm" onClick={handleReply}>
                                     <Reply size={16} className="mr-2"/> Reply
                                 </Button>
                                 <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                                     <Trash2 size={16}/>
                                 </Button>
                             </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {selectedEmail.body}
                        </div>
                     </>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <Mail size={48} className="mb-4 opacity-20"/>
                         <p>Select an email to read</p>
                     </div>
                 )}
             </div>
        </div>

        {/* Compose Modal */}
        <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Email" size="lg">
            <div className="space-y-4 pt-2">
                {emailTemplates.length > 0 && (
                  <div className="flex justify-end">
                    <select className="text-sm border rounded p-1 dark:bg-slate-800 dark:border-slate-700" onChange={handleTemplateSelect} defaultValue="">
                      <option value="" disabled>Load Template...</option>
                      {emailTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                    <label className="text-sm font-medium">To</label>
                    <input 
                        type="email" 
                        value={composeData.to}
                        onChange={e => setComposeData({...composeData, to: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="recipient@example.com"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Subject</label>
                    <input 
                        type="text" 
                        value={composeData.subject}
                        onChange={e => setComposeData({...composeData, subject: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Subject line"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Message</label>
                    <textarea 
                        value={composeData.body}
                        onChange={e => setComposeData({...composeData, body: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 h-64 resize-none"
                        placeholder="Type your message here..."
                    />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <Button variant="ghost" size="sm" className="text-slate-500">
                        <Paperclip size={16} className="mr-2"/> Attach Files
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowCompose(false)}>Discard</Button>
                        <Button onClick={handleSendEmail} className="bg-indigo-600 text-white">
                            <Send size={16} className="mr-2"/> Send Email
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
  );
};