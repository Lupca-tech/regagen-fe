import React, { useState, useEffect, useCallback } from 'react';
import {
    User,
    getProjects,
    getAllUserCampaigns,
    getAllUserTopics,
    getUserContent,
    updateUserDisplayName,
    sendPasswordReset,
    deleteUserAccount,
    signOutUser
} from '../services/firebaseService';
import { Project, Campaign, Topic, SavedContent, EditablePlatform } from '../types';
import { ContentTabs } from './ContentTabs';

// --- ICONS ---
const UserCircleIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ActivityIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SettingsIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.113-1.113l.448-.113a9.004 9.004 0 018.013 8.013l-.113.447c-.106.554-.57.99-1.113 1.113l-.448.113a8.97 8.97 0 01-2.073.342l-.638.09c-1.131.16-2.26.16-3.391 0l-.638-.09a8.97 8.97 0 01-2.072-.342l-.448-.113c-.554-.106-.99-.57-1.113-1.113l-.113-.448a9.004 9.004 0 018.013-8.013l.448-.113zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg>;
const WebIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><title>{title}</title><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253m0 0" /></svg>);
const FacebookIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><title>{title}</title><path d="M12 2.03998C6.49999 2.03998 2.03999 6.49998 2.03999 12C2.03999 16.89 5.52999 20.93 10.12 21.8v-8.01H7.07999v-3.72h3.04V8.41998C10.12 5.41998 11.92 3.87998 14.67 3.87998C15.53 3.87998 16.32 3.93998 17.07 4.03998V7.24998H15.21C13.8 7.24998 13.56 8.01998 13.56 8.78998V10.07H17.01L16.36 13.79H13.56V21.8C18.47 20.93 21.96 16.89 21.96 12C21.96 6.49998 17.5 2.03998 12 2.03998Z" /></svg>);
const TikTokIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><title>{title}</title><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.98-1.55-1.97-2.05-4.38-1.51-6.77.52-2.31 2.3-4.14 4.54-5.06 2.72-1.11 5.69-.64 8.04 1.18.12 2.44-.81 4.84-2.55 6.37-1.42 1.25-3.34 1.66-5.18 1.1-1.26-.38-2.35-1.24-2.9-2.42a2.53 2.53 0 0 1 .53-2.77c.8-1.1 2.19-1.65 3.43-1.45.96.15 1.83.69 2.49 1.41.68.74 1.04 1.72 1.04 2.71-.02 1.09-.45 2.09-1.23 2.82-.49.46-1.1.8-1.72.91-.53.09-1.08.08-1.62-.05-1.1-.25-2.09-.89-2.77-1.8-.19-.26-.35-.55-.49-.86-.28-.6-.44-1.28-.5-1.97-.05-.53.03-1.07.18-1.58.46-1.58 1.64-2.8 3.11-3.26.83-.26 1.7-.32 2.55-.2.85.12 1.68.49 2.4 1.05.02.01.03.02.04.04v-4.67c-.33-.16-.67-.3-.99-.47-1.12-.57-2.34-.85-3.55-.95-1.21-.1-2.42.06-3.63.06z" /></svg>);
const YouTubeIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><title>{title}</title><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM9.75 15.375V8.625l4.5 3.375-4.5 3.375z" clipRule="evenodd" /></svg>);
const LinkedInIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><title>{title}</title><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0 -2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>);
const XIconSvg: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><title>{title}</title><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


// --- PROPS ---
interface AccountDashboardProps {
    user: User;
}

// --- TYPES ---
type AccountTab = 'overview' | 'activity' | 'settings';

const ALL_PLATFORMS: { id: EditablePlatform; name: string; icon: React.FC<{className?: string; title?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIconSvg },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
    { id: 'youtube', name: 'YouTube', icon: YouTubeIcon },
];

const PlatformIcons: React.FC<{ content: SavedContent }> = ({ content }) => {
    return (
        <div className="flex items-center gap-2">
            {ALL_PLATFORMS.map(p => content[p.id] && <p.icon key={p.id} className="w-4 h-4 text-zinc-400" title={p.name} />)}
        </div>
    );
};


// --- SUB-COMPONENTS ---
const OverviewPage: React.FC<{ user: User }> = ({ user }) => {
    const [stats, setStats] = useState({ projects: 0, campaigns: 0, topics: 0, generations: 0 });
    const [recentActivity, setRecentActivity] = useState<SavedContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [projects, campaigns, topics, generations] = await Promise.all([
                    getProjects(user.uid),
                    getAllUserCampaigns(user.uid),
                    getAllUserTopics(user.uid),
                    getUserContent(user.uid)
                ]);
                setStats({
                    projects: projects.length,
                    campaigns: campaigns.length,
                    topics: topics.length,
                    generations: generations.length
                });
                setRecentActivity(generations.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch overview stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [user.uid]);

    return (
        <div className="space-y-8 animate-fade-in-fast">
            <div>
                <h2 className="text-2xl font-bold text-zinc-200">Account Overview</h2>
                <p className="text-zinc-400 mt-1">A summary of your creative work.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Projects" value={loading ? '...' : stats.projects} />
                <StatCard title="Campaigns" value={loading ? '...' : stats.campaigns} />
                <StatCard title="Topics" value={loading ? '...' : stats.topics} />
                <StatCard title="Generations" value={loading ? '...' : stats.generations} />
            </div>
             <div>
                <h3 className="text-xl font-bold text-zinc-200 mb-4">Recent Activity</h3>
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800">
                    {loading ? (
                        <div className="p-4 text-zinc-500">Loading activity...</div>
                    ) : recentActivity.length > 0 ? (
                        <ul className="divide-y divide-zinc-800">
                           {recentActivity.map(item => (
                               <li key={item.id} className="p-4 flex justify-between items-center">
                                   <div>
                                       <p className="font-semibold text-zinc-200">{item.topic}</p>
                                       <p className="text-sm text-zinc-400">
                                          {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
                                       </p>
                                   </div>
                                   <PlatformIcons content={item} />
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-zinc-500">No recent activity found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <p className="text-4xl font-black text-pink-400 mt-2">{value}</p>
    </div>
);

const ActivityPage: React.FC<{ user: User }> = ({ user }) => {
    const [activity, setActivity] = useState<SavedContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingContent, setViewingContent] = useState<SavedContent | null>(null);

    useEffect(() => {
        getUserContent(user.uid)
            .then(setActivity)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [user.uid]);

    return (
        <>
            <div className="space-y-6 animate-fade-in-fast">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-200">Content History</h2>
                    <p className="text-zinc-400 mt-1">A complete log of all your generated content.</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800">
                    {loading ? (
                        <div className="p-4 text-zinc-500">Loading history...</div>
                    ) : activity.length > 0 ? (
                        <ul className="divide-y divide-zinc-800">
                            {activity.map(item => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setViewingContent(item)}
                                        className="w-full text-left p-4 space-y-2 hover:bg-zinc-800/50 transition-colors duration-200"
                                        aria-label={`View content for topic: ${item.topic}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-zinc-200">{item.topic}</p>
                                            <p className="text-xs text-zinc-500">
                                                {new Date(item.createdAt.seconds * 1000).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <PlatformIcons content={item} />
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-zinc-500">No activity found.</div>
                    )}
                </div>
            </div>

            {viewingContent && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setViewingContent(null)}
                >
                    <div 
                        className="bg-zinc-900 w-full max-w-4xl h-[90vh] rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold text-zinc-200 truncate">{viewingContent.topic}</h2>
                            <button 
                                onClick={() => setViewingContent(null)}
                                className="p-2 rounded-full hover:bg-zinc-700 transition-colors"
                                aria-label="Close content viewer"
                            >
                                <XIcon className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4">
                            <ContentTabs 
                                content={viewingContent}
                                topic={viewingContent.topic}
                                language={viewingContent.language}
                                onContentUpdate={() => {}} 
                                isReadOnly={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await updateUserDisplayName(displayName);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePasswordReset = async () => {
        setMessage(null);
        try {
             await sendPasswordReset();
             setMessage({ type: 'success', text: `Password reset email sent to ${user.email}.` });
        } catch(error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    }
    
    const handleDelete = async () => {
        setIsDeleting(true);
        setMessage(null);
        try {
            await deleteUserAccount(user.uid);
            await signOutUser();
            // App will re-render to creator view due to auth state change.
        } catch(error: any) {
            setMessage({ type: 'error', text: error.message });
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    }

    return (
        <div className="space-y-8 animate-fade-in-fast">
            <div>
                <h2 className="text-2xl font-bold text-zinc-200">Account Settings</h2>
                <p className="text-zinc-400 mt-1">Manage your profile and account settings.</p>
            </div>
            
            {message && <div className={`p-3 rounded-md text-sm border ${message.type === 'success' ? 'bg-green-900/30 border-green-500/30 text-green-300' : 'bg-red-900/30 border-red-500/30 text-red-300'}`}>{message.text}</div>}

            <SettingsSection title="Profile Information">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <label htmlFor="displayName" className="text-zinc-400">Display Name</label>
                        <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="sm:col-span-2 w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <label htmlFor="email" className="text-zinc-400">Email Address</label>
                        <input id="email" type="email" value={user.email || ''} disabled className="sm:col-span-2 w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-zinc-500 cursor-not-allowed" />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </SettingsSection>
            
            <SettingsSection title="Security">
                 <div className="flex justify-between items-center">
                     <div>
                        <h4 className="font-semibold text-zinc-300">Password</h4>
                        <p className="text-sm text-zinc-500">Reset your password via email.</p>
                     </div>
                     <button onClick={handlePasswordReset} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Send Reset Link</button>
                 </div>
            </SettingsSection>
            
            <div className="bg-red-900/20 p-6 rounded-xl border-2 border-red-500/30 space-y-4">
                <h3 className="text-xl font-bold text-red-300">Danger Zone</h3>
                <div className="flex justify-between items-center">
                     <div>
                        <h4 className="font-semibold text-red-300">Delete Account</h4>
                        <p className="text-sm text-red-400/80">Permanently delete your account and all content. This action cannot be undone.</p>
                     </div>
                     <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete Account</button>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-red-500/50 shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-center text-red-400">Are you sure?</h2>
                        <p className="text-zinc-400 text-center my-4">
                           This will permanently delete your account, along with all your projects, campaigns, and generated content. This action is irreversible.
                        </p>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-xl font-bold text-zinc-200 mb-4 pb-4 border-b border-zinc-800">{title}</h3>
        {children}
    </div>
);


// --- MAIN COMPONENT ---
export const AccountDashboard: React.FC<AccountDashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<AccountTab>('overview');

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in-fast">
             {/* Sidebar Navigation */}
             <aside className="md:col-span-1">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 space-y-1">
                    <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                        <UserCircleIcon />
                        Overview
                    </button>
                    <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'activity' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                        <ActivityIcon />
                        Activity
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                        <SettingsIcon />
                        Settings
                    </button>
                </div>
            </aside>
            {/* Content */}
            <main className="md:col-span-3">
                {activeTab === 'overview' && <OverviewPage user={user} />}
                {activeTab === 'activity' && <ActivityPage user={user} />}
                {activeTab === 'settings' && <SettingsPage user={user} />}
            </main>
        </div>
    );
};
