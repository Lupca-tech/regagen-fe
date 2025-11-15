import React, { useState, useEffect } from 'react';
import type { User } from '../../services/firebaseService';
import { getProjects, getBrandVoiceProfiles, saveAIVisibilitySettings } from '../../services/firebaseService';
import type { AIVisibilitySettings, Project, BrandVoiceProfile } from '../../types';
import { XIcon } from '../Icons';

// --- PROPS ---
interface SettingsFormProps {
    user: User;
    onSave: (settings: AIVisibilitySettings) => void;
    initialSettings?: AIVisibilitySettings | null;
}

// --- MAIN COMPONENT ---
export const SettingsForm: React.FC<SettingsFormProps> = ({ user, onSave, initialSettings }) => {
    const [formData, setFormData] = useState({
        brandName: initialSettings?.brandName || '',
        domain: initialSettings?.domain || '',
        competitors: initialSettings?.competitors || ['', '', ''],
        projectId: initialSettings?.projectId || '',
        brandVoiceProfileId: initialSettings?.brandVoiceProfileId || '',
    });
    const [keywords, setKeywords] = useState<string[]>(initialSettings?.keywords || []);
    const [keywordInput, setKeywordInput] = useState('');
    
    const [projects, setProjects] = useState<Project[]>([]);
    const [brandVoices, setBrandVoices] = useState<BrandVoiceProfile[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([getProjects(user.uid), getBrandVoiceProfiles(user.uid)])
            .then(([userProjects, userBrandVoices]) => {
                setProjects(userProjects);
                setBrandVoices(userBrandVoices);
            })
            .catch(err => setError(err.message || 'Failed to load projects or brand voices.'));
    }, [user.uid]);

    useEffect(() => {
        if (formData.projectId) {
            const selectedProject = projects.find(p => p.id === formData.projectId);
            if (selectedProject && !initialSettings?.brandName) { // Only auto-fill if brand name wasn't pre-set
                setFormData(prev => ({...prev, brandName: selectedProject.name}));
            }
        }
    }, [formData.projectId, projects, initialSettings]);

    const handleCompetitorChange = (index: number, value: string) => {
        setFormData(prev => {
            const newCompetitors = [...prev.competitors];
            newCompetitors[index] = value;
            return { ...prev, competitors: newCompetitors };
        });
    };
    
    const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newKeyword = keywordInput.trim();
            if (newKeyword && !keywords.includes(newKeyword) && keywords.length < 10) {
                setKeywords([...keywords, newKeyword]);
                setKeywordInput('');
            }
        }
    };
    
    const removeKeyword = (keywordToRemove: string) => {
        setKeywords(keywords.filter(k => k !== keywordToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!formData.brandName.trim()) { setError('Brand name is required.'); return; }
        if (!formData.domain.trim()) { setError('Domain is required.'); return; }
        const competitorArray = formData.competitors.filter(Boolean);
        if (competitorArray.length < 3 || competitorArray.length > 5) { setError('Please enter between 3 and 5 competitors.'); return; }
        if (keywords.length < 5 || keywords.length > 10) { setError('Please enter between 5 and 10 keywords.'); return; }

        setIsLoading(true);
        const newSettings: AIVisibilitySettings = {
            userId: user.uid,
            brandName: formData.brandName,
            domain: formData.domain,
            keywords,
            competitors: competitorArray,
            projectId: formData.projectId || undefined,
            brandVoiceProfileId: formData.brandVoiceProfileId || undefined,
        };
        try {
            await saveAIVisibilitySettings(user.uid, newSettings);
            onSave(newSettings);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="max-w-3xl mx-auto bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-2">Setup AI Visibility Tracking</h2>
            <p className="text-zinc-400 text-center mb-8">Tell us what to track. Our AI will scan public LLMs daily and report back.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={formData.projectId} onChange={e => setFormData(p => ({...p, projectId: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2">
                        <option value="">Link to a Project (Optional)</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={formData.brandVoiceProfileId} onChange={e => setFormData(p => ({...p, brandVoiceProfileId: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2">
                        <option value="">Link to a Brand Voice (Optional)</option>
                        {brandVoices.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="brandName" className="block text-sm font-medium text-zinc-300 mb-2">Your Brand</label>
                        <input id="brandName" type="text" value={formData.brandName} onChange={e => setFormData(p => ({...p, brandName: e.target.value}))} placeholder="e.g., RageGen" className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2" />
                    </div>
                     <div>
                        <label htmlFor="domain" className="block text-sm font-medium text-zinc-300 mb-2">Your Domain</label>
                        <input id="domain" type="url" value={formData.domain} onChange={e => setFormData(p => ({...p, domain: e.target.value}))} placeholder="https://ragegen.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Your Competitors (3-5)</label>
                    <div className="space-y-3">
                        {formData.competitors.map((c, i) => (
                             <input key={i} type="text" value={c} onChange={e => handleCompetitorChange(i, e.target.value)} placeholder={`Competitor ${i + 1} Name`} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2" />
                        ))}
                    </div>
                </div>
                 <div>
                    <label htmlFor="keywords" className="block text-sm font-medium text-zinc-300 mb-2">Strategic Keywords/Questions (5-10)</label>
                    <div className="bg-zinc-800 border border-zinc-700 rounded-md p-2 flex flex-wrap gap-2">
                         {keywords.map(k => (
                             <div key={k} className="bg-pink-600/50 text-pink-200 text-sm font-semibold px-2 py-1 rounded-md flex items-center gap-2">
                                 <span>{k}</span>
                                 <button type="button" onClick={() => removeKeyword(k)} className="text-pink-200 hover:text-white" aria-label={`Remove ${k} keyword`}><XIcon className="w-4 h-4" /></button>
                             </div>
                         ))}
                         <input 
                            id="keywords"
                            type="text"
                            value={keywordInput}
                            onChange={e => setKeywordInput(e.target.value)}
                            onKeyDown={handleKeywordKeyDown}
                            placeholder={keywords.length === 0 ? "Type a keyword and press Enter..." : ''}
                            className="bg-transparent outline-none flex-grow"
                            aria-label="Add a strategic keyword"
                         />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                 <div className="flex justify-center pt-4">
                    <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">
                        {isLoading ? 'Saving...' : 'Start Tracking'}
                    </button>
                </div>
            </form>
        </div>
    );
};
