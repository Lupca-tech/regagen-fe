import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, getCalendarSettings, saveCalendarSettings, getCalendarEvents, updateCalendarEvent, deleteCalendarEvent, addCalendarEventsBatch } from '../services/firebaseService';
import { CalendarSettings, CalendarEvent, View } from '../types';
import { useGeneration } from '../contexts/GenerationContext';
import { BackIcon, SparkleIcon, CheckCircleIcon, XCircleIcon, SettingsIcon } from './Icons';

// --- PROPS ---
interface CalendarDashboardProps {
    user: User;
    onNavigate: (view: View, context?: any) => void;
}

// --- SUB-COMPONENTS ---
const SettingsModal: React.FC<{ 
    onSave: (settings: Omit<CalendarSettings, 'userId'>) => void;
    onClose: () => void;
    isSaving: boolean;
    initialSettings?: Omit<CalendarSettings, 'userId'> | null;
}> = ({ onSave, onClose, isSaving, initialSettings }) => {
    const [mainTopics, setMainTopics] = useState(initialSettings?.mainTopics || '');
    const [targetAudience, setTargetAudience] = useState(initialSettings?.targetAudience || '');
    const isEditMode = !!initialSettings;

    const handleSave = () => {
        if (mainTopics.trim() && targetAudience.trim()) {
            onSave({ mainTopics, targetAudience });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-2">{isEditMode ? 'Edit Content Assistant Settings' : 'Setup Your Content Assistant'}</h2>
                <p className="text-zinc-400 text-center mb-6">{isEditMode ? 'Update your topics and audience to refine AI suggestions.' : 'Tell the AI what you\'re about so it can find the best ideas for you.'}</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="mainTopics" className="block text-sm font-medium text-zinc-300 mb-1">What are your main topics?</label>
                        <textarea id="mainTopics" value={mainTopics} onChange={e => setMainTopics(e.target.value)} rows={3} placeholder="e.g., Personal finance, investing for beginners, self-development" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="targetAudience" className="block text-sm font-medium text-zinc-300 mb-1">Who is your target audience?</label>
                        <textarea id="targetAudience" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} rows={2} placeholder="e.g., Gen Z and young millennials in Vietnam" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded-md" />
                    </div>
                </div>
                 <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-zinc-800">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving || !mainTopics.trim() || !targetAudience.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EventModal: React.FC<{ 
    event: CalendarEvent; 
    onClose: () => void; 
    onSave: (event: CalendarEvent, data: Partial<CalendarEvent>) => void; 
    onDelete: (event: CalendarEvent) => void;
    onCreateContent: (event: CalendarEvent) => void; 
}> = ({ event, onClose, onSave, onDelete, onCreateContent }) => {
    const [title, setTitle] = useState(event.title);
    const [status, setStatus] = useState(event.status);
    const isSuggestion = event.status.startsWith('suggested');
    const statusOptions: CalendarEvent['status'][] = isSuggestion ? [event.status, 'draft'] : ['draft', 'published'];

    const handleSave = () => {
        onSave(event, { title, status });
    };

    return (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
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
                    {isSuggestion && (
                         <button onClick={() => onCreateContent(event)} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                            <SparkleIcon/> Create Content from this Idea
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
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{
    event: CalendarEvent;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}> = ({ event, onClose, onConfirm, isDeleting }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-red-500/50 shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center text-red-400">Delete Event?</h2>
            <p className="text-zinc-400 text-center my-4">
                Are you sure you want to permanently delete the event "{event.title}"?
                <br/><br/>
                <strong className="text-red-300">This action cannot be undone.</strong>
            </p>
            <div className="flex justify-end gap-3 pt-4">
                <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg disabled:opacity-50">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
            </div>
        </div>
    </div>
);


// --- MAIN COMPONENT ---
export const CalendarDashboard: React.FC<CalendarDashboardProps> = ({ user, onNavigate }) => {
    const [settings, setSettings] = useState<CalendarSettings | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState({ settings: true, events: true, generation: false });
    const [error, setError] = useState<string | null>(null);
    
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [generationSuccess, setGenerationSuccess] = useState(false);
    const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
    const existingEventIdsRef = useRef<Set<string>>(new Set());

    const { startGeneration, activeGenerations } = useGeneration();
    const generationTask = activeGenerations.find(g => g.context.type === 'calendarSuggestions');

    const fetchSettings = useCallback(async () => {
        setLoading(prev => ({ ...prev, settings: true }));
        setError(null);
        try {
            const userSettings = await getCalendarSettings(user.uid);
            if (userSettings) {
                setSettings(userSettings);
            } else {
                setIsSettingsModalOpen(true);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(prev => ({ ...prev, settings: false }));
        }
    }, [user.uid]);

    const fetchEvents = useCallback(async () => {
        setLoading(prev => ({ ...prev, events: true }));
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        try {
            const calendarEvents = await getCalendarEvents(user.uid, startOfMonth, endOfMonth);
            setEvents(calendarEvents);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(prev => ({ ...prev, events: false }));
        }
    }, [user.uid, currentDate]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        if (settings) {
            fetchEvents();
        }
    }, [settings, fetchEvents]);

    // Effect to detect and animate new events after generation
    useEffect(() => {
        if (existingEventIdsRef.current.size > 0) {
            const currentEventIds = new Set(events.map(e => e.id));
            const newIds = new Set(
                [...currentEventIds].filter(id => !existingEventIdsRef.current.has(id))
            );

            if (newIds.size > 0) {
                setNewEventIds(newIds);
                const timer = setTimeout(() => {
                    setNewEventIds(new Set());
                }, 5000); // Animation duration

                existingEventIdsRef.current.clear(); // Consume the ref
                return () => clearTimeout(timer);
            }
        }
    }, [events]);

    const handleSaveSettings = async (newSettings: Omit<CalendarSettings, 'userId'>) => {
        setLoading(prev => ({ ...prev, settings: true }));
        try {
            await saveCalendarSettings(user.uid, newSettings);
            setSettings({ ...newSettings, userId: user.uid });
            setIsSettingsModalOpen(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(prev => ({ ...prev, settings: false }));
        }
    };

    const handleGetIdeas = () => {
        if (!settings || generationTask) return;
        setError(null);
        
        // Store current event IDs to identify new ones later
        existingEventIdsRef.current = new Set(events.map(e => e.id));

        startGeneration({
            id: `calendar-${user.uid}-${Date.now()}`,
            topicName: 'Generate Calendar Ideas',
            status: 'queued',
            progress: 0,
            message: 'Queued for idea generation...',
            context: {
                type: 'calendarSuggestions',
                view: 'calendar',
                params: {
                    userId: user.uid,
                    calendarSettings: settings,
                    currentDate: currentDate,
                },
                onSuccess: () => {
                    setGenerationSuccess(true);
                    setTimeout(() => setGenerationSuccess(false), 5000); // Hide after 5s
                    fetchEvents(); // Re-fetch events which will trigger the highlight effect
                },
                onError: (err: Error) => {
                    setError(err.message);
                }
            }
        });
    };
    
    const handleEventSave = async (event: CalendarEvent, data: Partial<CalendarEvent>) => {
        try {
            await updateCalendarEvent(event.id, data);
            fetchEvents(); // Refresh
        } catch(e: any) {
            setError(e.message);
        } finally {
            setSelectedEvent(null);
        }
    };

    const handleEventDelete = (event: CalendarEvent) => {
        setSelectedEvent(null);
        setEventToDelete(event);
    };

    const handleConfirmDelete = async () => {
        if (!eventToDelete) return;
        setIsDeleting(true);
        try {
            await deleteCalendarEvent(eventToDelete.id);
            fetchEvents();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setEventToDelete(null);
            setIsDeleting(false);
        }
    };

    const handleCreateContent = (event: CalendarEvent) => {
        onNavigate('magicCreator', { prefillTopic: event.title, sourceCalendarEventId: event.id });
    };

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const { monthGrid, daysOfWeek } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthGrid: (Date | null)[] = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            monthGrid.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            monthGrid.push(new Date(year, month, i));
        }

        return { monthGrid, daysOfWeek };
    }, [currentDate]);

    const getEventPillStyle = (status: CalendarEvent['status']) => {
        switch (status) {
            case 'suggested_trend': return 'bg-blue-900/50 text-blue-300 border-blue-500/30';
            case 'suggested_event': return 'bg-purple-900/50 text-purple-300 border-purple-500/30';
            case 'draft': return 'bg-zinc-700/50 text-zinc-300 border-zinc-500/30';
            case 'published': return 'bg-green-900/50 text-green-300 border-green-500/30';
            default: return 'bg-zinc-800';
        }
    };
    
    if (loading.settings) {
        return <div className="p-6 text-center text-zinc-400">Loading calendar settings...</div>
    }

    if (isSettingsModalOpen) {
        return <SettingsModal 
            onSave={handleSaveSettings} 
            onClose={() => setIsSettingsModalOpen(false)}
            isSaving={loading.settings}
            initialSettings={settings}
        />;
    }

    return (
        <div className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-800 animate-fade-in-fast">
            {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300 animate-fade-in flex justify-between items-center">
                    <div className="flex-grow">
                        <p className="font-bold">An Error Occurred</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-xl font-bold hover:text-white transition-colors flex-shrink-0 ml-4">&times;</button>
                </div>
            )}
            {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onSave={handleEventSave} onDelete={handleEventDelete} onCreateContent={handleCreateContent} />}
            {eventToDelete && <DeleteConfirmationModal event={eventToDelete} onClose={() => setEventToDelete(null)} onConfirm={handleConfirmDelete} isDeleting={isDeleting} />}

            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-zinc-800"><BackIcon className="transform rotate-0" /></button>
                    <h2 className="text-2xl font-bold w-48 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-zinc-800"><BackIcon className="transform rotate-180" /></button>
                </div>
                <div className="flex items-center gap-2 self-end md:self-center">
                     <button 
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="Edit Settings"
                    >
                        <SettingsIcon className="w-5 h-5"/>
                    </button>
                    <div className="relative">
                        <button onClick={handleGetIdeas} disabled={!!generationTask} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50">
                            <SparkleIcon className={generationTask ? 'animate-pulse' : ''}/>
                            {generationTask ? 'Getting Ideas...' : 'Get AI Ideas'}
                        </button>
                        {generationSuccess && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max px-3 py-1.5 text-xs font-medium rounded-md bg-green-600/20 text-green-300 border border-green-500/30 animate-fade-in">
                                <CheckCircleIcon className="w-4 h-4 inline mr-1.5" />
                                Successfully added new ideas to your calendar!
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map(day => <div key={day} className="text-center font-bold text-zinc-400 text-sm py-2">{day}</div>)}
                {monthGrid.map((day, index) => {
                    const dayEvents = day ? events.filter(e => new Date(e.start).toDateString() === day.toDateString()) : [];
                    return (
                        <div key={index} className={`h-32 bg-zinc-900/50 rounded-md p-1 border border-zinc-800/50 overflow-y-auto ${day ? '' : 'opacity-50'}`}>
                            {day && <span className="text-xs font-bold ml-1">{day.getDate()}</span>}
                            <div className="space-y-1 mt-1">
                                {dayEvents.map(event => (
                                     <button key={event.id} onClick={() => setSelectedEvent(event)} className={`w-full text-left p-1.5 text-xs rounded-md border ${getEventPillStyle(event.status)} ${newEventIds.has(event.id) ? 'pulse-glow' : ''}`}>
                                        <p className="font-semibold truncate">{event.title}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};