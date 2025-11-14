import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { generateContentFlow, generateTopicsAI, regeneratePlatformContent, analyzePerformance, generateCalendarSuggestions } from '../services/geminiService';
import { saveGeneratedContent, addMultipleTopics, updateContentAnalysis, addCalendarEventsBatch, linkContentToCalendarEvent } from '../services/firebaseService';
import type { GeneratedContent, Topic, BrandVoiceProfile, EditablePlatform, Project, Campaign, SavedContent, CalendarSettings } from '../types';
import type { User } from 'firebase/auth';

export interface GenerationTask {
    id: string;
    topicName: string;
    status: 'queued' | 'running' | 'success' | 'error' | 'cancelled'; // Added 'cancelled'
    progress: number;
    message: string;
    generatedResult?: any; // To store the actual generated content/topics
    context: {
        type: 'content' | 'topics' | 'refineContent' | 'analyzeContent' | 'calendarSuggestions';
        // Fix: Added 'magicCreator' to the view type to support the Magic Creator dashboard.
        view: 'creator' | 'dashboard' | 'magicCreator' | 'calendar';
        params: {
            // Fix: Made 'topic' optional as it's not required for 'topics' generation tasks.
            topic?: string | Topic; // Can be string for creator, or Topic object for dashboard
            language?: string;
            shouldGenerateImage?: boolean;
            selectedPlatforms?: Set<EditablePlatform>;
            // Fix: Replaced 'brandVoiceProfile' with a unified 'generationContext' object.
            generationContext?: {
                user?: User;
                projects?: Project[];
                campaigns?: Campaign[];
                // Fix: Updated type to include 'name' as it's required by the generation service.
                brandVoiceProfile?: Omit<BrandVoiceProfile, 'id' | 'userId' | 'createdAt'> & { name: string };
            };
            userId?: string; // For dashboard view
            project?: any; // For topics generation
            campaign?: any; // For topics generation
            count?: number; // For topics generation
            
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
    const activeController = useRef<AbortController | null>(null); // To handle API call cancellation

    const updateTask = useCallback((taskId: string, updates: Partial<GenerationTask>) => {
        setTasks(prevTasks =>
            prevTasks.map(task => (task.id === taskId ? { ...task, ...updates } : task))
        );
    }, []);

    const startGeneration = useCallback((newTask: GenerationTask) => {
        setTasks(prevTasks => {
            // Prevent adding duplicate tasks if one is already queued or running
            if (prevTasks.some(t => t.id === newTask.id && (t.status === 'queued' || t.status === 'running'))) {
                console.warn(`Task with ID ${newTask.id} is already in the queue or running.`);
                return prevTasks;
            }
            // Add task to the queue
            return [...prevTasks, { ...newTask, status: 'queued', progress: 0, message: 'Queued...' }];
        });
        
        // Show the modal automatically only for tasks that are not from the magic creator,
        // as it has its own inline progress display.
        if (newTask.context.view !== 'magicCreator') {
            if (!isProgressModalVisible) {
                setIsProgressModalVisible(true);
            }
        }
    }, [isProgressModalVisible]);

    const cancelGeneration = useCallback((taskId: string) => {
        setTasks(prevTasks => {
            const taskToCancel = prevTasks.find(t => t.id === taskId);
            if (!taskToCancel || (taskToCancel.status !== 'running' && taskToCancel.status !== 'queued')) {
                return prevTasks; // Task not found or not in a cancellable state
            }

            // If the task is currently active, abort the API call
            if (activeGenerationId === taskId && activeController.current) {
                activeController.current.abort();
                activeController.current = null; // Clear the controller
            }

            // Fix: Rewrote map to use a block body to prevent TypeScript from incorrectly widening the 'status' literal type to 'string'.
            // Update status and filter out the cancelled task immediately
            return prevTasks.map((task): GenerationTask => {
                if (task.id === taskId) {
                    return { ...task, status: 'cancelled', message: 'Cancelled by user.' };
                }
                return task;
            }).filter(task => task.id !== taskId); // Remove cancelled tasks from the list immediately
        });
    }, [activeGenerationId]);

    const showProgressModal = useCallback(() => setIsProgressModalVisible(true), []);
    const hideProgressModal = useCallback(() => {
        setIsProgressModalVisible(false);
        // Clean up all completed, error, or cancelled tasks when modal is hidden
        setTasks(prevTasks => prevTasks.filter(task => task.status === 'running' || task.status === 'queued'));
    }, []);

    // Effect to process the generation queue
    useEffect(() => {
        // Find the next queued task
        const nextQueuedTask = tasks.find(t => t.status === 'queued');

        // If there's a queued task and no task is currently active, start processing it
        if (nextQueuedTask && !activeGenerationId) {
            setActiveGenerationId(nextQueuedTask.id); // Mark this task as active

            const controller = new AbortController();
            activeController.current = controller; // Store the controller to allow cancellation

            const executeTask = async () => {
                // Update the task status to 'running'
                updateTask(nextQueuedTask.id, { status: 'running', message: 'Starting process...' });

                // Callback for progress updates from Gemini service
                const onProgressCallback = (progress: number, message: string) => {
                    updateTask(nextQueuedTask.id, { progress, message });
                };

                try {
                    let result;
                    // --- Content Generation (main article, social posts, image) ---
                    if (nextQueuedTask.context.type === 'content') {
                        const { topic, language, shouldGenerateImage, selectedPlatforms, generationContext, userId, project, campaign, sourceCalendarEventId } = nextQueuedTask.context.params;
                        
                        if (!topic) {
                           throw new Error("Missing 'topic' for content generation task.");
                        }

                        // Ensure topic is a string for the Gemini service call
                        const topicNameString = typeof topic === 'string' ? topic : (topic as Topic).name;
                        
                        result = await generateContentFlow(
                            topicNameString,
                            language || 'English', // Default language if not provided
                            shouldGenerateImage || false,
                            selectedPlatforms || new Set(),
                            onProgressCallback,
                            generationContext,
                        );

                        // Save generated content if context is available (from dashboard or magic creator)
                        if (userId && topic && typeof topic !== 'string' && topic.id && project?.id && campaign?.id) {
                            const topicObj = topic as Topic;
                            const contentId = await saveGeneratedContent(userId, topicObj.name, language || 'English', result, {
                                projectId: project.id,
                                campaignId: campaign.id,
                                topicId: topicObj.id,
                            });

                            // Link back to calendar event if source ID is present
                            if (sourceCalendarEventId && contentId) {
                                await linkContentToCalendarEvent(sourceCalendarEventId, contentId);
                            }
                        }
                    } 
                    // --- Topic Generation (AI suggestions for new topics) ---
                    else if (nextQueuedTask.context.type === 'topics') {
                        const { project, campaign, count, userId } = nextQueuedTask.context.params;
                        if (!project || !campaign || !count || !userId) {
                            throw new Error("Missing parameters for topics generation.");
                        }
                        const topicsArray = await generateTopicsAI(project, campaign, count);
                        result = topicsArray; // Store the array of topic names
                        await addMultipleTopics(result.map((name: string) => ({ name })), userId, project.id, campaign.id);
                    } 
                    // --- Content Refinement (re-writing specific platform content) ---
                    else if (nextQueuedTask.context.type === 'refineContent') {
                        const { platform, topic, currentContent, userPrompt, language } = nextQueuedTask.context.params;
                        if (!platform || !topic || !currentContent || !userPrompt || !language) {
                            throw new Error("Missing parameters for content refinement.");
                        }
                        const topicNameString = typeof topic === 'string' ? topic : (topic as Topic).name;
                        result = await regeneratePlatformContent(platform, topicNameString, currentContent, userPrompt, language);
                    }
                    // --- Existing Content Analysis ---
                    else if (nextQueuedTask.context.type === 'analyzeContent') {
                        const { content } = nextQueuedTask.context.params;
                        if (!content || !content.id) {
                            throw new Error("Missing content or content ID for analysis task.");
                        }
                        const platformsToAnalyze = (['web', 'tiktok', 'facebook'] as const).filter(p => content[p]);
                        onProgressCallback(25, 'Analyzing content...');
                        result = await analyzePerformance(content, platformsToAnalyze);
                        onProgressCallback(75, 'Saving analysis...');
                        await updateContentAnalysis(content.id, result);
                    }
                     // --- Calendar Suggestions ---
                    else if (nextQueuedTask.context.type === 'calendarSuggestions') {
                        const { calendarSettings, currentDate, userId } = nextQueuedTask.context.params;
                        if (!calendarSettings || !currentDate || !userId) {
                            throw new Error("Missing parameters for calendar suggestion generation.");
                        }
                        onProgressCallback(25, 'Searching for trends and events...');
                        result = await generateCalendarSuggestions(calendarSettings, currentDate);
                        onProgressCallback(75, 'Populating calendar...');
                        
                        const eventsToAdd = result.map((suggestion: any) => ({
                            title: suggestion.title,
                            start: suggestion.date,
                            status: suggestion.type === 'trend' ? 'suggested_trend' : 'suggested_event',
                            type: suggestion.type,
                        }));
                        await addCalendarEventsBatch(userId, eventsToAdd);
                    }
                    
                    // Check if the task was aborted during processing
                    if (controller.signal.aborted) {
                        updateTask(nextQueuedTask.id, { status: 'cancelled', message: 'Task cancelled.' });
                    } else {
                        // Task completed successfully
                        updateTask(nextQueuedTask.id, { status: 'success', message: 'Generation complete!', progress: 100, generatedResult: result });
                        // Call the success callback provided in the task context
                        if (nextQueuedTask.context.onSuccess) {
                            if (nextQueuedTask.context.type === 'refineContent' && nextQueuedTask.context.params.platform) {
                                nextQueuedTask.context.onSuccess(result, nextQueuedTask.context.params.platform);
                            } else {
                                nextQueuedTask.context.onSuccess(result);
                            }
                        }
                    }
                } catch (e: any) {
                    if (e.name === 'AbortError') {
                        updateTask(nextQueuedTask.id, { status: 'cancelled', message: 'Generation cancelled.' });
                    } else {
                        console.error(`Error during generation for task ${nextQueuedTask.id}:`, e);
                        const errorMessage = e.message || 'An unexpected error occurred.';
                        updateTask(nextQueuedTask.id, { status: 'error', message: errorMessage, progress: nextQueuedTask.progress || 0 });
                        if (nextQueuedTask.context.onError) {
                            nextQueuedTask.context.onError(e);
                        }
                    }
                } finally {
                    // Reset active task state after completion, error, or cancellation
                    setActiveGenerationId(null);
                    activeController.current = null;
                }
            };
            executeTask();
        }
    }, [tasks, activeGenerationId, updateTask, cancelGeneration]);

    // Filter active tasks (queued, running, success, error) for display
    const activeGenerations = tasks.filter(
        task => ['queued', 'running', 'success', 'error'].includes(task.status)
    );
    // Determine the primary active task for the modal (running first, then first queued)
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