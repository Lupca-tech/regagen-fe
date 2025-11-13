
import React, { useState } from 'react';
import { User } from '../services/firebaseService';
import { UserCircleIcon, ActivityIcon, SettingsIcon } from './Icons';
import { OverviewPage } from './account/OverviewPage';
import { ActivityPage } from './account/ActivityPage';
import { SettingsPage } from './account/SettingsPage';

interface AccountDashboardProps {
    user: User;
}

type AccountTab = 'overview' | 'activity' | 'settings';

export const AccountDashboard: React.FC<AccountDashboardProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<AccountTab>('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewPage user={user} />;
            case 'activity':
                return <ActivityPage user={user} />;
            case 'settings':
                return <SettingsPage user={user} />;
            default:
                return null;
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in-fast">
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
            <main className="md:col-span-3">
                {renderContent()}
            </main>
        </div>
    );
};
