
import React, { useState, useEffect, useCallback } from 'react';
import { User, getBrandVoiceProfiles, addBrandVoiceProfile, updateBrandVoiceProfile, deleteBrandVoiceProfile } from '../services/firebaseService';
import { BrandVoiceProfile } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, SkeletonItem } from './Icons';
import { BrandVoiceEditor } from './brand-voice/BrandVoiceEditor';

interface BrandVoiceDashboardProps {
    user: User;
}

export const BrandVoiceDashboard: React.FC<BrandVoiceDashboardProps> = ({ user }) => {
    const [profiles, setProfiles] = useState<BrandVoiceProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingProfile, setEditingProfile] = useState<Partial<BrandVoiceProfile> | null>(null);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBrandVoiceProfiles(user.uid);
            setProfiles(data);
        } catch (e: any) {
            setError(e.message || "Failed to load profiles.");
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        if (!editingProfile) {
            fetchProfiles();
        }
    }, [editingProfile, fetchProfiles]);

    const handleSave = useCallback(async (profileData: Partial<BrandVoiceProfile>) => {
        setError(null);
        try {
            if (profileData.id) {
                await updateBrandVoiceProfile(profileData.id, profileData);
            } else {
                const { id, ...dataToAdd } = profileData;
                const newProfile: Omit<BrandVoiceProfile, 'id' | 'createdAt'> = {
                    userId: user.uid,
                    name: dataToAdd.name || 'Untitled',
                    toneAndManner: dataToAdd.toneAndManner || '',
                    vocabularyLevel: dataToAdd.vocabularyLevel || '',
                    sentenceStructure: dataToAdd.sentenceStructure || '',
                    dos: dataToAdd.dos || [],
                    donts: dataToAdd.donts || [],
                };
                await addBrandVoiceProfile(newProfile);
            }
            setEditingProfile(null);
        } catch (e: any) {
            setError(e.message || "Failed to save profile.");
            throw e; 
        }
    }, [user.uid]);

    const handleDelete = useCallback(async (profileId: string) => {
        if (!window.confirm("Are you sure you want to delete this brand voice profile?")) return;
        setError(null);
        try {
            await deleteBrandVoiceProfile(profileId);
            fetchProfiles();
        } catch (e: any) {
            setError(e.message || "Failed to delete profile.");
        }
    }, [fetchProfiles]);

    if (editingProfile) {
        return <BrandVoiceEditor user={user} initialProfile={editingProfile} onSave={handleSave} onCancel={() => setEditingProfile(null)} />;
    }

    return (
        <div className="animate-fade-in-fast space-y-6">
             {error && <div className="bg-red-900/20 text-red-300 p-3 rounded-md border border-red-500/30">{error}</div>}
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <p className="text-zinc-400">Manage your brand voices to ensure consistent content generation.</p>
                <button onClick={() => setEditingProfile({})} className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors">
                    <PlusIcon className="w-4 h-4"/> Create New Profile
                </button>
            </div>
             {loading && <div className="space-y-2">{Array.from({length: 3}).map((_, i) => <SkeletonItem key={i} />)}</div>}
             {!loading && profiles.length === 0 && <p className="text-center text-zinc-500 py-12">No brand voice profiles found. Create one to get started!</p>}
             <div className="space-y-3">
                 {profiles.map(profile => (
                     <div key={profile.id} className="bg-zinc-900/50 p-4 rounded-lg flex justify-between items-center">
                         <span className="font-bold text-zinc-200">{profile.name}</span>
                         <div className="flex items-center gap-2">
                             <button onClick={() => setEditingProfile(profile)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                             <button onClick={() => handleDelete(profile.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};
