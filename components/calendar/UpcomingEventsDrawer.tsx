import React from 'react';
import type { CalendarEvent } from '../../types';
import { CloseIcon, WebIcon } from '../Icons';

const getStatusPillStyle = (status: CalendarEvent['status']) => {
    switch (status) {
        case 'suggested_trend': return 'bg-blue-900/50 text-blue-300 border-blue-500/30';
        case 'suggested_event': return 'bg-purple-900/50 text-purple-300 border-purple-500/30';
        case 'draft': return 'bg-zinc-700/50 text-zinc-300 border-zinc-500/30';
        case 'published': return 'bg-green-900/50 text-green-300 border-green-500/30';
        default: return 'bg-zinc-800';
    }
};

const UpcomingEventItem: React.FC<{ event: CalendarEvent, onEventClick: (event: CalendarEvent) => void; }> = ({ event, onEventClick }) => (
    <li>
        <button 
            onClick={() => onEventClick(event)}
            className="w-full text-left p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-all duration-200"
        >
            <p className="text-xs text-zinc-400 font-semibold mb-1">
                {new Date(event.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="font-bold text-zinc-100 mb-2">{event.title}</p>
            <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusPillStyle(event.status)}`}>
                    {event.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {event.contentId && <WebIcon className="w-4 h-4 text-pink-400" title="Content Generated" />}
            </div>
        </button>
    </li>
);

interface UpcomingEventsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

export const UpcomingEventsDrawer: React.FC<UpcomingEventsDrawerProps> = ({ isOpen, onClose, events, onEventClick }) => {
    
    const handleEventClick = (event: CalendarEvent) => {
        onEventClick(event);
        onClose();
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="upcoming-events-title"
            >
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b border-zinc-800 flex-shrink-0">
                        <h2 id="upcoming-events-title" className="text-xl font-bold">Upcoming Events</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors" aria-label="Close">
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4">
                        {events.length > 0 ? (
                            <ul className="space-y-3">
                                {events.map(event => (
                                    <UpcomingEventItem key={event.id} event={event} onEventClick={handleEventClick} />
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-zinc-500 pt-16">
                                <p>No upcoming events in this month.</p>
                                <p className="text-sm mt-2">Try using the "Get AI Ideas" feature!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
