import React from 'react';
import type { CalendarEvent } from '../../types';
import { EventPill } from './EventPill';
import { WebIcon } from '../Icons';

interface MobileCalendarViewProps {
    allDaysInMonth: Date[];
    eventsByDay: Record<string, CalendarEvent[]>;
    isSelectionMode: boolean;
    selectedEventIds: Set<string>;
    newEventIds: Set<string>;
    onEventClick: (event: CalendarEvent) => void;
}

const MobileEventPill: React.FC<{
    event: CalendarEvent;
    onClick: (event: CalendarEvent) => void;
    isSelected: boolean;
    isNew: boolean;
}> = ({ event, onClick, isSelected, isNew }) => {
    
    const getEventPillStyle = (status: CalendarEvent['status']) => {
        switch (status) {
            case 'suggested_trend': return 'bg-blue-900/50 text-blue-300 border-blue-500/30 hover:bg-blue-900/80';
            case 'suggested_event': return 'bg-purple-900/50 text-purple-300 border-purple-500/30 hover:bg-purple-900/80';
            case 'draft': return 'bg-zinc-700/50 text-zinc-300 border-zinc-500/30 hover:bg-zinc-700/80';
            case 'published': return 'bg-green-900/50 text-green-300 border-green-500/30 hover:bg-green-900/80';
            default: return 'bg-zinc-800';
        }
    };
    
    return (
         <button 
            onClick={() => onClick(event)} 
            className={`relative w-full text-left p-3 rounded-lg border transition-colors ${isSelected ? 'border-pink-500/80 bg-pink-900/30' : getEventPillStyle(event.status)} ${isNew ? 'pulse-glow' : ''}`}
        >
            <div className="flex justify-between items-start gap-2">
                <p className="font-semibold">{event.title}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/20 flex-shrink-0 capitalize">{event.status.replace(/_/g, ' ')}</span>
            </div>
            {event.contentId && <WebIcon className="w-4 h-4 text-zinc-400 mt-2" />}
        </button>
    );
};

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
    allDaysInMonth,
    eventsByDay,
    isSelectionMode,
    selectedEventIds,
    newEventIds,
    onEventClick
}) => {
    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {allDaysInMonth.map(day => {
                const dayKey = day.toDateString();
                const dayEvents = eventsByDay[dayKey] || [];
                if (dayEvents.length === 0) return null;

                return (
                    <div key={dayKey}>
                        <h3 className="font-bold text-zinc-400 mb-2">{day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                        <div className="space-y-2 border-l-2 border-zinc-800 pl-4">
                            {dayEvents.map(event => (
                                <MobileEventPill
                                    key={event.id}
                                    event={event}
                                    onClick={onEventClick}
                                    isSelected={isSelectionMode && selectedEventIds.has(event.id)}
                                    isNew={newEventIds.has(event.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
             {Object.keys(eventsByDay).length === 0 && <p className="text-zinc-500 text-center py-8">No events this month.</p>}
        </div>
    );
};
