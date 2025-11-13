
import React, { useState, useEffect, useCallback } from 'react';
import { signInWithGoogle, signUpWithEmailAndPassword, signInWithEmail } from '../services/firebaseService';
import { GoogleIcon, UserIcon, MailIcon, LockIcon } from './Icons';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthView = 'signIn' | 'signUp';

export const AuthModal: React.FC<AuthModalProps> = React.memo(({ isOpen, onClose }) => {
    const [view, setView] = useState<AuthView>('signIn');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setView('signIn');
            setDisplayName('');
            setEmail('');
            setPassword('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleAuthAction = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (view === 'signUp') {
                if (!displayName.trim()) {
                    throw new Error("Display name is required.");
                }
                await signUpWithEmailAndPassword(email, password, displayName);
            } else {
                await signInWithEmail(email, password);
            }
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [view, email, password, displayName, onClose]);
    
    const handleGoogleSignIn = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-2">
                    {view === 'signIn' ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-zinc-400 text-center mb-6">
                    {view === 'signIn' ? "Sign in to continue your journey." : "Let's get you started."}
                </p>

                <form onSubmit={handleAuthAction} className="space-y-4">
                    {view === 'signUp' && (
                        <div className="relative">
                            <UserIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Display Name"
                                required
                                disabled={isLoading}
                                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-zinc-500 disabled:opacity-50"
                            />
                        </div>
                    )}
                    <div className="relative">
                        <MailIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            disabled={isLoading}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-zinc-500 disabled:opacity-50"
                        />
                    </div>
                    <div className="relative">
                         <LockIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            disabled={isLoading}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-zinc-500 disabled:opacity-50"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center bg-red-900/30 p-2 rounded-md border border-red-500/30">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (view === 'signIn' ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-zinc-700"></div>
                    <span className="flex-shrink mx-4 text-zinc-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-zinc-700"></div>
                </div>

                <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center bg-white text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <GoogleIcon />
                    Sign in with Google
                </button>

                <div className="text-center mt-6">
                    <button
                        onClick={() => setView(view === 'signIn' ? 'signUp' : 'signIn')}
                        className="text-sm text-zinc-400 hover:text-white"
                    >
                        {view === 'signIn'
                            ? "Don't have an account? "
                            : "Already have an account? "}
                        <span className="font-bold text-pink-400 hover:underline">
                             {view === 'signIn' ? "Sign Up" : "Sign In"}
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
});
