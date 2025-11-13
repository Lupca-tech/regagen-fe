
import React, { useState, useCallback } from 'react';
import { User } from '../../services/firebaseService';
import { analyzeBrandVoice } from '../../services/geminiService';
import { BrandVoiceProfile } from '../../types';
import { SparkleIcon } from '../Icons';

interface BrandVoiceEditorProps {
    user: User;
    initialProfile: Partial<BrandVoiceProfile>;
    onSave: (profile: Partial<BrandVoiceProfile>) => Promise<void>;
    onCancel: () => void;
}

export const BrandVoiceEditor: React.FC<BrandVoiceEditorProps> = ({ user, initialProfile, onSave, onCancel }) => {
    const [name, setName] = useState(initialProfile.name || '');
    const [samples, setSamples] = useState('');
    const [analyzedProfile, setAnalyzedProfile] = useState<Omit<BrandVoiceProfile, 'id'|'userId'|'name'|'createdAt'>>({
        toneAndManner: initialProfile.toneAndManner || '',
        vocabularyLevel: initialProfile.vocabularyLevel || '',
        sentenceStructure: initialProfile.sentenceStructure || '',
        dos: initialProfile.dos || [],
        donts: initialProfile.donts || [],
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!samples.trim()) {
            setError("Please provide text samples to analyze.");
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await analyzeBrandVoice(samples);
            setAnalyzedProfile(result);
        } catch (e: any) {
            setError(e.message || "Failed to analyze voice.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [samples]);
    
    const handleSave = useCallback(async () => {
        setError(null);
        if (!name.trim()) {
            setError("Profile name is required.");
            return;
        }
        setIsSaving(true);
        try {
            await onSave({ id: initialProfile.id, name, ...analyzedProfile });
        } catch (e: any) {
            setError(e.message || "Failed to save profile. Please try again.");
            setIsSaving(false);
        }
    }, [name, analyzedProfile, initialProfile.id, onSave]);

    const handleListChange = useCallback((key: 'dos' | 'donts', value: string) => {
        setAnalyzedProfile(prev => ({ ...prev, [key]: value.split('\n') }));
    }, []);

    return (
        <div className="bg-zinc-950/70 p-6 rounded-xl border border-zinc-800 animate-fade-in-fast">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-200">{initialProfile.id ? 'Edit' : 'Create'} Brand Voice Profile</h2>
                <button onClick={onCancel} className="text-zinc-400 hover:text-white">&times;</button>
            </div>
            
            {error && <div className="bg-red-900/20 text-red-300 p-3 rounded-md mb-4 border border-red-500/30">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                     <div>
                        <label htmlFor="profileName" className="block text-sm font-medium text-zinc-300 mb-1">Profile Name</label>
                        <input id="profileName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., RageGen Marketing Voice" className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                    <div>
                        <label htmlFor="samples" className="block text-sm font-medium text-zinc-300 mb-1">1. Provide Writing Samples</label>
                        <p className="text-xs text-zinc-500 mb-2">Paste 3-5 examples of your best writing below. More text provides a better analysis.</p>
                        <textarea id="samples" value={samples} onChange={e => setSamples(e.target.value)} rows={12} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" placeholder="Paste your content here..." />
                    </div>
                     <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50">
                        {isAnalyzing ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...</> : <><SparkleIcon /> 2. Analyze & Create Profile</>}
                    </button>
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-zinc-300">3. Refine and Save Profile</h3>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Tone & Manner</label>
                        <input type="text" value={analyzedProfile.toneAndManner} onChange={e => setAnalyzedProfile(prev => ({...prev, toneAndManner: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Vocabulary Level</label>
                        <input type="text" value={analyzedProfile.vocabularyLevel} onChange={e => setAnalyzedProfile(prev => ({...prev, vocabularyLevel: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Sentence Structure</label>
                        <input type="text" value={analyzedProfile.sentenceStructure} onChange={e => setAnalyzedProfile(prev => ({...prev, sentenceStructure: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Do's (one rule per line)</label>
                        <textarea value={analyzedProfile.dos.join('\n')} onChange={e => handleListChange('dos', e.target.value)} rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Don'ts (one rule per line)</label>
                        <textarea value={analyzedProfile.donts.join('\n')} onChange={e => handleListChange('donts', e.target.value)} rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                </div>
            </div>
             <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800 mt-6">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={isSaving || !name.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </div>
    );
};
