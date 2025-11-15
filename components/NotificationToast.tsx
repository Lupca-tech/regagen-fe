import React, { useState, useEffect } from 'react';
import { BellIcon, CloseIcon } from './Icons';

interface NotificationToastProps {
    count: number;
    onClose: () => void;
    onClick: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ count, onClose, onClick }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger the animation shortly after mounting
        const entryTimer = setTimeout(() => setIsVisible(true), 100);

        // Auto-dismiss after some time
        const exitTimer = setTimeout(() => {
            setIsVisible(false);
            // Call onClose after the exit animation completes
            setTimeout(onClose, 300);
        }, 10000); // 10 seconds

        return () => {
            clearTimeout(entryTimer);
            clearTimeout(exitTimer);
        };
    }, [onClose]);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent onClick from firing when closing
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow time for exit animation
    };

    return (
        <div
            className={`fixed bottom-6 right-6 w-full max-w-sm z-50 transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
            <button 
                onClick={onClick}
                className="w-full bg-zinc-900 border-2 border-zinc-700 rounded-xl shadow-2xl shadow-pink-500/10 p-4 flex items-start gap-4 text-left hover:border-pink-500/50 transition-colors"
                aria-live="polite"
            >
                <div className="flex-shrink-0 mt-1 w-8 h-8 flex items-center justify-center bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20">
                    <BellIcon className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-zinc-100">Upcoming Events</h3>
                    <p className="text-sm text-zinc-300 mt-1">
                        You have <span className="font-bold text-pink-400">{count}</span> scheduled event{count > 1 ? 's' : ''} in the next 3 days.
                    </p>
                </div>
                 <button 
                    onClick={handleClose}
                    className="flex-shrink-0 p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                    aria-label="Dismiss notification"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
            </button>
        </div>
    );
};
