import React, { useState } from 'react';
import { signOutUser } from '../services/firebaseService';
import type { User } from 'firebase/auth';
import type { View } from '../types';
import { SignInIcon, MagicWandIcon, ProjectsIcon, BrandVoiceIcon, AccountIcon, SignOutIcon, ChevronDownIcon, CalendarIcon } from './Icons';

interface HeaderProps {
    user: User | null;
    onNavigate: (view: View) => void;
    currentView: View;
    onOpenAuthModal: () => void;
}

const UserMenu: React.FC<{ user: User; onNavigate: (view: View) => void; currentView: View }> = React.memo(({ user, onNavigate, currentView }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const handleNavigation = (view: View) => {
        onNavigate(view);
        setIsOpen(false);
    };

    const menuItems: { view: View; label: string; icon: React.FC<{className?: string}> }[] = [
        { view: 'magicCreator', label: 'Magic Creator', icon: MagicWandIcon },
        { view: 'projects', label: 'Projects', icon: ProjectsIcon },
        { view: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { view: 'brandVoice', label: 'Brand Voice', icon: BrandVoiceIcon },
        { view: 'account', label: 'My Account', icon: AccountIcon },
    ];

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <img
                    src={user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`}
                    alt="User"
                    className="w-10 h-10 rounded-full border-2 border-pink-500"
                />
                <span className="font-semibold hidden sm:inline">{user.displayName || 'User'}</span>
                <ChevronDownIcon className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div 
                    className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg animate-fade-in-fast"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ul className="p-2">
                        {menuItems.map(item => (
                             <li key={item.view}>
                                <button
                                    onClick={() => handleNavigation(item.view)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                                        currentView === item.view ? 'bg-pink-600/20 text-pink-300' : 'text-zinc-300 hover:bg-zinc-800'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            </li>
                        ))}
                       
                        <li><hr className="my-2 border-zinc-700" /></li>
                        <li>
                            <button
                                onClick={signOutUser}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            >
                                <SignOutIcon />
                                Sign Out
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
});

export const Header: React.FC<HeaderProps> = ({ user, onNavigate, currentView, onOpenAuthModal }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-md border-b border-zinc-900">
            <div className="container mx-auto px-4 h-20 flex justify-between items-center">
                <button onClick={() => onNavigate(user ? 'projects' : 'magicCreator')} className="text-2xl font-black uppercase tracking-tighter">
                    Rage<span className="text-pink-500">Gen</span>
                </button>

                <nav>
                    {user ? (
                       <UserMenu user={user} onNavigate={onNavigate} currentView={currentView} />
                    ) : (
                        <button
                            onClick={onOpenAuthModal}
                            className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-transparent border-2 border-pink-500 rounded-lg hover:bg-pink-500 transition-colors duration-300"
                        >
                            <SignInIcon className="w-5 h-5 mr-2" />
                            Sign In
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
};