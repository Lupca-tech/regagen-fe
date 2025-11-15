import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../services/firebaseService';
import { getAIVisibilitySettings, saveAIVisibilitySettings, getProjects, getBrandVoiceProfiles } from '../services/firebaseService';
import { getAIVisibilityAnalysis } from '../services/geminiService';
import type { AIVisibilitySettings, AIVisibilityResult, Project, BrandVoiceProfile, ActionItem } from '../types';
import { CheckCircleIcon, XCircleIcon, MinusCircleIcon, XIcon, SparkleIcon } from './Icons';

interface AIVisibilityDashboardProps {
    user: User;
}

const DonutChart: React.FC<{ data: { brand: string; percentage: number }[] }> = ({ data }) => {
    const colors = ['#ec4899', '#a855f7', '#6366f1', '#f97316', '#10b981', '#f59e0b'];
    let cumulativePercentage = 0;
    const segments = data.map((item, index) => {
        const startAngle = cumulativePercentage;
        cumulativePercentage += item.percentage;
        return { ...item, startAngle, color: colors[index % colors.length] };
    });

    const conicGradient = segments.map(s => `${s.color} ${s.startAngle}% ${s.startAngle + s.percentage}%`).join(', ');

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div 
                className="relative w-48 h-48 rounded-full"
                style={{ background: `conic-gradient(${conicGradient})` }}
            >
                <div className="absolute inset-2 bg-zinc-900 rounded-full"></div>
            </div>
            <div className="flex flex-col gap-2">
                {segments.map(item => (
                    <div key={item.brand} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="font-semibold text-zinc-200">{item.brand}:</span>
                        <span className="text-zinc-400">{item.percentage.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SettingsForm: React.FC<{
    user: User;
    onSave: (settings: AIVisibilitySettings) => void;
    initialSettings?: AIVisibilitySettings | null;
}> = ({ user, onSave, initialSettings }) => {
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
            if (selectedProject) {
                setFormData(prev => ({...prev, brandName: selectedProject.name}));
            }
        }
    }, [formData.projectId, projects]);

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
                                 <button type="button" onClick={() => removeKeyword(k)} className="text-pink-200 hover:text-white"><XIcon className="w-4 h-4" /></button>
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

const ActionItemCard: React.FC<{ item: ActionItem }> = ({ item }) => {
    const isThreat = item.type === 'threat';
    const borderColor = isThreat ? 'border-red-500/50' : 'border-purple-500/50';
    const bgColor = isThreat ? 'bg-red-900/20' : 'bg-purple-900/20';
    const iconColor = isThreat ? 'text-red-400' : 'text-purple-400';
    const title = isThreat ? 'Priority Threat Detected' : 'Top Strategic Opportunity';

    return (
        <div className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor} space-y-4 mb-8`}>
            <div className="flex items-center gap-3">
                <SparkleIcon className={`w-8 h-8 ${iconColor}`} />
                <h3 className="text-2xl font-bold">{title}</h3>
            </div>
            <div>
                <h4 className="font-semibold text-zinc-300">Insight:</h4>
                <p className="text-zinc-400">{item.insight}</p>
            </div>
            <div>
                <h4 className="font-semibold text-zinc-300">Suggested Action:</h4>
                <p className="text-zinc-400">{item.suggested_action}</p>
            </div>
        </div>
    );
};

export const AIVisibilityDashboard: React.FC<AIVisibilityDashboardProps> = ({ user }) => {
    const [settings, setSettings] = useState<AIVisibilitySettings | null>(null);
    const [result, setResult] = useState<AIVisibilityResult | null>(null);
    const [loading, setLoading] = useState({ settings: true, analysis: false });
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = useCallback(async (currentSettings: AIVisibilitySettings) => {
        setLoading(prev => ({...prev, analysis: true}));
        setError(null);
        try {
            const analysisResult = await getAIVisibilityAnalysis(currentSettings);
            setResult(analysisResult);
        } catch (e: any) {
            setError(e.message || "Failed to load AI visibility analysis.");
        } finally {
            setLoading(prev => ({...prev, analysis: false}));
        }
    }, []);

    useEffect(() => {
        getAIVisibilitySettings(user.uid)
            .then(userSettings => {
                setSettings(userSettings);
                if (userSettings) {
                    fetchAnalysis(userSettings);
                }
            })
            .catch((e: any) => setError(e.message))
            .finally(() => setLoading(prev => ({...prev, settings: false})));
    }, [user.uid, fetchAnalysis]);

    const handleSettingsSaved = (newSettings: AIVisibilitySettings) => {
        setSettings(newSettings);
        fetchAnalysis(newSettings);
    };
    
    const SentimentIcon: React.FC<{ sentiment: 'positive' | 'neutral' | 'negative' }> = ({ sentiment }) => {
        switch (sentiment) {
            case 'positive': return <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />;
            case 'neutral': return <MinusCircleIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />;
            case 'negative': return <XCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />;
        }
    };

    if (loading.settings) {
        return <div className="text-center p-8">Loading settings...</div>;
    }
    
    if (!settings) {
        return <SettingsForm user={user} onSave={handleSettingsSaved} initialSettings={settings} />;
    }

    return (
        <div className="space-y-8 animate-fade-in-fast">
             {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-md border border-red-500/30">{error}</p>}
             
             <div className="flex justify-end">
                <button onClick={() => { setSettings(null); setResult(null); }} className="text-sm text-zinc-400 hover:text-white underline">Edit Settings</button>
             </div>

             {loading.analysis && <p className="text-center p-8">Running daily analysis and strategy report...</p>}
             
             {result && (
                <>
                    {result.actionItem && <ActionItemCard item={result.actionItem} />}
                    
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h3 className="text-xl font-bold mb-4">Share of Voice</h3>
                        <p className="text-zinc-400 mb-6 text-sm">Percentage of times <span className="font-bold text-zinc-200">{settings.brandName}</span> was mentioned vs. competitors for your target keywords.</p>
                        <DonutChart data={result.shareOfVoice} />
                    </div>

                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h3 className="text-xl font-bold mb-4">Sentiment Analysis for "{settings.brandName}"</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-zinc-800 p-4 rounded-lg flex items-center gap-3">
                                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                                <div>
                                    <p className="text-2xl font-bold">{result.sentimentCounts.positive}</p>
                                    <p className="text-sm text-zinc-400">Positive Mentions</p>
                                </div>
                            </div>
                            <div className="bg-zinc-800 p-4 rounded-lg flex items-center gap-3">
                                <MinusCircleIcon className="w-8 h-8 text-yellow-400" />
                                <div>
                                    <p className="text-2xl font-bold">{result.sentimentCounts.neutral}</p>
                                    <p className="text-sm text-zinc-400">Neutral Mentions</p>
                                </div>
                            </div>
                             <div className="bg-zinc-800 p-4 rounded-lg flex items-center gap-3">
                                <XCircleIcon className="w-8 h-8 text-red-400" />
                                <div>
                                    <p className="text-2xl font-bold">{result.sentimentCounts.negative}</p>
                                    <p className="text-sm text-zinc-400">Negative Mentions</p>
                                </div>
                            </div>
                         </div>
                         {result.sentimentAnalysis.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-zinc-800">
                                <h4 className="font-semibold text-zinc-300 mb-3">Sentiment Breakdown:</h4>
                                <div className="space-y-3">
                                    {result.sentimentAnalysis.map((item, index) => (
                                        <div key={index} className="bg-zinc-800 p-3 rounded-lg flex items-start gap-3">
                                            <SentimentIcon sentiment={item.sentiment} />
                                            <div>
                                                <p className="font-bold text-zinc-200">{item.brand}</p>
                                                <p className="text-sm text-zinc-400 italic">"{item.reason}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                    </div>

                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h3 className="text-xl font-bold mb-4">Citation Tracking</h3>
                        <p className="text-zinc-400 mb-6 text-sm">Instances where an LLM cited your website (<span className="font-bold text-zinc-200">{settings.domain}</span>) as a source.</p>
                        <div className="space-y-4">
                            {result.citationTracking.length > 0 ? result.citationTracking.map((citation, index) => (
                                <div key={index} className="bg-zinc-800 p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm text-zinc-400">For query: <span className="font-semibold text-zinc-300">"{citation.query}"</span></p>
                                        {citation.cited ? (
                                            <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-400">Cited</span>
                                        ) : (
                                            <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">Not Cited</span>
                                        )}
                                    </div>
                                    {citation.cited && (
                                        <>
                                            <a href={citation.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-pink-400 hover:underline break-all">{citation.url}</a>
                                            <blockquote className="mt-2 pl-3 border-l-2 border-zinc-600 text-zinc-300 italic">{citation.snippet}</blockquote>
                                        </>
                                    )}
                                </div>
                            )) : (
                                <p className="text-zinc-500 text-center py-4">No citation data available.</p>
                            )}
                        </div>
                    </div>
                </>
             )}
        </div>
    );
};