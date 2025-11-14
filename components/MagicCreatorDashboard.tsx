import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, getProjects, getAllUserCampaigns, getBrandVoiceProfiles, addProject, addCampaign, addTopic } from '../services/firebaseService';
import { analyzeInputForScaffolding } from '../services/geminiService';
import { Project, Campaign, BrandVoiceProfile, EditablePlatform, GeneratedContent } from '../types';
import { useGeneration } from '../contexts/GenerationContext';
import { MagicWandIcon, WebIcon, FacebookIcon, LinkedInIcon, XIcon, TikTokIcon, YouTubeIcon, SparkleIcon, CheckCircleIcon, ChevronDownIcon, ProjectsIcon, RocketIcon, XCircleIcon } from './Icons';
import { ContentTabs } from './ContentTabs';

// --- PROPS & TYPES ---
interface MagicCreatorDashboardProps {
    user: User | null;
    onOpenAuthModal: () => void;
    onGenerationComplete: (context: { projectId: string; campaignId: string; topicId: string }) => void;
    prefillTopic?: string;
    sourceCalendarEventId?: string;
}

type GenerationStep = {
    key: string;
    label: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    error?: string;
};

type ViewState = 'input' | 'generating' | 'complete';

// --- CONSTANTS ---
const ALL_PLATFORMS: { id: EditablePlatform; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIcon },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
    { id: 'youtube', name: 'YouTube', icon: YouTubeIcon },
];

const LANGUAGES = [
    { code: 'English', name: 'English' },
    { code: 'Vietnamese', name: 'Tiếng Việt' },
    { code: 'Spanish', name: 'Español' },
    { code: 'French', name: 'Français' },
    { code: 'German', name: 'Deutsch' },
    { code: 'Japanese', name: '日本語' },
];

// --- HOOKS ---
const useDebounce = (value: string, delay: number): string => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

// --- REFACTORED SUB-COMPONENTS ---

const GenerationProgress: React.FC<{ steps: GenerationStep[], taskProgress: number, taskMessage: string, onCancel: () => void }> = React.memo(({ steps, taskProgress, taskMessage, onCancel }) => {
    const completedStepsCount = steps.filter(s => s.status === 'complete').length;
    const stepWeight = 100 / steps.length;
    const runningProgress = steps.find(s => s.status === 'running' && s.key === 'content') 
        ? (taskProgress / 100) * stepWeight 
        : 0;
    const overallProgress = (completedStepsCount * stepWeight) + runningProgress;

    return (
        <div className="text-left max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-700 p-6 rounded-xl animate-fade-in">
            <h3 className="text-2xl font-bold text-center mb-4">Your Content is Being Created...</h3>
            
            <div className="w-full bg-zinc-700 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2.5 rounded-full transition-all duration-300 ease-linear" 
                    style={{ width: `${overallProgress}%` }}
                ></div>
            </div>
            <p className="text-center text-sm text-pink-400 font-mono tracking-wider mb-6">{overallProgress.toFixed(0)}% complete</p>

            <ul className="space-y-4">
                {steps.map(step => (
                    <li key={step.key} className="flex items-start gap-4">
                        <div className="flex-shrink-0 pt-1">
                            {step.status === 'complete' && <CheckCircleIcon className="w-6 h-6 text-green-400" />}
                            {step.status === 'running' && <div className="w-6 h-6 border-2 border-t-pink-500 border-zinc-600 rounded-full animate-spin"></div>}
                            {step.status === 'pending' && <div className="w-6 h-6 border-2 border-zinc-600 rounded-full"></div>}
                            {step.status === 'error' && <XCircleIcon className="w-6 h-6 text-red-400" />}
                        </div>
                        <div className="flex-grow">
                            <p className={`font-semibold ${step.status === 'complete' ? 'text-zinc-300' : 'text-zinc-100'}`}>{step.label}</p>
                            {step.status === 'running' && step.key === 'content' && (
                                <div className="mt-2 animate-fade-in-fast">
                                    <p className="text-xs text-zinc-400 mb-1">{taskMessage}</p>
                                    <div className="w-full bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-1.5 rounded-full" style={{ width: `${taskProgress}%`}}></div>
                                    </div>
                                </div>
                            )}
                            {step.status === 'error' && <p className="text-xs text-red-400 mt-1">{step.error}</p>}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="mt-8 text-center">
                <button
                    onClick={onCancel}
                    className="flex items-center justify-center mx-auto px-4 py-2 text-sm font-semibold text-red-400 bg-transparent border border-red-500/50 rounded-lg hover:bg-red-900/30 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-red-500 transition-all duration-300"
                >
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Cancel Generation
                </button>
            </div>
        </div>
    );
});

const GenerationCompleteDisplay: React.FC<{
    result: GeneratedContent;
    topicName: string;
    language: string;
    onNavigate: () => void;
    onReset: () => void;
}> = React.memo(({ result, topicName, language, onNavigate, onReset }) => (
    <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-white">✨ Your Content is <span className="text-pink-400">Ready!</span> ✨</h2>
            <p className="text-zinc-400 mt-2">Review your generated content below, or head to the dashboard to manage it.</p>
        </div>

        <ContentTabs
            content={result}
            topic={topicName}
            language={language}
            onContentUpdate={() => {}} // Read-only view
            isReadOnly={true}
        />

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
                onClick={onNavigate}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
            >
                <ProjectsIcon className="w-5 h-5 mr-2" />
                Go to Dashboard to Manage
            </button>
            <button
                onClick={onReset}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 font-semibold text-pink-300 bg-transparent border-2 border-pink-500/50 rounded-lg hover:bg-pink-900/30 hover:text-white transition-colors"
            >
                <RocketIcon className="w-5 h-5 mr-2" />
                Create Another
            </button>
        </div>
    </div>
));

const PlatformSelector: React.FC<{ selectedPlatforms: Set<EditablePlatform>; onToggle: (id: EditablePlatform) => void; }> = React.memo(({ selectedPlatforms, onToggle }) => (
    <div>
        <h3 className="text-center text-sm font-semibold text-zinc-300 mb-3">Choose Your Platforms</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ALL_PLATFORMS.map(platform => {
                const isSelected = selectedPlatforms.has(platform.id);
                return (
                    <button key={platform.id} onClick={() => onToggle(platform.id)} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-pink-500 bg-pink-500/10' : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'}`}>
                        <platform.icon className={`w-6 h-6 mb-1 transition-colors ${isSelected ? 'text-pink-400' : 'text-zinc-400'}`} />
                        <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{platform.name}</span>
                    </button>
                )
            })}
        </div>
    </div>
));

const ScaffoldingSuggestions: React.FC<{
    isAnalyzing: boolean;
    onCancelAnalysis: () => void;
    scaffold: { projectName: string; campaignName: string; topicName: string; };
    setScaffold: React.Dispatch<React.SetStateAction<{ projectName: string; campaignName: string; topicName: string; }>>;
    projects: Project[];
    filteredCampaigns: Campaign[];
    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;
    selectedCampaignId: string;
    setSelectedCampaignId: (id: string) => void;
}> = React.memo(({ isAnalyzing, onCancelAnalysis, scaffold, setScaffold, projects, filteredCampaigns, selectedProjectId, setSelectedProjectId, selectedCampaignId, setSelectedCampaignId }) => (
    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-zinc-300">AI Structure Suggestions</h3>
            {isAnalyzing && (
                <div className="flex items-center gap-2 animate-fade-in-fast">
                    <div className="w-4 h-4 border-2 border-t-pink-500 border-zinc-600 rounded-full animate-spin"></div>
                    <button onClick={onCancelAnalysis} className="text-xs text-zinc-400 hover:text-white hover:underline pr-1" aria-label="Cancel analysis">Cancel</button>
                </div>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm">
                <option value="__CREATE_NEW__">Create New Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="text" value={scaffold.projectName} onChange={e => setScaffold(s => ({...s, projectName: e.target.value}))} disabled={selectedProjectId !== '__CREATE_NEW__'} placeholder="Project Name..." className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm disabled:opacity-50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)} disabled={selectedProjectId !== '__CREATE_NEW__' && !filteredCampaigns.length} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm disabled:opacity-50">
                <option value="__CREATE_NEW__">Create New Campaign</option>
                {filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="text" value={scaffold.campaignName} onChange={e => setScaffold(s => ({...s, campaignName: e.target.value}))} disabled={selectedCampaignId !== '__CREATE_NEW__'} placeholder="Campaign Name..." className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm disabled:opacity-50" />
        </div>
        <input type="text" value={scaffold.topicName} onChange={e => setScaffold(s => ({...s, topicName: e.target.value}))} placeholder="Topic / Article Title..." className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm" />
    </div>
));

const AdvancedOptions: React.FC<any> = React.memo(({ showAdvanced, ...props }) => (
    <div className={`collapsible-content ${showAdvanced ? 'visible' : ''}`}>
        <div className="space-y-6 pt-2">
            <ScaffoldingSuggestions {...props} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select value={props.language} onChange={e => props.setLanguage(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
                <select value={props.selectedProfileId} onChange={e => props.setSelectedProfileId(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-sm">
                    <option value="default">Default Brand Voice</option>
                    {props.brandVoices.map((p: BrandVoiceProfile) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <PlatformSelector selectedPlatforms={props.selectedPlatforms} onToggle={props.handlePlatformToggle} />
            <div className="flex items-center justify-center">
                <label className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" checked={props.shouldGenerateImage} onChange={e => props.setShouldGenerateImage(e.target.checked)} className="sr-only" />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${props.shouldGenerateImage ? 'bg-pink-600' : 'bg-zinc-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${props.shouldGenerateImage ? 'translate-x-6' : ''}`}></div>
                    </div>
                    <span className="ml-3 text-sm text-zinc-300">Generate Cover Image</span>
                </label>
            </div>
        </div>
    </div>
));

// --- MAIN COMPONENT ---
export const MagicCreatorDashboard: React.FC<MagicCreatorDashboardProps> = ({ user, onOpenAuthModal, onGenerationComplete, prefillTopic, sourceCalendarEventId }) => {
    // --- STATE MANAGEMENT ---
    const [viewState, setViewState] = useState<ViewState>('input');
    const [userInput, setUserInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [scaffold, setScaffold] = useState({ projectName: '', campaignName: '', topicName: '' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('__CREATE_NEW__');
    const [selectedCampaignId, setSelectedCampaignId] = useState('__CREATE_NEW__');
    const [language, setLanguage] = useState('English');
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<EditablePlatform>>(new Set(['web', 'facebook', 'tiktok']));
    const [shouldGenerateImage, setShouldGenerateImage] = useState(true);
    const [selectedProfileId, setSelectedProfileId] = useState('default');
    
    const [projects, setProjects] = useState<Project[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [brandVoices, setBrandVoices] = useState<BrandVoiceProfile[]>([]);
    
    const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
    const [generationResult, setGenerationResult] = useState<{ content: GeneratedContent, context: any } | null>(null);
    const { startGeneration, activeGenerations, cancelGeneration } = useGeneration();
    const generationTask = activeGenerations.find(g => g.context.type === 'content' && g.context.view === 'magicCreator');

    const debouncedUserInput = useDebounce(userInput, 1000);
    const analysisControllerRef = useRef<AbortController | null>(null);

    // --- DATA FETCHING & ANALYSIS ---
    useEffect(() => {
        if (prefillTopic) {
            setUserInput(prefillTopic);
            setScaffold(prev => ({...prev, topicName: prefillTopic}));
        }
    }, [prefillTopic]);

    useEffect(() => {
        if (user) {
            Promise.all([
                getProjects(user.uid),
                getAllUserCampaigns(user.uid),
                getBrandVoiceProfiles(user.uid)
            ]).then(([userProjects, userCampaigns, userBrandVoices]) => {
                setProjects(userProjects);
                setCampaigns(userCampaigns);
                setBrandVoices(userBrandVoices);
            }).catch(console.error);
        }
    }, [user]);
    
    useEffect(() => {
        if (debouncedUserInput.trim().length < 10 || prefillTopic) { // Don't auto-analyze if topic is pre-filled
            analysisControllerRef.current?.abort();
            setIsAnalyzing(false);
            return;
        }

        analysisControllerRef.current?.abort();
        const controller = new AbortController();
        analysisControllerRef.current = controller;

        setIsAnalyzing(true);
        setError(null);

        analyzeInputForScaffolding(debouncedUserInput, controller.signal)
            .then(result => {
                setScaffold(result);
                setIsAnalyzing(false);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("AI analysis error:", err);
                    setError("AI analysis failed. Please try a different input.");
                    setIsAnalyzing(false);
                }
            });

        return () => {
            controller.abort();
        };
    }, [debouncedUserInput, prefillTopic]);


    const filteredCampaigns = useMemo(() => {
        if (selectedProjectId === '__CREATE_NEW__') {
            if (selectedCampaignId !== '__CREATE_NEW__') {
                setSelectedCampaignId('__CREATE_NEW__');
            }
            return [];
        }
        const campaignsForProject = campaigns.filter(c => c.projectId === selectedProjectId);
        if (!campaignsForProject.some(c => c.id === selectedCampaignId)) {
            setSelectedCampaignId('__CREATE_NEW__');
        }
        return campaignsForProject;
    }, [campaigns, selectedProjectId, selectedCampaignId]);


    // --- HANDLERS & HELPERS ---
    const handleCancelAnalysis = useCallback(() => {
        analysisControllerRef.current?.abort();
        setIsAnalyzing(false);
    }, []);

    const handlePlatformToggle = useCallback((platformId: EditablePlatform) => {
        setSelectedPlatforms(prev => {
            const newSelection = new Set(prev);
            newSelection.has(platformId) ? newSelection.delete(platformId) : newSelection.add(platformId);
            return newSelection;
        });
    }, []);

    const updateStepStatus = useCallback((key: string, status: GenerationStep['status'], error?: string) => {
        setGenerationSteps(prev => prev.map(s => s.key === key ? { ...s, status, error } : s));
    }, []);

    const handleReset = useCallback(() => {
        setViewState('input');
        setUserInput('');
        setScaffold({ projectName: '', campaignName: '', topicName: '' });
        setGenerationResult(null);
        setGenerationSteps([]);
        setError(null);
    }, []);

    const handleCancelGeneration = useCallback(() => {
        if (generationTask?.id) {
            cancelGeneration(generationTask.id);
        }
        handleReset();
    }, [generationTask, cancelGeneration, handleReset]);
    
    const setupProject = async (userId: string, selectedId: string, newName: string) => {
        if (selectedId !== '__CREATE_NEW__') return selectedId;
        updateStepStatus('project', 'running');
        const newProject = await addProject({ userId, name: newName || 'New AI Project', description: 'Generated by Magic Creator' });
        updateStepStatus('project', 'complete');
        return newProject.id;
    };

    const setupCampaign = async (userId: string, projectId: string, selectedId: string, newName: string) => {
        if (selectedId !== '__CREATE_NEW__') return selectedId;
        updateStepStatus('campaign', 'running');
        const newCampaign = await addCampaign({ userId, projectId, name: newName || 'New AI Campaign', goal: 'Generated from user input' });
        updateStepStatus('campaign', 'complete');
        return newCampaign.id;
    };

    const setupTopic = async (userId: string, projectId: string, campaignId: string, newName: string) => {
        updateStepStatus('topic', 'running');
        const newTopic = await addTopic({ userId, projectId, campaignId, name: newName });
        updateStepStatus('topic', 'complete');
        return newTopic.id;
    };

    const handleGenerate = useCallback(async () => {
        if (!user) { onOpenAuthModal(); return; }
        if (userInput.trim().length < 10) {
            setError("Please provide a more detailed input (at least 10 characters).");
            return;
        }

        setError(null);
        setViewState('generating');
        setGenerationSteps([
            { key: 'project', label: 'Create Project', status: 'pending' },
            { key: 'campaign', label: 'Create Campaign', status: 'pending' },
            { key: 'topic', label: 'Create Topic', status: 'pending' },
            { key: 'content', label: 'Generate Multi-Platform Content', status: 'pending' },
        ]);

        try {
            const finalTopicName = scaffold.topicName || userInput.substring(0, 100) || 'Untitled Topic';
            const finalProjectId = await setupProject(user.uid, selectedProjectId, scaffold.projectName);
            const finalCampaignId = await setupCampaign(user.uid, finalProjectId, selectedCampaignId, scaffold.campaignName);
            const finalTopicId = await setupTopic(user.uid, finalProjectId, finalCampaignId, finalTopicName);
            
            updateStepStatus('content', 'running');
            const selectedProfile = brandVoices.find(p => p.id === selectedProfileId);
            const generationContext = { projectId: finalProjectId, campaignId: finalCampaignId, topicId: finalTopicId };

            startGeneration({
                id: `magic-${finalTopicId}`, topicName: finalTopicName, status: 'queued', progress: 0, message: 'Queued...',
                context: {
                    type: 'content', view: 'magicCreator',
                    params: {
                        topic: { id: finalTopicId, name: finalTopicName } as any,
                        userId: user.uid, language, shouldGenerateImage, selectedPlatforms,
                        generationContext: { user, projects, campaigns, brandVoiceProfile: selectedProfile },
                        project: { id: finalProjectId }, campaign: { id: finalCampaignId },
                        sourceCalendarEventId,
                    },
                    onSuccess: (result) => {
                        updateStepStatus('content', 'complete');
                        setGenerationResult({ content: result, context: generationContext });
                        setViewState('complete');
                    }
                }
            });
        } catch (e: any) {
            console.error("Scaffolding or generation setup failed:", e);
            const failedStep = generationSteps.find(s => s.status === 'running')?.key || 'setup';
            updateStepStatus(failedStep, 'error', e.message || "An unexpected error occurred.");
        }
    }, [user, userInput, scaffold, selectedProjectId, selectedCampaignId, language, shouldGenerateImage, selectedPlatforms, selectedProfileId, projects, campaigns, brandVoices, onOpenAuthModal, startGeneration, sourceCalendarEventId]);

    // --- RENDER LOGIC ---

    if (!user) {
        return (
            <div className="relative p-8 mt-12 mb-6 bg-gradient-to-tr from-pink-900/40 via-purple-900/40 to-pink-900/40 border border-pink-500/30 rounded-xl overflow-hidden animate-fade-in max-w-xl mx-auto">
                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <h3 className="text-3xl font-bold text-white tracking-tight">Unleash the Magic Creator</h3>
                    <p className="text-zinc-300 max-w-md">Sign up or log in to automate your entire content workflow from a single idea.</p>
                    <button onClick={onOpenAuthModal} className="mt-4 flex items-center justify-center px-8 py-3 font-bold text-lg text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                        <MagicWandIcon className="w-6 h-6 mr-2"/> Start Creating Now
                    </button>
                </div>
            </div>
        );
    }
    
    if (viewState === 'generating') {
        return <GenerationProgress steps={generationSteps} taskProgress={generationTask?.progress || 0} taskMessage={generationTask?.message || ''} onCancel={handleCancelGeneration} />;
    }

    if (viewState === 'complete' && generationResult) {
        return <GenerationCompleteDisplay result={generationResult.content} topicName={scaffold.topicName || userInput.substring(0,100)} language={language} onNavigate={() => onGenerationComplete(generationResult.context)} onReset={handleReset} />;
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg space-y-4 text-left animate-fade-in">
            {error && <p className="text-red-400 text-sm text-center bg-red-900/30 p-2 rounded-md">{error}</p>}
            
            <div>
                <label htmlFor="magic-input" className="text-lg font-bold text-zinc-200 block mb-2 text-center">Start with anything. An idea, a post, a link...</label>
                <textarea 
                    id="magic-input" value={userInput} onChange={e => setUserInput(e.target.value)}
                    placeholder="e.g., 'A blog post about the benefits of solid-state batteries for electric vehicles'"
                    rows={4}
                    className="w-full p-4 bg-gray-900/70 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-gray-500 resize-none"
                />
            </div>

            <div className="text-center border-t border-b border-zinc-700/50 py-3">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-center w-full text-zinc-300 hover:text-white transition-colors group" aria-expanded={showAdvanced}>
                    <span className="font-semibold text-sm">{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
                    <ChevronDownIcon className={`w-5 h-5 ml-2 text-zinc-400 group-hover:text-white transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                {!showAdvanced && <p className="text-xs text-zinc-500 mt-2 animate-fade-in-fast">Customize project, platforms & brand voice. If not, we'll create them for you.</p>}
            </div>

            <AdvancedOptions
                showAdvanced={showAdvanced}
                isAnalyzing={isAnalyzing}
                onCancelAnalysis={handleCancelAnalysis}
                scaffold={scaffold}
                setScaffold={setScaffold}
                projects={projects}
                filteredCampaigns={filteredCampaigns}
                selectedProjectId={selectedProjectId}
                setSelectedProjectId={setSelectedProjectId}
                selectedCampaignId={selectedCampaignId}
                setSelectedCampaignId={setSelectedCampaignId}
                language={language}
                setLanguage={setLanguage}
                selectedProfileId={selectedProfileId}
                setSelectedProfileId={setSelectedProfileId}
                brandVoices={brandVoices}
                selectedPlatforms={selectedPlatforms}
                handlePlatformToggle={handlePlatformToggle}
                shouldGenerateImage={shouldGenerateImage}
                setShouldGenerateImage={setShouldGenerateImage}
            />
            
            <div className="pt-2 flex justify-center">
                <button
                    onClick={handleGenerate}
                    disabled={userInput.trim().length < 10 || selectedPlatforms.size === 0 || isAnalyzing}
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MagicWandIcon className="w-5 h-5 mr-2"/>
                    Create Everything
                </button>
            </div>
        </div>
    );
};