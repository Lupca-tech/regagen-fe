import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { generateContentFlow, generateTopicsAI } from '../services/geminiService';
import { saveGeneratedContent, addMultipleTopics, type User } from '../services/firebaseService';
import type { GeneratedContent, EditablePlatform, Topic, BrandVoiceProfile } from '../types';

export interface GenerationTask {
    id: string;
    topicName: string;
    status: 'queued' | 'running' | 'success' | 'error';
    progress: number;
    message: string;
    context: {
        type: 'content' | 'topics';
        view: 'creator' | 'dashboard';
        params: any; // Could be creator form state or a Topic object
        onSuccess?: (result: any) => void;
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
        // Keep successful/failed tasks for a few seconds before removing
        setTimeout(() => {
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        }, 5000);
    }, []);
    
    // Effect to hide the modal when all tasks are gone.
    useEffect(() => {
        if (tasks.length === 0) {
            hideProgressModal();
        }
    }, [tasks, hideProgressModal]);

    const processTask = useCallback(async (task: GenerationTask) => {
        updateTask(task.id, { status: 'running', progress: 5, message: 'Initializing...' });

        const onProgress = (progress: number, message: string) => {
            updateTask(task.id, { progress, message });
        };
        
        try {
            if (cancelledTaskIds.current.has(task.id)) {
                console.log(`Task ${task.id} was cancelled before starting.`);
                cancelledTaskIds.current.delete(task.id);
                return; // Stop processing
            }
            
            if (task.context.type === 'topics') {
                const { project, campaign, count, userId } = task.context.params;
                onProgress(20, 'Brainstorming ideas...');
                const generatedTopics = await generateTopicsAI(project, campaign, count);
                
                if (cancelledTaskIds.current.has(task.id)) {
                    console.log(`Task ${task.id} was cancelled. Aborting save.`);
                    cancelledTaskIds.current.delete(task.id);
                    return;
                }

                onProgress(80, 'Saving new topics...');
                const topicsToAdd = generatedTopics.map(name => ({ name }));
                await addMultipleTopics(topicsToAdd, userId, project.id, campaign.id);
            } else { // 'content' generation
                let result: GeneratedContent;

                if (task.context.view === 'dashboard') {
                    const { topic, userId, language, shouldGenerateImage, selectedPlatforms, brandVoiceProfile } = task.context.params as {
                        topic: Topic; userId: string; language: string; shouldGenerateImage: boolean; selectedPlatforms: Set<EditablePlatform>; brandVoiceProfile?: BrandVoiceProfile;
                    };
                    result = await generateContentFlow(topic.name, language, shouldGenerateImage, selectedPlatforms, onProgress, brandVoiceProfile);
                } else { // Creator view
                    const { topic, language, shouldGenerateImage, selectedPlatforms, brandVoiceProfile } = task.context.params;
                    result = await generateContentFlow(topic, language, shouldGenerateImage, selectedPlatforms, onProgress, brandVoiceProfile);
                }
                
                if (cancelledTaskIds.current.has(task.id)) {
                    console.log(`Task ${task.id} was cancelled. Aborting save and success callbacks.`);
                    cancelledTaskIds.current.delete(task.id); // Clean up
                    return; // Stop further processing
                }

                if (task.context.view === 'dashboard') {
                     const { topic, userId, language } = task.context.params;
                     onProgress(98, "Saving to database...");
                     const generationContext = { projectId: topic.projectId, campaignId: topic.campaignId, topicId: topic.id };
                     await saveGeneratedContent(userId, topic.name, language, result, generationContext);
                }
                
                task.context.onSuccess?.(result);
            }

            // Common success path for all task types
            updateTask(task.id, { status: 'success', progress: 100, message: 'Completed!' });
            if (task.context.type === 'topics') {
                task.context.onSuccess?.(null); // No specific result, just signal success for refetch
            }
            removeTask(task.id);
        } catch (e: any) {
             if (cancelledTaskIds.current.has(task.id)) {
                console.log(`Task ${task.id} was cancelled during an error. Ignoring error state.`);
                cancelledTaskIds.current.delete(task.id);
                return;
            }
            console.error(`Generation failed for task ${task.id}:`, e);
            updateTask(task.id, { status: 'error', progress: 100, message: e.message || 'An unknown error occurred.' });
            removeTask(task.id);
        }
    }, [updateTask, removeTask]);

    // Effect to process the queue
    useEffect(() => {
        const runningTasks = tasks.filter(t => t.status === 'running').length;
        const queuedTask = tasks.find(t => t.status === 'queued');
        
        // Simple concurrency limit: process one at a time
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
