
import React, { useState, useEffect } from 'react';

interface LoadingDisplayProps {
  message: string;
  progress: number;
  onCancel: () => void;
}

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
    </svg>
);


export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ message, progress, onCancel }) => {
  const [dots, setDots] = useState('');

  // Effect for the animated ellipsis
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDots((prevDots) => (prevDots.length >= 3 ? '' : prevDots + '.'));
    }, 400);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="mt-8 flex flex-col items-center justify-center p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
      <div className="w-12 h-12 border-4 border-t-pink-500 border-gray-600 rounded-full animate-spin"></div>
      
      <div className="w-full text-center mt-4">
        <p className="text-gray-300 font-medium min-h-[24px]">
          {message}{progress < 100 ? dots : ''}
        </p>

        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2.5 rounded-full transition-all duration-300 ease-linear" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-pink-400 font-mono tracking-wider">{progress.toFixed(0)}% complete</p>
      </div>

       <button
          onClick={onCancel}
          className="mt-6 flex items-center justify-center px-4 py-2 text-sm font-semibold text-red-400 bg-transparent border border-red-500/50 rounded-lg hover:bg-red-900/30 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-all duration-300"
        >
          <XCircleIcon className="w-5 h-5 mr-2" />
          Cancel Generation
        </button>
    </div>
  );
};
