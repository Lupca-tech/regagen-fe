import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { generateContentFlow, generateTopicsAI, regeneratePlatformContent, analyzePerformance, generateCalendarSuggestions } from '../services/geminiService';
import { saveGeneratedContent, addMultipleTopics, updateContentAnalysis, addCalendarEventsBatch, linkContentToCalendarEvent } from '../services/firebaseService';
import type { GeneratedContent, Topic, BrandVoiceProfile, EditablePlatform, Project, Campaign, SavedContent, CalendarSettings, CalendarEvent } from '../types';
import type { User } from 'firebase/auth';

export interface GenerationTask {
    id: string;
    topicName: string;
    status: 'queued' | 'running' | 'success' | 'error' | 'cancelled';
    progress: number;
    message: string;
    generatedResult?: any;
    context: {
        type: 'content' | 'topics' | 'refineContent' | 'analyzeContent' | 'calendarSuggestions';
        view: 'creator' | 'dashboard' | 'magicCreator' | 'calendar';
        params: {
            topic?: string | Topic;
            language?: string;
            shouldGenerateImage?: boolean;
            selectedPlatforms?: Set<EditablePlatform>;
            generationContext?: {
                user?: User;
                projects?: Project[];
                campaigns?: Campaign[];
                brandVoiceProfile?: Omit<BrandVoiceProfile, 'id' | 'userId' | 'createdAt'> & { name: string };
            };
            userId?: string;
            project?: any;
            campaign?: any;
            count?: number;
            
            // For refineContent tasks
            platform?: EditablePlatform;
            currentContent?: any;
            userPrompt?: string;

            // For analyzeContent tasks
            content?: SavedContent;

            // For calendarSuggestions tasks
            calendarSettings?: CalendarSettings;
            currentDate?: Date;
            sourceCalendarEventId?: string;
        };
        onSuccess?: (result?: any, platform?: EditablePlatform) => void;
        onError?: (error: Error) => void;
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

export const useGeneration = () => {
    const context = useContext(GenerationContext);
    if (context === undefined) {
        throw new Error('useGeneration must be used within a GenerationProvider');
    }
    return context;
};

export const GenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<GenerationTask[]>([]);
    const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
    const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null);
    const activeController = useRef<AbortController | null>(null);

    const updateTask = useCallback((taskId: string, updates: Partial<GenerationTask>) => {
        setTasks(prevTasks =>
            prevTasks.map(task => (task.id === taskId ? { ...task, ...updates } : task))
        );
    }, []);

    const startGeneration = useCallback((newTask: GenerationTask) => {
        setTasks(prevTasks => {
            // Special handling for Magic Creator: Enforce Singleton (No Queueing)
            // If the user starts a new magic creator task, we explicitly remove any existing ones
            // to prevent them from blocking the new one or appearing in the state.
            let updatedTasks = [...prevTasks];
            
            if (newTask.context.view === 'magicCreator') {
                // Filter out any existing magicCreator tasks to prevent queuing issues
                updatedTasks = updatedTasks.filter(t => t.context.view !== 'magicCreator');
                
                // If the active task was a magic creator task (which we just removed), 
                // we must also ensure the active lock is cleared so the new one can start immediately.
                // Note: We can't easily check 'activeGenerationId' here inside the state updater securely,
                // but the cancelGeneration logic handles the abort. 
                // This filter ensures the 'queue' logic won't find a stale task.
            }

            // Prevent adding duplicate tasks if one is already queued or running (generic check)
            if (updatedTasks.some(t => t.id === newTask.id && (t.status === 'queued' || t.status === 'running'))) {
                console.warn(`Task with ID ${newTask.id} is already in the queue or running.`);
                return updatedTasks;
            }
            
            return [...updatedTasks, { ...newTask, status: 'queued', progress: 0, message: 'Queued...' }];
        });
        
        if (newTask.context.view !== 'magicCreator') {
            if (!isProgressModalVisible) {
                setIsProgressModalVisible(true);
            }
        }
    }, [isProgressModalVisible]);

    const cancelGeneration = useCallback((taskId: string) => {
        // 1. Handle the Active Task Logic Synchronously
        // If the task being cancelled is the one currently holding the lock (activeGenerationId),
        // we must release the lock IMMEDIATELY. We cannot wait for the promise 'finally' block
        // because that creates a race condition where the user clicks "Create" again before the
        // old promise resolves/rejects, causing the new task to sit in "Queued" forever.
        if (activeGenerationId === taskId) {
            if (activeController.current) {
                activeController.current.abort();
            }
            // FORCE RELEASE THE LOCK
            setActiveGenerationId(null);
            activeController.current = null;
        }

        // 2. Update State
        setTasks(prevTasks => {
            // Remove the task entirely from the list immediately. 
            // We don't keep 'cancelled' tasks in history for Magic Creator or generally to keep the UI clean.
            return prevTasks.filter(task => task.id !== taskId);
        });
    }, [activeGenerationId]);

    const showProgressModal = useCallback(() => setIsProgressModalVisible(true), []);
    const hideProgressModal = useCallback(() => {
        setIsProgressModalVisible(false);
        setTasks(prevTasks => prevTasks.filter(task => task.status === 'running' || task.status === 'queued'));
    }, []);

    // Effect to process the generation queue
    useEffect(() => {
        const nextQueuedTask = tasks.find(t => t.status === 'queued');

        // Only start if there is a queued task AND no task is currently active
        if (nextQueuedTask && !activeGenerationId) {
            setActiveGenerationId(nextQueuedTask.id);
            
            const controller = new AbortController();
            activeController.current = controller;

            const executeTask = async () => {
                // Check if task still exists in state (it might have been cancelled rapidly)
                // Although activeGenerationId protects us, a double check is good.
                updateTask(nextQueuedTask.id, { status: 'running', message: 'Starting process...' });

                const onProgressCallback = (progress: number, message: string) => {
                    // Only update if not aborted
                    if (!controller.signal.aborted) {
                        updateTask(nextQueuedTask.id, { progress, message });
                    }
                };

                try {
                    let result;
                    if (nextQueuedTask.context.type === 'content') {
                        const { topic, language, shouldGenerateImage, selectedPlatforms, generationContext, userId, project, campaign, sourceCalendarEventId } = nextQueuedTask.context.params;
                        
                        if (!topic) throw new Error("Missing 'topic' for content generation task.");

                        const topicNameString = typeof topic === 'string' ? topic : (topic as Topic).name;
                        
                        result = await generateContentFlow(
                            topicNameString,
                            language || 'English',
                            shouldGenerateImage || false,
                            selectedPlatforms || new Set(),
                            onProgressCallback,
                            generationContext,
                            controller.signal
                        );

                        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

                        if (userId && topic && typeof topic !== 'string' && topic.id && project?.id && campaign?.id) {
                            const topicObj = topic as Topic;
                            const contentId = await saveGeneratedContent(userId, topicObj.name, language || 'English', result, {
                                projectId: project.id,
                                campaignId: campaign.id,
                                topicId: topicObj.id,
                            });

                            if (sourceCalendarEventId && contentId) {
                                await linkContentToCalendarEvent(sourceCalendarEventId, contentId);
                            }
                        }
                    } 
                    else if (nextQueuedTask.context.type === 'topics') {
                        const { project, campaign, count, userId } = nextQueuedTask.context.params;
                        if (!project || !campaign || !count || !userId) throw new Error("Missing parameters for topics generation.");
                        
                        const topicsArray = await generateTopicsAI(project, campaign, count, controller.signal);
                        result = topicsArray;

                        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

                        await addMultipleTopics(result.map((name: string) => ({ name })), userId, project.id, campaign.id);
                    } 
                    else if (nextQueuedTask.context.type === 'refineContent') {
                        const { platform, topic, currentContent, userPrompt, language } = nextQueuedTask.context.params;
                        if (!platform || !topic || !currentContent || !userPrompt || !language) throw new Error("Missing parameters for content refinement.");
                        
                        const topicNameString = typeof topic === 'string' ? topic : (topic as Topic).name;
                        result = await regeneratePlatformContent(platform, topicNameString, currentContent, userPrompt, language, controller.signal);
                    }
                    else if (nextQueuedTask.context.type === 'analyzeContent') {
                        const { content } = nextQueuedTask.context.params;
                        if (!content || !content.id) throw new Error("Missing content or content ID for analysis task.");
                        
                        const platformsToAnalyze = (['web', 'tiktok', 'facebook'] as const).filter(p => content[p]);
                        onProgressCallback(25, 'Analyzing content...');
                        result = await analyzePerformance(content, platformsToAnalyze, controller.signal);

                        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                        
                        onProgressCallback(75, 'Saving analysis...');
                        await updateContentAnalysis(content.id, result);
                    }
                    else if (nextQueuedTask.context.type === 'calendarSuggestions') {
                        const { calendarSettings, currentDate, userId } = nextQueuedTask.context.params;
                        if (!calendarSettings || !currentDate || !userId) throw new Error("Missing parameters for calendar suggestion generation.");
                        
                        onProgressCallback(25, 'Searching for trends and events...');
                        result = await generateCalendarSuggestions(calendarSettings, currentDate, controller.signal);

                        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');

                        onProgressCallback(75, 'Populating calendar...');
                        const eventsToAdd = (result as any[]).map((suggestion: any) => ({
                            ...suggestion,
                            start: suggestion.start, 
                            status: suggestion.type === 'trend' ? 'suggested_trend' : 'suggested_event',
                        }));
                        await addCalendarEventsBatch(userId, eventsToAdd);
                    }
                    
                    // Success
                    if (!controller.signal.aborted) {
                        updateTask(nextQueuedTask.id, { status: 'success', message: 'Generation complete!', progress: 100, generatedResult: result });
                        if (nextQueuedTask.context.onSuccess) {
                            if (nextQueuedTask.context.type === 'refineContent' && nextQueuedTask.context.params.platform) {
                                nextQueuedTask.context.onSuccess(result, nextQueuedTask.context.params.platform);
                            } else {
                                nextQueuedTask.context.onSuccess(result);
                            }
                        }
                    }

                } catch (e: any) {
                    if (e.name === 'AbortError' || controller.signal.aborted) {
                        // Logic handled in cancelGeneration (removing task) and finally block (clearing lock)
                        // We don't need to updateTask here because cancelGeneration likely already removed it.
                        console.log('Task aborted successfully.');
                    } else {
                        console.error(`Error during generation for task ${nextQueuedTask.id}:`, e);
                        const errorMessage = e.message || 'An unexpected error occurred.';
                        updateTask(nextQueuedTask.id, { status: 'error', message: errorMessage, progress: nextQueuedTask.progress || 0 });
                        if (nextQueuedTask.context.onError) {
                            nextQueuedTask.context.onError(e);
                        }
                    }
                } finally {
                    // Ensure lock is released if it matches the current task
                    // Note: cancelGeneration might have already done this synchronously, but this ensures cleanup for natural completion or errors.
                    setActiveGenerationId(currentId => (currentId === nextQueuedTask.id ? null : currentId));
                    if (activeController.current === controller) {
                        activeController.current = null;
                    }
                }
            };
            executeTask();
        }
    }, [tasks, activeGenerationId, updateTask]); // removed cancelGeneration from dependency to prevent cycle, though strictly it is stable

    const activeGenerations = tasks.filter(
        task => ['queued', 'running', 'success', 'error'].includes(task.status)
    );
    const activeTask = activeGenerations.find(t => t.status === 'running') || activeGenerations.find(t => t.status === 'queued') || null;

    const contextValue = {
        activeGenerations,
        startGeneration,
        cancelGeneration,
        isProgressModalVisible,
        showProgressModal,
        hideProgressModal,
        activeTask,
    };

    return (
        <GenerationContext.Provider value={contextValue}>
            {children}
        </GenerationContext.Provider>
    );
};