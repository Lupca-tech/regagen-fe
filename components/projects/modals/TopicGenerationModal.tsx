
import React, { useState, useCallback } from 'react';
import { User } from '../../../services/firebaseService';
import { Project, Campaign } from '../../../types';
import { useGeneration } from '../../../contexts/GenerationContext';
import { SparkleIcon } from '../../Icons';

interface TopicGenerationModalProps {
    project: Project;
    campaign: Campaign;
    user: User;
    onClose: () => void;
    onGenerationSuccess: () => void;
}

export const TopicGenerationModal: React.FC<TopicGenerationModalProps> = ({ project, campaign, user, onClose, onGenerationSuccess }) => {
    const { startGeneration } = useGeneration();
    const [count, setCount] = useState(5);

    const handleCountChange = useCallback((amount: number) => {
        setCount(prev => Math.max(1, Math.min(20, prev + amount)));
    }, []);

    const handleGenerate = useCallback(() => {
        startGeneration({
            id: `topics-${campaign.id}-${Date.now()}`,
            topicName: `AI Topics for ${campaign.name}`,
            status: 'queued',
            progress: 0,
            message: 'Queued for generation...',
            context: {
                type: 'topics',
                view: 'dashboard',
                params: { project, campaign, count, userId: user.uid },
                onSuccess: onGenerationSuccess,
            }
        });
        onClose();
    }, [startGeneration, campaign, project, count, user.uid, onClose, onGenerationSuccess]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-2">AI Topic Generator</h2>
                <p className="text-zinc-400 text-center mb-6">
                    Generating ideas for campaign: <span className="font-bold text-pink-400">{campaign.name}</span>
                </p>
                <div className="space-y-6">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-zinc-300 mb-3">Number of Topics to Generate</label>
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => handleCountChange(-1)} disabled={count <= 1} className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                            </button>
                            <span className="text-5xl font-black w-20 text-center">{count}</span>
                            <button onClick={() => handleCountChange(1)} disabled={count >= 20} className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-center sm:justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                        <button onClick={handleGenerate} className="flex items-center justify-center px-6 py-2.5 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300">
                           <SparkleIcon className="w-5 h-5 mr-2"/>
                            Generate Topics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
