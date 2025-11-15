import { useMemo } from 'react';
import type { CalendarEvent } from '../../../types';

export const useCalendar = (currentDate: Date, events: CalendarEvent[]) => {
    return useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthGrid: (Date | null)[] = [];
        const allDaysInMonth: Date[] = [];

        // Fill initial empty cells
        for (let i = 0; i < firstDayOfMonth; i++) {
            monthGrid.push(null);
        }
        
        // Fill days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i);
            monthGrid.push(day);
            allDaysInMonth.push(day);
        }
        
        const eventsByDay = events.reduce((acc, event) => {
            // Normalize the date to avoid timezone issues when creating the key
            const eventDate = new Date(event.start);
            const keyDate = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));
            const key = keyDate.toDateString();

            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(event);
            return acc;
        }, {} as Record<string, CalendarEvent[]>);

        return { monthGrid, daysOfWeek, eventsByDay, allDaysInMonth };
    }, [currentDate, events]);
};
