import React, { useState } from 'react';
import type { CalendarSettings } from '../../../types';

interface SettingsModalProps {
    onSave: (settings: Omit<CalendarSettings, 'userId'>) => void;
    onClose: () => void;
    isSaving: boolean;
    initialSettings?: Omit<CalendarSettings, 'userId'> | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onSave, onClose, isSaving, initialSettings }) => {
    const [mainTopics, setMainTopics] = useState(initialSettings?.mainTopics || '');
    const [targetAudience, setTargetAudience] = useState(initialSettings?.targetAudience || '');
    const isEditMode = !!initialSettings;

    const handleSave = () => {
        if (mainTopics.trim() && targetAudience.trim()) {
            onSave({ mainTopics, targetAudience });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-2">{isEditMode ? 'Edit Content Assistant Settings' : 'Setup Your Content Assistant'}</h2>
                <p className="text-zinc-400 text-center mb-6">{isEditMode ? 'Update your topics and audience to refine AI suggestions.' : 'Tell the AI what you\'re about so it can find the best ideas for you.'}</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="mainTopics" className="block text-sm font-medium text-zinc-300 mb-1">What are your main topics?</label>
                        <textarea id="mainTopics" value={mainTopics} onChange={e => setMainTopics(e.target.value)} rows={3} placeholder="e.g., Personal finance, investing for beginners, self-development" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="targetAudience" className="block text-sm font-medium text-zinc-300 mb-1">Who is your target audience?</label>
                        <textarea id="targetAudience" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} rows={2} placeholder="e.g., Gen Z and young millennials in Vietnam" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded-md" />
                    </div>
                </div>
                 <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-zinc-800">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving || !mainTopics.trim() || !targetAudience.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};
