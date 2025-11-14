import React, { useState, useEffect, useCallback } from 'react';
import { User, getBrandVoiceProfiles } from '../../../services/firebaseService';
import { Topic, EditablePlatform, BrandVoiceProfile } from '../../../types';
import { useGeneration } from '../../../contexts/GenerationContext';
import { WebIcon, FacebookIcon, LinkedInIcon, XIcon, TikTokIcon, YouTubeIcon, SparkleIcon } from '../../Icons';

interface GenerationModalProps {
    topic: Topic;
    user: User;
    onClose: () => void;
    onGenerationSuccess: () => void;
}

const LANGUAGES = [
    { code: 'English', name: 'English' },
    { code: 'Spanish', name: 'Español' },
    { code: 'French', name: 'Français' },
    { code: 'German', name: 'Deutsch' },
    { code: 'Japanese', name: '日本語' },
    { code: 'Chinese', name: '中文' },
    { code: 'Vietnamese', name: 'Tiếng Việt' },
];

const ALL_PLATFORMS: { id: EditablePlatform; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIcon },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
    { id: 'youtube', name: 'YouTube', icon: YouTubeIcon },
];

export const GenerationModal: React.FC<GenerationModalProps> = ({ topic, user, onClose, onGenerationSuccess }) => {
    const { startGeneration } = useGeneration();
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<EditablePlatform>>(new Set(['web', 'facebook', 'tiktok']));
    const [shouldGenerateImage, setShouldGenerateImage] = useState(true);
    const [brandVoiceProfiles, setBrandVoiceProfiles] = useState<BrandVoiceProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('default');
    const [language, setLanguage] = useState('English'); // New state for language

    useEffect(() => {
        getBrandVoiceProfiles(user.uid).then(setBrandVoiceProfiles).catch(console.error);
    }, [user.uid]);

    const handlePlatformToggle = useCallback((platformId: EditablePlatform) => {
        const newSelection = new Set(selectedPlatforms);
        newSelection.has(platformId) ? newSelection.delete(platformId) : newSelection.add(platformId);
        setSelectedPlatforms(newSelection);
    }, [selectedPlatforms]);

    const handleGenerate = useCallback(() => {
        if (!topic.name.trim() || selectedPlatforms.size === 0) return;
        
        const selectedProfile = brandVoiceProfiles.find(p => p.id === selectedProfileId);

        // Fix: Pass parameters inside a unified 'generationContext' object.
        startGeneration({
            id: topic.id,
            topicName: topic.name,
            status: 'queued',
            progress: 0,
            message: 'Queued...',
            context: {
                type: 'content',
                view: 'dashboard',
                params: {
                    topic,
                    userId: user.uid,
                    language, // Pass selected language
                    shouldGenerateImage,
                    selectedPlatforms,
                    generationContext: {
                        user: user,
                        brandVoiceProfile: selectedProfile,
                    },
                    project: { id: topic.projectId }, // Pass project and campaign for saving context
                    campaign: { id: topic.campaignId },
                },
                onSuccess: onGenerationSuccess
            }
        });
        
        onClose();
    }, [topic, user, language, shouldGenerateImage, selectedPlatforms, brandVoiceProfiles, selectedProfileId, startGeneration, onClose, onGenerationSuccess]);
    
    return (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-2">Generate Content</h2>
                <p className="text-zinc-400 text-center mb-6">
                    Configure options for the topic: <span className="font-bold text-pink-400">{topic.name}</span>
                </p>
                <div className="space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative w-full">
                            <label htmlFor="language-select" className="block text-sm font-medium text-zinc-300 mb-1 text-center">Language</label>
                            <select
                                id="language-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full appearance-none px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300"
                                aria-label="Select language"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                        <div className="relative w-full">
                            <label htmlFor="brand-voice-select" className="block text-sm font-medium text-zinc-300 mb-1 text-center">Brand Voice Co-Pilot</label>
                            <select
                                id="brand-voice-select"
                                value={selectedProfileId}
                                onChange={(e) => setSelectedProfileId(e.target.value)}
                                className="w-full appearance-none px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300"
                                aria-label="Select Brand Voice Profile"
                            >
                                <option value="default">Default (None)</option>
                                {brandVoiceProfiles.map((profile) => (
                                <option key={profile.id} value={profile.id}>{profile.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-center text-sm font-semibold text-zinc-300 mb-3">Choose Your Platforms</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {ALL_PLATFORMS.map(platform => {
                                const isSelected = selectedPlatforms.has(platform.id);
                                return (
                                    <button key={platform.id} onClick={() => handlePlatformToggle(platform.id)} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-pink-500 bg-pink-500/10' : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'}`}>
                                        <platform.icon className={`w-6 h-6 mb-1 transition-colors ${isSelected ? 'text-pink-400' : 'text-zinc-400'}`} />
                                        <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{platform.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <label htmlFor="image-toggle-modal" className="flex items-center select-none group cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="image-toggle-modal" className="sr-only" checked={shouldGenerateImage} onChange={(e) => setShouldGenerateImage(e.target.checked)} />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${shouldGenerateImage ? 'bg-pink-600' : 'bg-zinc-700'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${shouldGenerateImage ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-sm transition-colors text-zinc-300 group-hover:text-white">Generate Visual Assets</span>
                        </label>
                    </div>
                     <div className="flex justify-center sm:justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                        <button onClick={handleGenerate} disabled={selectedPlatforms.size === 0} className="flex items-center justify-center px-6 py-2.5 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                           <SparkleIcon className="w-5 h-5 mr-2"/>
                            Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};