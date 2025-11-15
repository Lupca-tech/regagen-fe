import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, getCalendarSettings, saveCalendarSettings, getCalendarEvents, updateCalendarEvent, deleteCalendarEventsBatch } from '../services/firebaseService';
import { CalendarSettings, CalendarEvent, View } from '../types';
import { useGeneration } from '../contexts/GenerationContext';

import { useCalendar } from './calendar/hooks/useCalendar';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarGrid } from './calendar/CalendarGrid';
import { MobileCalendarView } from './calendar/MobileCalendarView';
import { SettingsModal } from './calendar/modals/SettingsModal';
import { EventModal } from './calendar/modals/EventModal';
import { DeleteConfirmationModal } from './calendar/modals/DeleteConfirmationModal';
import { UpcomingEventsDrawer } from './calendar/UpcomingEventsDrawer';
import { SkeletonItem } from './Icons';

interface CalendarDashboardProps {
    user: User;
    onNavigate: (view: View, context?: any) => void;
}

export const CalendarDashboard: React.FC<CalendarDashboardProps> = ({ user, onNavigate }) => {
    const [settings, setSettings] = useState<CalendarSettings | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState({ settings: true, events: true, deleting: false });
    const [error, setError] = useState<string | null>(null);
    
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [generationSuccess, setGenerationSuccess] = useState(false);
    const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
    const existingEventIdsRef = useRef<Set<string>>(new Set());
    const [isUpcomingDrawerOpen, setIsUpcomingDrawerOpen] = useState(false);
    
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventIds: string[] }>({ isOpen: false, eventIds: [] });

    const { startGeneration, activeGenerations } = useGeneration();
    const generationTask = activeGenerations.find(g => g.context.type === 'calendarSuggestions');

    const { monthGrid, daysOfWeek, eventsByDay, allDaysInMonth } = useCalendar(currentDate, events);

    const fetchSettings = useCallback(async () => {
        setLoading(prev => ({ ...prev, settings: true }));
        setError(null);
        try {
            const userSettings = await getCalendarSettings(user.uid);
            if (userSettings) setSettings(userSettings);
            else setIsSettingsModalOpen(true);
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
        if (settings) fetchEvents();
    }, [settings, fetchEvents]);

    useEffect(() => {
        if (existingEventIdsRef.current.size > 0) {
            const currentEventIds = new Set(events.map(e => e.id));
            const newIds = new Set([...currentEventIds].filter(id => !existingEventIdsRef.current.has(id)));
            if (newIds.size > 0) {
                setNewEventIds(newIds);
                const timer = setTimeout(() => setNewEventIds(new Set()), 5000);
                existingEventIdsRef.current.clear();
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
        existingEventIdsRef.current = new Set(events.map(e => e.id));
        startGeneration({
            id: `calendar-${user.uid}-${Date.now()}`,
            topicName: 'Generate Calendar Ideas',
            status: 'queued', progress: 0, message: 'Queued for idea generation...',
            context: {
                type: 'calendarSuggestions', view: 'calendar',
                params: { userId: user.uid, calendarSettings: settings, currentDate: currentDate },
                onSuccess: () => {
                    setGenerationSuccess(true);
                    setTimeout(() => setGenerationSuccess(false), 5000);
                    fetchEvents();
                },
                onError: (err: Error) => setError(err.message)
            }
        });
    };
    
    const handleEventSave = async (event: CalendarEvent, data: Partial<CalendarEvent>) => {
        try {
            await updateCalendarEvent(event.id, data);
            fetchEvents();
        } catch(e: any) {
            setError(e.message);
        } finally {
            setSelectedEvent(null);
        }
    };

    const handleSingleEventDelete = (event: CalendarEvent) => {
        setDeleteConfirmation({ isOpen: true, eventIds: [event.id] });
        setSelectedEvent(null);
    };
    
    const handleCreateContent = (event: CalendarEvent) => {
        onNavigate('magicCreator', { prefillTopic: event.title, sourceCalendarEventId: event.id });
    };

    const handleViewContent = (contentId: string) => {
        onNavigate('projects', { contentId });
        setSelectedEvent(null);
    };

    const changeMonth = (delta: number) => {
        setIsSelectionMode(false);
        setSelectedEventIds(new Set());
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(prev => !prev);
        setSelectedEventIds(new Set());
    };

    const handleEventClick = (event: CalendarEvent) => {
        if (isSelectionMode) {
            setSelectedEventIds(prev => {
                const newSet = new Set(prev);
                newSet.has(event.id) ? newSet.delete(event.id) : newSet.add(event.id);
                return newSet;
            });
        } else {
            setSelectedEvent(event);
        }
    };
    
    const handleDeleteSelected = () => {
        if (selectedEventIds.size > 0) {
            setDeleteConfirmation({ isOpen: true, eventIds: Array.from(selectedEventIds) });
        }
    };

    const handleDeleteAllInMonth = () => {
        const allMonthEventIds = events.map(e => e.id);
        if (allMonthEventIds.length > 0) {
            setDeleteConfirmation({ isOpen: true, eventIds: allMonthEventIds });
        }
    };

    const handleConfirmDelete = async () => {
        setLoading(prev => ({ ...prev, deleting: true }));
        setError(null);
        try {
            await deleteCalendarEventsBatch(deleteConfirmation.eventIds);
            setDeleteConfirmation({ isOpen: false, eventIds: [] });
            setSelectedEventIds(new Set());
            setIsSelectionMode(false);
            fetchEvents();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(prev => ({ ...prev, deleting: false }));
        }
    };

    const upcomingEventsForDrawer = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return events
            .filter(event => new Date(event.start) >= today)
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [events]);

    if (loading.settings) return <div className="p-6 text-center text-zinc-400">Loading calendar settings...</div>;
    if (isSettingsModalOpen) return <SettingsModal onSave={handleSaveSettings} onClose={() => setIsSettingsModalOpen(false)} isSaving={loading.settings} initialSettings={settings} />;

    return (
        <div className="bg-zinc-950/50 p-4 md:p-6 rounded-xl border border-zinc-800 animate-fade-in-fast relative">
            {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300 animate-fade-in flex justify-between items-center">
                    <div className="flex-grow"><p className="font-bold">An Error Occurred</p><p className="text-sm mt-1 whitespace-pre-wrap">{error}</p></div>
                    <button onClick={() => setError(null)} className="text-xl font-bold hover:text-white transition-colors flex-shrink-0 ml-4">&times;</button>
                </div>
            )}
            {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onSave={handleEventSave} onDelete={handleSingleEventDelete} onCreateContent={handleCreateContent} onViewContent={handleViewContent} />}
            {deleteConfirmation.isOpen && <DeleteConfirmationModal count={deleteConfirmation.eventIds.length} onClose={() => setDeleteConfirmation({ isOpen: false, eventIds: [] })} onConfirm={handleConfirmDelete} isDeleting={loading.deleting} />}
            <UpcomingEventsDrawer isOpen={isUpcomingDrawerOpen} onClose={() => setIsUpcomingDrawerOpen(false)} events={upcomingEventsForDrawer} onEventClick={setSelectedEvent} />

            <CalendarHeader
                currentDate={currentDate}
                isSelectionMode={isSelectionMode}
                generationTask={generationTask}
                generationSuccess={generationSuccess}
                eventsCount={events.length}
                selectedEventCount={selectedEventIds.size}
                onChangeMonth={changeMonth}
                onToggleSelectionMode={toggleSelectionMode}
                onOpenUpcomingDrawer={() => setIsUpcomingDrawerOpen(true)}
                onGetAIIdeas={handleGetIdeas}
                onDeleteAll={handleDeleteAllInMonth}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onDeleteSelected={handleDeleteSelected}
            />
            
            <div className="block md:hidden">
                {loading.events ? 
                    <div className="space-y-4">{Array.from({length: 4}).map((_, i) => <SkeletonItem key={i}/>)}</div> :
                    <MobileCalendarView
                        allDaysInMonth={allDaysInMonth}
                        eventsByDay={eventsByDay}
                        isSelectionMode={isSelectionMode}
                        selectedEventIds={selectedEventIds}
                        newEventIds={newEventIds}
                        onEventClick={handleEventClick}
                    />
                }
            </div>
            
            <div className="hidden md:block">
                {loading.events ? 
                    <div className="grid grid-cols-7 gap-1">{Array.from({length: 35}).map((_, i) => <div key={i} className="h-32 bg-zinc-900/50 rounded-md p-1 border border-zinc-800/50 animate-pulse"></div>)}</div> :
                    <CalendarGrid
                        monthGrid={monthGrid}
                        daysOfWeek={daysOfWeek}
                        eventsByDay={eventsByDay}
                        isSelectionMode={isSelectionMode}
                        selectedEventIds={selectedEventIds}
                        newEventIds={newEventIds}
                        onEventClick={handleEventClick}
                    />
                }
            </div>
        </div>
    );
};
