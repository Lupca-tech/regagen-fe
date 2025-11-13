import React from 'react';
import { useGeneration, GenerationTask } from '../contexts/GenerationContext';

const SparkleIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.75.75V6h.75a.75.75 0 010 1.5H9.75v.75a.75.75 0 01-1.5 0V7.5H7.5a.75.75 0 010-1.5H8.25V5.25A.75.75 0 019 4.5zM12.75 7.5a.75.75 0 01.75-.75H15v-.75a.75.75 0 011.5 0V6.75H17.25a.75.75 0 010 1.5H16.5v.75a.75.75 0 01-1.5 0V8.25H13.5a.75.75 0 01-.75-.75zM15 12a.75.75 0 01.75.75V15h.75a.75.75 0 010 1.5H15.75v.75a.75.75 0 01-1.5 0V16.5H13.5a.75.75 0 010-1.5H14.25v-.75A.75.75 0 0115 12zM12 1.5a.75.75 0 01.75.75V3h.75a.75.75 0 010 1.5H12.75v.75a.75.75 0 01-1.5 0V4.5H10.5a.75.75 0 010-1.5H11.25V2.25A.75.75 0 0112 1.5zM10.5 18.75a.75.75 0 01.75.75V21h.75a.75.75 0 010 1.5H11.25v.75a.75.75 0 01-1.5 0V22.5H9a.75.75 0 010-1.5h.75v-.75a.75.75 0 01.75-.75zM18.75 10.5a.75.75 0 01.75.75V12h.75a.75.75 0 010 1.5H19.5v.75a.75.75 0 01-1.5 0V13.5H17.25a.75.75 0 010-1.5H18v-.75a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
const CheckCircleIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>;
const ExclamationCircleIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" /></svg>;
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

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
        activeTask, 
        isProgressModalVisible, 
        hideProgressModal, 
        showProgressModal,
        cancelGeneration
    } = useGeneration();

    if (activeGenerations.length === 0) {
        return null;
    }

    if (isProgressModalVisible) {
        if (!activeTask) return null; // Should not happen if generations exist
        const otherTasks = activeGenerations.filter(t => t.id !== activeTask.id);

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-zinc-800">
                        <h2 className="text-2xl font-bold text-center">Generation in Progress</h2>
                        <p className="text-zinc-400 text-center mt-1">Your content is being created...</p>
                    </div>
                    
                    <div className="p-6 flex-grow overflow-y-auto space-y-4">
                        <div>
                            <p className="text-sm text-zinc-400 mb-2">Currently processing:</p>
                            <GenerationTaskItem task={activeTask} onCancel={cancelGeneration} />
                        </div>

                        {otherTasks.length > 0 && (
                            <div>
                                <p className="text-sm text-zinc-400 mb-2">In queue:</p>
                                <div className="space-y-3">
                                    {otherTasks.map(task => (
                                        <GenerationTaskItem key={task.id} task={task} onCancel={cancelGeneration} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                        <button 
                            onClick={hideProgressModal} 
                            className="w-full px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                        >
                            Minimize
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
                aria-label={`Open generation queue, ${activeGenerations.length} items active`}
            >
                <SparkleIcon className="w-7 h-7 text-pink-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-pink-600 text-white text-xs font-bold rounded-full border-2 border-zinc-900">
                    {activeGenerations.length}
                </span>
            </button>
        </div>
    );
};