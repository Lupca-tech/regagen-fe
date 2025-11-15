import React from 'react';
import type { CalendarEvent } from '../../types';
import { DayCell } from './DayCell';

interface CalendarGridProps {
    monthGrid: (Date | null)[];
    daysOfWeek: string[];
    eventsByDay: Record<string, CalendarEvent[]>;
    isSelectionMode: boolean;
    selectedEventIds: Set<string>;
    newEventIds: Set<string>;
    onEventClick: (event: CalendarEvent) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    monthGrid,
    daysOfWeek,
    eventsByDay,
    isSelectionMode,
    selectedEventIds,
    newEventIds,
    onEventClick
}) => {
    return (
        <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map(day => (
                <div key={day} className="text-center font-bold text-zinc-400 text-sm py-2">{day}</div>
            ))}
            {monthGrid.map((day, index) => (
                <DayCell
                    key={index}
                    day={day}
                    dayEvents={day ? eventsByDay[day.toDateString()] || [] : []}
                    isSelectionMode={isSelectionMode}
                    selectedEventIds={selectedEventIds}
                    newEventIds={newEventIds}
                    onEventClick={onEventClick}
                />
            ))}
        </div>
    );
};
