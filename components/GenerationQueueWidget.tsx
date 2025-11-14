



import React from 'react';
import { useGeneration, GenerationTask } from '../contexts/GenerationContext';
import { SparkleIcon, CheckCircleIcon, ExclamationCircleIcon, XIcon } from './Icons';
import { ContentTabs } from './ContentTabs'; // Import ContentTabs for displaying generated content

const GenerationTaskItem: React.FC<{
    task: GenerationTask;
    onCancel: (taskId: string) => void;
}> = ({ task, onCancel }) => {
    const isCancellable = task.status === 'running' || task.status === 'queued';
    return (
        <div className="group p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex items-center gap-3">
            <div className="flex-grow">
                <div className="flex justify-between items-center text-sm mb-2">
                    <p className="font-bold text-zinc-200 truncate pr-2">{task.topicName}</p>
                    {task.status === 'success' && <CheckCircleIcon className="text-green-400 flex-shrink-0" />}
                    {task.status === 'error' && <ExclamationCircleIcon className="text-red-400 flex-shrink-0" />}
                    {task.status === 'running' && (
                        <span className="font-mono text-pink-400 flex-shrink-0">{Math.round(task.progress)}%</span>
                    )}
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ease-linear ${
                            task.status === 'success' ? 'bg-green-500' :
                            task.status === 'error' ? 'bg-red-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-600'
                        }`}
                        style={{ width: `${task.progress}%` }}
                    ></div>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5 truncate">{task.message}</p>
            </div>
            {isCancellable && (
                <button
                    onClick={() => onCancel(task.id)}
                    className="flex-shrink-0 p-2 rounded-full text-zinc-500 hover:bg-red-900/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Cancel generation for ${task.topicName}`}
                >
                    <XIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};


export const GenerationQueueWidget = () => {
    const { 
        activeGenerations,
        isProgressModalVisible, 
        hideProgressModal, 
        showProgressModal,
        cancelGeneration
    } = useGeneration();

    // The widget should only be aware of tasks that are NOT from the Magic Creator,
    // as that component has its own inline progress UI.
    const widgetTasks = activeGenerations.filter(
        task => task.context.view !== 'magicCreator'
    );

    if (widgetTasks.length === 0) {
        return null;
    }

    // The primary task to display in the modal is the first running/queued task from the widget's list.
    const mainWidgetTask = widgetTasks.find(t => t.status === 'running') || widgetTasks.find(t => t.status === 'queued') || null;

    if (isProgressModalVisible) {
        if (!mainWidgetTask) return null; // Modal might be visible but no relevant tasks to show.
        const otherWidgetTasks = widgetTasks.filter(t => t.id !== mainWidgetTask.id);

        const isTaskComplete = mainWidgetTask.status === 'success' || mainWidgetTask.status === 'error';
        const modalTitle = mainWidgetTask.status === 'success' ? 'Generation Complete' :
                           mainWidgetTask.status === 'error' ? 'Generation Failed' :
                           'Generation in Progress';
        const modalMessage = mainWidgetTask.status === 'success' ? 'Your content has been created!' :
                             mainWidgetTask.status === 'error' ? mainWidgetTask.message :
                             'Your content is being created...';

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-zinc-800">
                        <h2 className="text-2xl font-bold text-center">{modalTitle}</h2>
                        <p className="text-zinc-400 text-center mt-1">{modalMessage}</p>
                    </div>
                    
                    <div className="p-6 flex-grow overflow-y-auto space-y-4">
                        {!isTaskComplete && (
                            <div>
                                <p className="text-sm text-zinc-400 mb-2">Currently processing:</p>
                                <GenerationTaskItem task={mainWidgetTask} onCancel={cancelGeneration} />
                            </div>
                        )}

                        {isTaskComplete && mainWidgetTask.generatedResult && (
                            <div className="animate-fade-in">
                                {mainWidgetTask.context.type === 'content' || mainWidgetTask.context.type === 'refineContent' ? (
                                    <>
                                        <p className="text-sm text-zinc-400 mb-2 font-bold">Generated Content for "{mainWidgetTask.topicName}":</p>
                                        <ContentTabs
                                            content={mainWidgetTask.generatedResult}
                                            topic={mainWidgetTask.topicName}
                                            language={mainWidgetTask.context.params.language || 'English'} // Assuming English if not specified
                                            onContentUpdate={() => {}} // Read-only in modal
                                            isReadOnly={true}
                                        />
                                    </>
                                ) : mainWidgetTask.context.type === 'topics' && Array.isArray(mainWidgetTask.generatedResult) ? (
                                    <>
                                        <p className="text-sm text-zinc-400 mb-2 font-bold">Generated Topics for "{mainWidgetTask.topicName}":</p>
                                        <ul className="list-disc list-inside space-y-1 text-zinc-300 ml-4">
                                            {mainWidgetTask.generatedResult.map((topic: string, index: number) => (
                                                <li key={index}>{topic}</li>
                                            ))}
                                        </ul>
                                    </>
                                ) : null}
                            </div>
                        )}

                        {otherWidgetTasks.length > 0 && (
                            <div>
                                <p className="text-sm text-zinc-400 mb-2">In queue:</p>
                                <div className="space-y-3">
                                    {otherWidgetTasks.map(task => (
                                        <GenerationTaskItem key={task.id} task={task} onCancel={cancelGeneration} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                        <button 
                            onClick={hideProgressModal} 
                            className={`w-full px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isTaskComplete ? 'bg-pink-600 hover:bg-pink-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                        >
                            {isTaskComplete ? 'Done' : 'Minimize'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button 
                onClick={showProgressModal} 
                className="relative flex items-center justify-center w-14 h-14 bg-zinc-900 border-2 border-zinc-700 rounded-full shadow-lg hover:border-pink-500 transition-all duration-300"
                aria-label={`Open generation queue, ${widgetTasks.length} items active`}
            >
                <SparkleIcon className="w-7 h-7 text-pink-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-pink-600 text-white text-xs font-bold rounded-full border-2 border-zinc-900">
                    {widgetTasks.length}
                </span>
            </button>
        </div>
    );
};