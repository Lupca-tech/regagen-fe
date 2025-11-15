import React, { useState, useEffect, useRef } from 'react';
import { MoreVerticalIcon, TrashIcon } from '../Icons';

interface MoreOptionsMenuProps {
    onDeleteAll: () => void;
    disabled: boolean;
}

export const MoreOptionsMenu: React.FC<MoreOptionsMenuProps> = ({ onDeleteAll, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" title="More options">
                <MoreVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg animate-fade-in-fast z-10">
                    <ul className="p-1">
                        <li>
                            <button
                                onClick={() => { onDeleteAll(); setIsOpen(false); }}
                                disabled={disabled}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Delete all events in month
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};
