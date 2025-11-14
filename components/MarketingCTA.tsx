
import React, { useState } from 'react';
import { SparkleIcon } from './Icons'; // Assuming SparkleIcon is in Icons.tsx

interface MarketingCTAProps {
    onOpenAuthModal: () => void;
}

export const MarketingCTA: React.FC<MarketingCTAProps> = React.memo(({ onOpenAuthModal }) => {
    return (
        <div className="relative p-8 mt-12 mb-6 bg-gradient-to-tr from-pink-900/40 via-purple-900/40 to-pink-900/40 border border-pink-500/30 rounded-xl overflow-hidden animate-fade-in max-w-xl mx-auto">
            <div className="absolute -top-12 -right-12 text-pink-500/10 opacity-70">
                <SparkleIcon className="w-48 h-48" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <SparkleIcon className="w-16 h-16 text-pink-400" />
                <h3 className="text-3xl font-bold text-white tracking-tight">Ready to go viral?</h3>
                <p className="text-zinc-300 max-w-md">
                    Sign up or log in to unleash RageGen and create trend-setting content for all your platforms.
                </p>
                <button
                    onClick={onOpenAuthModal}
                    className="mt-4 flex items-center justify-center px-8 py-3 font-bold text-lg text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-pink-500 transition-all duration-300 shadow-lg"
                >
                    <SparkleIcon className="w-6 h-6 mr-2"/>
                    Start Creating Now
                </button>
            </div>
        </div>
    );
});
