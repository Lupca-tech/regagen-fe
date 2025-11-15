import React from 'react';
import type { GenerationTask } from '../../contexts/GenerationContext';
import { 
    BackIcon, 
    SparkleIcon, 
    CheckCircleIcon, 
    SettingsIcon, 
    CalendarIcon, 
    TrashIcon 
} from '../Icons';
import { MoreOptionsMenu } from './MoreOptionsMenu';

interface CalendarHeaderProps {
    currentDate: Date;
    isSelectionMode: boolean;
    generationTask: GenerationTask | undefined;
    generationSuccess: boolean;
    eventsCount: number;
    selectedEventCount: number;
    onChangeMonth: (delta: number) => void;
    onToggleSelectionMode: () => void;
    onOpenUpcomingDrawer: () => void;
    onGetAIIdeas: () => void;
    onDeleteAll: () => void;
    onOpenSettings: () => void;
    onDeleteSelected: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    isSelectionMode,
    generationTask,
    generationSuccess,
    eventsCount,
    selectedEventCount,
    onChangeMonth,
    onToggleSelectionMode,
    onOpenUpcomingDrawer,
    onGetAIIdeas,
    onDeleteAll,
    onOpenSettings,
    onDeleteSelected
}) => {
    return (
        <>
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => onChangeMonth(-1)} className="p-2 rounded-md hover:bg-zinc-800"><BackIcon /></button>
                    <h2 className="text-xl md:text-2xl font-bold w-40 md:w-48 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => onChangeMonth(1)} className="p-2 rounded-md hover:bg-zinc-800"><BackIcon className="transform rotate-180" /></button>
                </div>
                <div className="flex items-center gap-2 self-center">
                    <button onClick={onToggleSelectionMode} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${isSelectionMode ? 'bg-pink-900/50 border-pink-500/80 text-pink-300' : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                        {isSelectionMode ? 'Cancel' : 'Select'}
                    </button>
                    <button onClick={onOpenUpcomingDrawer} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors">
                        <CalendarIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">Upcoming</span>
                    </button>
                    <div className="relative">
                        <button onClick={onGetAIIdeas} disabled={!!generationTask} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50">
                            <SparkleIcon className={generationTask ? 'animate-pulse' : ''}/>
                            Get AI Ideas
                        </button>
                        {generationSuccess && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max px-3 py-1.5 text-xs font-medium rounded-md bg-green-600/20 text-green-300 border border-green-500/30 animate-fade-in">
                                <CheckCircleIcon className="w-4 h-4 inline mr-1.5" /> Successfully added new ideas!
                            </div>
                        )}
                    </div>
                     <MoreOptionsMenu onDeleteAll={onDeleteAll} disabled={eventsCount === 0} />
                     <button onClick={onOpenSettings} className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Edit Settings"><SettingsIcon className="w-5 h-5"/></button>
                </div>
            </div>
            
            {isSelectionMode && selectedEventCount > 0 && (
                <div className="bg-zinc-800 p-3 rounded-xl shadow-lg flex justify-between items-center gap-4 animate-fade-in border border-zinc-700 mb-4">
                    <p className="text-sm font-semibold text-zinc-200">{selectedEventCount} item{selectedEventCount > 1 ? 's' : ''} selected</p>
                    <div className="flex items-center gap-2">
                         <button onClick={onToggleSelectionMode} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                         <button onClick={onDeleteSelected} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg">
                            <TrashIcon className="w-4 h-4"/> Delete
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
