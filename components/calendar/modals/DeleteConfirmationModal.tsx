import React from 'react';

interface DeleteConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    count: number;
    isDeleting: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ onClose, onConfirm, count, isDeleting }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-red-500/50 shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-center text-red-400">Are you sure?</h2>
            <p className="text-zinc-400 text-center my-4">
                You are about to permanently delete <span className="font-bold text-white">{count}</span> event{count > 1 ? 's' : ''}.
                <br/><br/>
                <strong className="text-red-300">This action cannot be undone.</strong>
            </p>
            <div className="flex justify-end gap-3 pt-4">
                <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg disabled:opacity-50">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
            </div>
        </div>
    </div>
);
