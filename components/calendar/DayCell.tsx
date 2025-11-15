import React from 'react';
import type { CalendarEvent } from '../../types';
import { EventPill } from './EventPill';

interface DayCellProps {
    day: Date | null;
    dayEvents: CalendarEvent[];
    isSelectionMode: boolean;
    selectedEventIds: Set<string>;
    newEventIds: Set<string>;
    onEventClick: (event: CalendarEvent) => void;
}

export const DayCell: React.FC<DayCellProps> = ({ day, dayEvents, isSelectionMode, selectedEventIds, newEventIds, onEventClick }) => {
    return (
        <div className={`h-32 bg-zinc-900/50 rounded-md p-1 border border-zinc-800/50 overflow-y-auto ${day ? '' : 'opacity-50'}`}>
            {day && <span className="text-xs font-bold ml-1">{day.getDate()}</span>}
            <div className="space-y-1 mt-1">
                {dayEvents && dayEvents.map(event => (
                    <EventPill
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
};
