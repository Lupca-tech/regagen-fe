
import React from 'react';
import type { View } from '../../types';
import { SparkleIcon, CloseIcon } from '../Icons';

interface BrandVoiceCTAProps {
    onNavigate: (view: View) => void;
    onDismiss: () => void;
}

export const BrandVoiceCTA: React.FC<BrandVoiceCTAProps> = ({ onNavigate, onDismiss }) => (
    <div className="relative p-6 mb-6 bg-gradient-to-tr from-zinc-900 via-purple-900/40 to-zinc-900 border-2 border-purple-500/30 rounded-xl overflow-hidden animate-fade-in">
        <div className="absolute -top-12 -right-12 text-purple-500/10">
            <SparkleIcon className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0 text-purple-400">
                <SparkleIcon className="w-12 h-12" />
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-white">Unlock Consistent Content with your Brand Voice Co-Pilot</h3>
                <p className="text-zinc-400 mt-1">Tired of endless edits? Create a Brand Voice profile to ensure every piece of content the AI generates perfectly matches your style.</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
                <button
                    onClick={() => onNavigate('brandVoice')}
                    className="px-4 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-purple-500 transition-all duration-300"
                >
                    Create a Profile
                </button>
            </div>
        </div>
         <button 
            onClick={onDismiss} 
            className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white transition-colors"
            aria-label="Dismiss"
        >
            <CloseIcon className="w-5 h-5" />
        </button>
    </div>
);
