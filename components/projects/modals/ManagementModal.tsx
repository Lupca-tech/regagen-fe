
import React, { useState, useCallback } from 'react';
import type { Project, Campaign, Topic } from '../../../types';

type ModalType = 'project' | 'campaign' | 'topic';
type ModalMode = 'add' | 'edit';

interface ManagementModalProps {
    type: ModalType;
    mode: ModalMode;
    initialData?: Project | Campaign | Topic | null;
    onClose: () => void;
    onSubmit: (data: { name: string, description: string }) => Promise<void>;
}

export const ManagementModal: React.FC<ManagementModalProps> = ({ type, mode, initialData, onClose, onSubmit }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(
        mode === 'edit' && initialData && 'description' in initialData ? initialData.description :
        (mode === 'edit' && initialData && 'goal' in initialData ? initialData.goal : '')
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ name, description });
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    }, [onSubmit, name, description]);

    const labels = {
        project: { title: 'Project', name: 'Project Name', desc: 'Project Description', descPlaceholder: 'e.g., Q4 Content Push for Product X' },
        campaign: { title: 'Campaign', name: 'Campaign Name', desc: 'Campaign Goal', descPlaceholder: 'e.g., Increase brand awareness on TikTok' },
        topic: { title: 'Topic', name: 'Topic Name', desc: '', descPlaceholder: '' },
    }
    const currentLabels = labels[type];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-6">{mode === 'add' ? 'Create New' : 'Edit'} {currentLabels.title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">{currentLabels.name}</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                        />
                    </div>
                    {type !== 'topic' && (
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">{currentLabels.desc}</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder={currentLabels.descPlaceholder}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none"
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading || !name.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
