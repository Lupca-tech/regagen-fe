
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { generateContentFlow, generateTopicsAI } from '../services/geminiService';
import { saveGeneratedContent, addMultipleTopics } from '../services/firebaseService';
import type { GeneratedContent, Topic, BrandVoiceProfile } from '../types';

export interface GenerationTask {
    id: string;
    topicName: string;
    status: 'queued' | 'running' | 'success' | 'error';
    progress: number;
    message: string;
    context: {
        type: 'content' | 'topics';
        view: 'creator' | 'dashboard';
        params: any;
        onSuccess?: (result?: any) => void;
    };
}

interface GenerationContextType {
    activeGenerations: GenerationTask[];
    startGeneration: (task: GenerationTask) => void;
    cancelGeneration: (taskId: string) => void;
    isProgressModalVisible: boolean;
    showProgressModal: () => void;
    hideProgressModal: () => void;
    activeTask: GenerationTask | null;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export const GenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<GenerationTask[]>([]);
    const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
    const cancelledTaskIds = useRef(new Set<string>());

    const showProgressModal = useCallback(() => setIsProgressModalVisible(true), []);
    const hideProgressModal = useCallback(() => setIsProgressModalVisible(false), []);

    const updateTask = useCallback((id: string, updates: Partial<GenerationTask>) => {
        setTasks(prevTasks =>
            prevTasks.map(task => (task.id === id ? { ...task, ...updates } : task))
        );
    }, []);

    const removeTask = useCallback((id: string) => {
        setTimeout(() => {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        }, 5000);
    }, []);
    
    useEffect(() => {
        if (tasks.length === 0) {
            hideProgressModal();
        }
    }, [tasks, hideProgressModal]);

    const processTask = useCallback(async (task: GenerationTask) => {
        updateTask(task.id, { status: 'running', progress: 5, message: 'Initializing...' });

        const onProgress = (progress: number, message: string) => {
            if (cancelledTaskIds.current.has(task.id)) return;
            updateTask(task.id, { progress, message });
        };
        
        try {
            if (cancelledTaskIds.current.has(task.id)) return;
            
            let result: any;
            if (task.context.type === 'topics') {
                const { project, campaign, count, userId } = task.context.params;
                onProgress(20, 'Brainstorming ideas...');
                const generatedTopics = await generateTopicsAI(project, campaign, count);
                if (cancelledTaskIds.current.has(task.id)) return;

                onProgress(80, 'Saving new topics...');
                const topicsToAdd = generatedTopics.map(name => ({ name }));
                await addMultipleTopics(topicsToAdd, userId, project.id, campaign.id);

            } else { // 'content' generation
                const { topic, language, shouldGenerateImage, selectedPlatforms, brandVoiceProfile } = task.context.params;
                const topicName = task.context.view === 'dashboard' ? topic.name : topic;
                result = await generateContentFlow(topicName, language, shouldGenerateImage, selectedPlatforms, onProgress, brandVoiceProfile);
                
                if (cancelledTaskIds.current.has(task.id)) return;

                if (task.context.view === 'dashboard') {
                     const { topic: topicObject, userId } = task.context.params;
                     onProgress(98, "Saving to database...");
                     const generationContext = { projectId: topicObject.projectId, campaignId: topicObject.campaignId, topicId: topicObject.id };
                     await saveGeneratedContent(userId, topicObject.name, language, result, generationContext);
                }
            }

            if (cancelledTaskIds.current.has(task.id)) return;

            updateTask(task.id, { status: 'success', progress: 100, message: 'Completed!' });
            task.context.onSuccess?.(result);
            removeTask(task.id);

        } catch (e: any) {
             if (cancelledTaskIds.current.has(task.id)) return;
            console.error(`Generation failed for task ${task.id}:`, e);
            updateTask(task.id, { status: 'error', progress: 100, message: e.message || 'An unknown error occurred.' });
            removeTask(task.id);
        } finally {
            cancelledTaskIds.current.delete(task.id);
        }
    }, [updateTask, removeTask]);

    useEffect(() => {
        const runningTasks = tasks.filter(t => t.status === 'running').length;
        const queuedTask = tasks.find(t => t.status === 'queued');
        
        if (runningTasks === 0 && queuedTask) {
            processTask(queuedTask);
        }
    }, [tasks, processTask]);


    const startGeneration = (task: GenerationTask) => {
        setTasks(prevTasks => {
            if (prevTasks.some(t => t.id === task.id)) return prevTasks;
            return [...prevTasks, task];
        });
        showProgressModal();
    };

    const cancelGeneration = useCallback((taskId: string) => {
        cancelledTaskIds.current.add(taskId);
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }, []);

    const activeTask = tasks.find(t => t.status === 'running') || tasks.find(t => t.status === 'queued') || tasks[0] || null;

    return (
        <GenerationContext.Provider value={{ 
            activeGenerations: tasks, 
            startGeneration,
            cancelGeneration,
            isProgressModalVisible,
            showProgressModal,
            hideProgressModal,
            activeTask
        }}>
            {children}
        </GenerationContext.Provider>
    );
};

export const useGeneration = () => {
    const context = useContext(GenerationContext);
    if (context === undefined) {
        throw new Error('useGeneration must be used within a GenerationProvider');
    }
    return context;
};
