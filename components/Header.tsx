
import React, { useState } from 'react';
import { signOutUser } from '../services/firebaseService';
import type { User } from 'firebase/auth';
import { AuthModal } from './AuthModal';

type View = 'creator' | 'dashboard';

interface HeaderProps {
    user: User | null;
    onNavigate: (view: View) => void;
    currentView: View;
}

const SignInIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
);

const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const SignOutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ user, onNavigate }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOutUser();
            setIsDropdownOpen(false);
            onNavigate('creator'); // Navigate to creator view on sign out
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };
    
    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isDropdownOpen && !(event.target as HTMLElement).closest('.user-menu-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);
    
    const handleNavigation = (view: View) => {
        onNavigate(view);
        setIsDropdownOpen(false);
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-50 border-b border-zinc-800">
                <div className="container mx-auto px-4 h-20 flex justify-between items-center">
                    <button onClick={() => handleNavigation('creator')} className="text-2xl font-black uppercase tracking-tighter cursor-pointer">
                        Rage<span className="text-pink-500">Gen</span>
                    </button>
                    <div>
                        {user ? (
                            <div className="relative user-menu-container">
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 rounded-full hover:bg-zinc-800 p-1 pr-3 transition-colors">
                                    <img src={user.photoURL || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.uid}`} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-pink-500 bg-zinc-700" />
                                    <span className="text-white font-medium hidden sm:block">{user.displayName}</span>
                                    <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg py-1 animate-fade-in-fast">
                                        <button onClick={() => handleNavigation('dashboard')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700/50 flex items-center gap-2">
                                            <DashboardIcon className="h-5 w-5" />
                                            Dashboard
                                        </button>
                                         <div className="h-px bg-zinc-700 my-1"></div>
                                        <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                            <SignOutIcon className="h-5 w-5" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center bg-transparent text-white font-semibold px-4 py-2 rounded-lg hover:bg-zinc-800 border border-zinc-700 hover:border-pink-500 transition-colors">
                                <SignInIcon className="w-5 h-5 mr-2"/>
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </>
    );
};
