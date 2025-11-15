import React from 'react';
import type { User } from '../services/firebaseService';
import { useAIVisibility } from './ai-visibility/hooks/useAIVisibility';
import { SettingsForm } from './ai-visibility/SettingsForm';
import { ResultsDashboard } from './ai-visibility/ResultsDashboard';
import { SkeletonItem } from './Icons';

interface AIVisibilityDashboardProps {
    user: User;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6">
        <SkeletonItem />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonItem />
            <SkeletonItem />
        </div>
        <SkeletonItem />
    </div>
);


export const AIVisibilityDashboard: React.FC<AIVisibilityDashboardProps> = ({ user }) => {
    const { 
        settings, 
        result, 
        loading, 
        error, 
        handleSettingsSaved, 
        resetSettings,
        reRunAnalysis 
    } = useAIVisibility(user);

    if (loading.settings) {
        return <div className="text-center p-8 text-zinc-400">Loading settings...</div>;
    }
    
    if (error) {
         return (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300 animate-fade-in flex justify-between items-center">
                <p>{error}</p>
                <button onClick={resetSettings} className="text-sm underline hover:text-white">Reset</button>
            </div>
        );
    }
    
    if (!settings) {
        return <SettingsForm user={user} onSave={handleSettingsSaved} />;
    }

    return (
        <div className="space-y-8 animate-fade-in-fast">
            <div className="flex justify-end items-center gap-4">
                 <button onClick={reRunAnalysis} disabled={loading.analysis} className="text-sm text-zinc-400 hover:text-white underline disabled:opacity-50">
                    {loading.analysis ? 'Re-running...' : 'Re-run Analysis'}
                </button>
                <button onClick={resetSettings} className="text-sm text-zinc-400 hover:text-white underline">
                    Edit Settings
                </button>
            </div>
            
            {loading.analysis ? (
                <LoadingSkeleton />
            ) : result ? (
                <ResultsDashboard settings={settings} result={result} />
            ) : (
                <p className="text-center p-8 text-zinc-500">No analysis data found. Click "Re-run Analysis" to generate a report.</p>
            )}
        </div>
    );
};
