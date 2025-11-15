import React from 'react';
import type { CalendarEvent } from '../../types';
import { CheckCircleIcon } from '../Icons';

const getEventPillStyle = (status: CalendarEvent['status']) => {
    switch (status) {
        case 'suggested_trend': return 'bg-blue-900/50 text-blue-300 border-blue-500/30 hover:bg-blue-900/80';
        case 'suggested_event': return 'bg-purple-900/50 text-purple-300 border-purple-500/30 hover:bg-purple-900/80';
        case 'draft': return 'bg-zinc-700/50 text-zinc-300 border-zinc-500/30 hover:bg-zinc-700/80';
        case 'published': return 'bg-green-900/50 text-green-300 border-green-500/30 hover:bg-green-900/80';
        default: return 'bg-zinc-800';
    }
};

interface EventPillProps {
    event: CalendarEvent;
    onClick: (event: CalendarEvent) => void;
    isSelected: boolean;
    isNew: boolean;
}

export const EventPill: React.FC<EventPillProps> = ({ event, onClick, isSelected, isNew }) => {
    const pillStyle = getEventPillStyle(event.status);
    const selectedStyle = 'border-pink-500/80 bg-pink-900/30';
    const finalStyle = isSelected ? selectedStyle : pillStyle;

    return (
        <button
            onClick={() => onClick(event)}
            className={`relative w-full text-left p-1.5 text-xs rounded-md border transition-colors ${finalStyle} ${isNew ? 'pulse-glow' : ''}`}
        >
            {isSelected && (
                <div className="absolute inset-0 bg-pink-500/20 rounded-md flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-white/80" />
                </div>
            )}
            <p className="font-semibold truncate">{event.title}</p>
        </button>
    );
};
