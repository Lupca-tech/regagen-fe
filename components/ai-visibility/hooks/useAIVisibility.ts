import { useState, useEffect, useCallback } from 'react';
import type { User } from '../../../services/firebaseService';
import { getAIVisibilitySettings, saveAIVisibilitySettings } from '../../../services/firebaseService';
import { getAIVisibilityAnalysis } from '../../../services/geminiService';
import type { AIVisibilitySettings, AIVisibilityResult } from '../../../types';

interface LoadingState {
    settings: boolean;
    analysis: boolean;
}

export const useAIVisibility = (user: User) => {
    const [settings, setSettings] = useState<AIVisibilitySettings | null>(null);
    const [result, setResult] = useState<AIVisibilityResult | null>(null);
    const [loading, setLoading] = useState<LoadingState>({ settings: true, analysis: false });
    const [error, setError] = useState<string | null>(null);
    
    const analysisController = new AbortController();

    const fetchAnalysis = useCallback(async (currentSettings: AIVisibilitySettings) => {
        setLoading(prev => ({...prev, analysis: true}));
        setError(null);
        try {
            const analysisResult = await getAIVisibilityAnalysis(currentSettings, analysisController.signal);
            setResult(analysisResult);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                 setError(e.message || "Failed to load AI visibility analysis.");
            }
        } finally {
            setLoading(prev => ({...prev, analysis: false}));
        }
    }, [user.uid]);

    useEffect(() => {
        setLoading(prev => ({...prev, settings: true}));
        getAIVisibilitySettings(user.uid)
            .then(userSettings => {
                setSettings(userSettings);
                if (userSettings) {
                    fetchAnalysis(userSettings);
                }
            })
            .catch((e: any) => setError(e.message))
            .finally(() => setLoading(prev => ({...prev, settings: false})));
            
        return () => {
            analysisController.abort();
        };
    }, [user.uid, fetchAnalysis]);

    const handleSettingsSaved = (newSettings: AIVisibilitySettings) => {
        setSettings(newSettings);
        fetchAnalysis(newSettings);
    };

    const resetSettings = () => {
        setSettings(null);
        setResult(null);
        setError(null);
    };
    
    const reRunAnalysis = () => {
        if(settings) {
            fetchAnalysis(settings);
        }
    }

    return {
        settings,
        result,
        loading,
        error,
        handleSettingsSaved,
        resetSettings,
        reRunAnalysis
    };
};
