import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, UserRole } from '../types';
import { Camera, Mail, Phone, Lock, User as UserIcon, Save } from 'lucide-react';

interface ProfileProps {
  user: User;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: '+27 82 555 1234', // Mock default
    role: user.role
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
        setIsSaving(false);
        setIsEditing(false);
        // In a real app, this would dispatch an update to the backend
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h2>
                <p className="text-slate-500 text-sm">Manage your account settings and preferences.</p>
            </div>
            {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="md:col-span-1 flex flex-col items-center text-center p-6">
                <div className="relative mb-4 group cursor-pointer">
                    <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-800 object-cover" />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
                <span className="inline-block px-3 py-1 mt-2 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                    {user.role.replace('_', ' ')}
                </span>
                <p className="text-sm text-slate-500 mt-4">
                    Member since Nov 2024
                </p>
            </Card>

            {/* Details Form */}
            <Card className="md:col-span-2">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.role} 
                                    disabled={true}
                                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    value={formData.email} 
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="tel" 
                                    value={formData.phone} 
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                         <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4">Security</h3>
                         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                     <Lock size={20} />
                                 </div>
                                 <div>
                                     <p className="font-medium text-sm">Password</p>
                                     <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                                 </div>
                             </div>
                             <Button variant="outline" size="sm" disabled={!isEditing}>Change Password</Button>
                         </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end gap-3 pt-6">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave} isLoading={isSaving}>
                                <Save size={18} className="mr-2" /> Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    </div>
  );
};