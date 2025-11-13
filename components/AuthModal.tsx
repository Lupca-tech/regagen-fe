import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signUpWithEmailAndPassword, signInWithEmail } from '../services/firebaseService';

// --- ICON COMPONENTS ---
const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);
const UserIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const MailIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const LockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthView = 'signIn' | 'signUp';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<AuthView>('signIn');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setView('signIn');
            setDisplayName('');
            setEmail('');
            setPassword('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleAuthAction = async (e: React.FormEvent) => {
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
    };
    
    const handleGoogleSignIn = async () => {
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
    }

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
};
