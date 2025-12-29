
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  Users, Search, Edit2, Globe, Phone, Mail, 
  Calendar, CheckCircle2, UserPlus, ArrowRight, ShieldCheck,
  Building2, Layers
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/db';
import { Person, TenantPersonLink, UserRole } from '../types';
import { sanitizeData, updateGlobalPerson } from '../services/firestore';
import { useUI } from '../context/UIContext';

export const GlobalPeople: React.FC = () => {
  const { addToast, currentUser } = useUI();
  const [people, setPeople] = useState<Person[]>([]);
  const [links, setLinks] = useState<TenantPersonLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editData, setEditData] = useState<Partial<Person>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const pSnap = await getDocs(query(collection(db, 'people'), orderBy('updatedAt', 'desc'), limit(50)));
        const lSnap = await getDocs(collection(db, 'tenant_person_links'));
        
        setPeople(pSnap.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) } as Person)));
        setLinks(lSnap.docs.map(d => ({ id: d.id, ...sanitizeData(d.data()) } as TenantPersonLink)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdate = async () => {
    if (!selectedPerson) return;
    try {
        await updateGlobalPerson(selectedPerson.id, editData);
        setPeople(prev => prev.map(p => p.id === selectedPerson.id ? { ...p, ...editData } : p));
        addToast('Profile updated globally.', 'success');
        setShowEditModal(false);
    } catch (err) {
        addToast('Update failed.', 'error');
    }
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== UserRole.SUPER_ADMIN) {
      return <div className="p-12 text-center text-slate-400">Restricted to Super Administrators.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe size={24} className="text-indigo-500" /> Global People Registry
                </h2>
                <p className="text-sm text-slate-500">Manage unique human records shared across all business units.</p>
            </div>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search master records..." 
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <Card noPadding>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Full Name</th>
                            <th className="px-6 py-4">Contact Info</th>
                            <th className="px-6 py-4 text-center">Entity Links</th>
                            <th className="px-6 py-4">Registry Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredPeople.map(p => {
                            const pLinks = links.filter(l => l.personId === p.id);
                            return (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-indigo-500">
                                                {p.name.charAt(0)}
                                            </div>
                                            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Phone size={12}/> {p.phone}</div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Mail size={12}/> {p.email || 'No Email'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                            {pLinks.length} Active Links
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedPerson(p); setEditData(p); setShowEditModal(true); }}>
                                            <Edit2 size={14}/>
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>

        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Global Profile Update">
            <div className="space-y-4 pt-2">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl flex items-start gap-2">
                    <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-300">
                        Editing this profile will update details across all businesses and stokvels this person belongs to.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Legal Name</label>
                    <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border-none" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                        <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border-none" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email (Primary)</label>
                        <input className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border-none" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} />
                    </div>
                </div>

                <Button className="w-full h-12 font-bold" onClick={handleUpdate}>Synchronize Changes</Button>
            </div>
        </Modal>
    </div>
  );
};
