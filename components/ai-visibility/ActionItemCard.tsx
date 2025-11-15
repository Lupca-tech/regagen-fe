import React from 'react';
import type { ActionItem } from '../../types';
import { SparkleIcon } from '../Icons';

interface ActionItemCardProps {
    item: ActionItem;
}

export const ActionItemCard: React.FC<ActionItemCardProps> = ({ item }) => {
    const isThreat = item.type === 'threat';
    const borderColor = isThreat ? 'border-red-500/50' : 'border-purple-500/50';
    const bgColor = isThreat ? 'bg-red-900/20' : 'bg-purple-900/20';
    const iconColor = isThreat ? 'text-red-400' : 'text-purple-400';
    const title = isThreat ? 'Priority Threat Detected' : 'Top Strategic Opportunity';

    return (
        <div className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor} space-y-4 mb-8`}>
            <div className="flex items-center gap-3">
                <SparkleIcon className={`w-8 h-8 ${iconColor}`} />
                <h3 className="text-2xl font-bold">{title}</h3>
            </div>
            <div>
                <h4 className="font-semibold text-zinc-300">Insight:</h4>
                <p className="text-zinc-400">{item.insight}</p>
            </div>
            <div>
                <h4 className="font-semibold text-zinc-300">Suggested Action:</h4>
                <p className="text-zinc-400">{item.suggested_action}</p>
            </div>
        </div>
    );
};
