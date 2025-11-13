
import React, { useState, useCallback } from 'react';
import {
    User,
    updateUserDisplayName,
    sendPasswordReset,
    deleteUserAccount,
    signOutUser
} from '../../services/firebaseService';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-xl font-bold text-zinc-200 mb-4 pb-4 border-b border-zinc-800">{title}</h3>
        {children}
    </div>
);


export const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleProfileUpdate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await updateUserDisplayName(displayName);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSaving(false);
        }
    }, [displayName]);
    
    const handlePasswordReset = useCallback(async () => {
        setMessage(null);
        try {
             await sendPasswordReset();
             setMessage({ type: 'success', text: `Password reset email sent to ${user.email}.` });
        } catch(error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    }, [user.email]);
    
    const handleDelete = useCallback(async () => {
        setIsDeleting(true);
        setMessage(null);
        try {
            await deleteUserAccount(user.uid);
            await signOutUser();
        } catch(error: any) {
            setMessage({ type: 'error', text: error.message });
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    }, [user.uid]);

    return (
        <div className="space-y-8 animate-fade-in-fast">
            <div>
                <h2 className="text-2xl font-bold text-zinc-200">Account Settings</h2>
                <p className="text-zinc-400 mt-1">Manage your profile and account settings.</p>
            </div>
            
            {message && <div className={`p-3 rounded-md text-sm border ${message.type === 'success' ? 'bg-green-900/30 border-green-500/30 text-green-300' : 'bg-red-900/30 border-red-500/30 text-red-300'}`}>{message.text}</div>}

            <SettingsSection title="Profile Information">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <label htmlFor="displayName" className="text-zinc-400">Display Name</label>
                        <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="sm:col-span-2 w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <label htmlFor="email" className="text-zinc-400">Email Address</label>
                        <input id="email" type="email" value={user.email || ''} disabled className="sm:col-span-2 w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-zinc-500 cursor-not-allowed" />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSaving || displayName === user.displayName} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </SettingsSection>
            
            <SettingsSection title="Security">
                 <div className="flex justify-between items-center">
                     <div>
                        <h4 className="font-semibold text-zinc-300">Password</h4>
                        <p className="text-sm text-zinc-500">Reset your password via email.</p>
                     </div>
                     <button onClick={handlePasswordReset} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Send Reset Link</button>
                 </div>
            </SettingsSection>
            
            <div className="bg-red-900/20 p-6 rounded-xl border-2 border-red-500/30 space-y-4">
                <h3 className="text-xl font-bold text-red-300">Danger Zone</h3>
                <div className="flex justify-between items-center">
                     <div>
                        <h4 className="font-semibold text-red-300">Delete Account</h4>
                        <p className="text-sm text-red-400/80">Permanently delete your account and all content. This action cannot be undone.</p>
                     </div>
                     <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete Account</button>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-red-500/50 shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-center text-red-400">Are you sure?</h2>
                        <p className="text-zinc-400 text-center my-4">
                           This will permanently delete your account, along with all your projects, campaigns, and generated content. This action is irreversible.
                        </p>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
