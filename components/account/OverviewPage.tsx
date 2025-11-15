import React, { useState, useEffect } from 'react';
import { User, getProjects, getAllUserCampaigns, getAllUserTopics, getUserContent } from '../../services/firebaseService';
import { SavedContent } from '../../types';
import { ALL_PLATFORMS_WITH_TITLES } from '../../constants';


const PlatformIcons: React.FC<{ content: SavedContent }> = ({ content }) => {
    return (
        <div className="flex items-center gap-2">
            {ALL_PLATFORMS_WITH_TITLES.map(p => content[p.id] && <p.icon key={p.id} className="w-4 h-4 text-zinc-400" title={p.name} />)}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <p className="text-4xl font-black text-pink-400 mt-2">{value}</p>
    </div>
);

export const OverviewPage: React.FC<{ user: User }> = ({ user }) => {
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