
import React, { useState, useEffect } from 'react';
import { User, getUserContent } from '../../services/firebaseService';
import { SavedContent, EditablePlatform } from '../../types';
import { ContentTabs } from '../ContentTabs';
import { WebIcon, FacebookIcon, LinkedInIcon, XIconPlatform, TikTokIcon, YouTubeIcon, XIcon } from '../Icons';

const ALL_PLATFORMS: { id: EditablePlatform; name: string; icon: React.FC<{className?: string; title?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIconPlatform },
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

export const ActivityPage: React.FC<{ user: User }> = ({ user }) => {
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
