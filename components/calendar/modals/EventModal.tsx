import React, { useState } from 'react';
import type { CalendarEvent } from '../../../types';
import { SparkleIcon, WebIcon } from '../../Icons';

interface EventModalProps { 
    event: CalendarEvent; 
    onClose: () => void; 
    onSave: (event: CalendarEvent, data: Partial<CalendarEvent>) => void; 
    onDelete: (event: CalendarEvent) => void;
    onCreateContent: (event: CalendarEvent) => void; 
    onViewContent: (contentId: string) => void;
}

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500/30 bg-green-900/30';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/30';
    return 'text-red-400 border-red-500/30 bg-red-900/30';
};

const StrategicSuggestionView: React.FC<Omit<EventModalProps, 'onSave'>> = ({ event, onClose, onDelete, onCreateContent }) => {
    const handleCreateFromAngle = (angleTitle: string) => {
        const eventForCreation = { ...event, title: angleTitle };
        onCreateContent(eventForCreation);
    };

    return (
        <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-700 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 text-center">
                <h2 className="text-xl font-bold text-pink-400">{event.title}</h2>
                <p className="text-sm text-zinc-400">{new Date(event.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="p-6 flex-grow overflow-y-auto space-y-6">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-2">🧠 AI Insight</h3>
                    <p className="text-zinc-300 bg-zinc-800/50 p-3 rounded-md border border-zinc-700">{event.insight}</p>
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-2">🎯 Suggested Angles</h3>
                    <div className="space-y-3">
                        {event.suggestedAngles?.map((angle, index) => (
                            <div key={index} className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="font-semibold text-zinc-200 flex-grow">{angle.title}</p>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className={`text-xs font-bold px-2 py-1 rounded-md border ${getScoreColor(angle.predictionScore)}`}>
                                        Score: {angle.predictionScore}/100
                                    </div>
                                    <button onClick={() => handleCreateFromAngle(angle.title)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors">
                                        <SparkleIcon className="w-4 h-4" /> Create
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center p-4 border-t border-zinc-800 bg-zinc-900/50 rounded-b-2xl">
                <button onClick={() => onDelete(event)} className="px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/50 rounded-lg">Delete Suggestion</button>
                <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Close</button>
            </div>
        </div>
    );
};

const ManualEventView: React.FC<EventModalProps> = ({ event, onClose, onSave, onDelete, onCreateContent, onViewContent }) => {
    const [title, setTitle] = useState(event.title);
    const [status, setStatus] = useState(event.status);
    
    const statusOptions: CalendarEvent['status'][] = event.status.startsWith('suggested') 
        ? [event.status, 'draft'] 
        : ['draft', 'published'];

    const handleSave = () => onSave(event, { title, status });

    return (
        <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 text-center">Edit Event</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
                    <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded-md" />
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-zinc-300 mb-1">Status</label>
                    <select id="status" value={status} onChange={e => setStatus(e.target.value as CalendarEvent['status'])} className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded-md">
                       {statusOptions.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                </div>
                {event.status.startsWith('suggested') && !event.contentId && (
                     <button onClick={() => onCreateContent(event)} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                        <SparkleIcon/> Create Content from this Idea
                    </button>
                )}
                {event.contentId && (
                    <button onClick={() => onViewContent(event.contentId!)} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-pink-300 bg-pink-900/30 border border-pink-500/50 rounded-lg hover:bg-pink-900/50">
                        <WebIcon/> View Generated Content
                    </button>
                )}
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-800">
                <button onClick={() => onDelete(event)} className="px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/50 rounded-lg">Delete</button>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                    <button onClick={handleSave} disabled={!title.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export const EventModal: React.FC<EventModalProps> = (props) => {
    const { event, onClose } = props;
    const isStrategicSuggestion = (event.type === 'trend' || event.type === 'event') && event.insight && event.suggestedAngles;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            {isStrategicSuggestion ? <StrategicSuggestionView {...props} /> : <ManualEventView {...props} />}
        </div>
    );
};
