
import React, { useState } from 'react';
import { Project, Campaign, Topic } from '../../types';
import type { ProjectWithCampaigns } from '../ProjectsDashboard';
import { useGeneration } from '../../contexts/GenerationContext';
import { EditIcon, DeleteIcon, SparkleIcon, SkeletonItem, ChevronDownIcon } from '../Icons';

type ModalType = 'project' | 'campaign' | 'topic';

interface ProjectListViewProps {
    isLoading: boolean;
    data: ProjectWithCampaigns[];
    searchQuery: string;
    activeTopic: Topic | null;
    onSelectTopic: (topic: Topic) => void;
    onOpenModal: (type: ModalType, mode: 'add' | 'edit', data?: Project | Campaign | Topic) => void;
    onDelete: (type: ModalType, item: Project | Campaign | Topic) => void;
    onSetGenerationModalTopic: (topic: Topic | null) => void;
}

const TopicItem: React.FC<{ topic: Topic; isSelected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void; onGenerate: () => void }> = React.memo(({ topic, isSelected, onSelect, onEdit, onDelete, onGenerate }) => {
    const { activeGenerations, showProgressModal } = useGeneration();
    const existingTask = activeGenerations.find(task => task.id === topic.id);

    const handleGenerateClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (existingTask) {
            showProgressModal();
        } else {
            onGenerate();
        }
    };

    return (
        <div className={`group relative rounded-lg transition-all duration-200 ${isSelected ? 'bg-pink-500/10' : 'hover:bg-zinc-800'}`}>
            <button onClick={onSelect} className="w-full text-left p-3 pr-24 flex justify-between items-center gap-2">
                <span className={`font-medium truncate ${isSelected ? 'text-pink-300' : 'text-zinc-200'}`}>{topic.name}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${topic.status === 'Generated' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-300'}`}>{topic.status}</span>
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity opacity-100">
                {(topic.status === 'Draft' || existingTask) && (
                    <button onClick={handleGenerateClick} className="p-1.5 text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-md">
                        <SparkleIcon className={`w-4 h-4 ${existingTask ? 'animate-pulse text-pink-400' : ''}`} />
                    </button>
                )}
                <button onClick={onEdit} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                <button onClick={onDelete} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
            </div>
        </div>
    );
});

export const ProjectListView: React.FC<ProjectListViewProps> = ({
    isLoading, data, searchQuery, activeTopic, onSelectTopic, onOpenModal, onDelete, onSetGenerationModalTopic
}) => {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 animate-fade-in-fast min-h-[60vh]">
            {isLoading ? (
                <div className="space-y-2">{Array.from({length: 8}).map((_, i) => <SkeletonItem key={i} />)}</div>
            ) : data.length === 0 ? (
                <div className="text-center text-zinc-500 text-sm py-12">{searchQuery ? 'No results found.' : 'Create a project to get started.'}</div>
            ) : (
                <div className="space-y-1">
                    {data.map(project => {
                        const isProjectExpanded = !!expandedItems[project.id];
                        return (
                            <div key={project.id}>
                                <div className="group relative flex justify-between items-center p-2 rounded-md hover:bg-zinc-800/50">
                                    <button onClick={() => toggleExpanded(project.id)} className="flex items-center gap-2 text-left flex-grow min-w-0">
                                        <ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${isProjectExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                        <span className="font-bold text-zinc-200 truncate">{project.name}</span>
                                    </button>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => onOpenModal('project', 'edit', project)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                                       <button onClick={() => onDelete('project', project)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
                                   </div>
                                </div>
                                {isProjectExpanded && (
                                    <div className="pl-4 border-l-2 border-zinc-800 ml-4 animate-fade-in-fast">
                                        {project.campaigns.length > 0 ? project.campaigns.map(campaign => {
                                            const isCampaignExpanded = !!expandedItems[campaign.id];
                                            return (
                                               <div key={campaign.id} className="pl-4">
                                                    <div className="group relative flex justify-between items-center p-2 rounded-md hover:bg-zinc-800/50">
                                                       <button onClick={() => toggleExpanded(campaign.id)} className="flex items-center gap-2 text-left flex-grow min-w-0">
                                                            <ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform flex-shrink-0 ${isCampaignExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                                            <span className="text-zinc-300 truncate">{campaign.name}</span>
                                                        </button>
                                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                           <button onClick={() => onOpenModal('campaign', 'edit', campaign)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                                                           <button onClick={() => onDelete('campaign', campaign)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
                                                       </div>
                                                   </div>
                                                   {isCampaignExpanded && (
                                                       <div className="pl-4 space-y-2 py-1 border-l-2 border-zinc-800 ml-4 animate-fade-in-fast">
                                                            {campaign.topics.length > 0 ? campaign.topics.map(topic => (
                                                                <TopicItem 
                                                                    key={topic.id}
                                                                    topic={topic} 
                                                                    isSelected={activeTopic?.id === topic.id} 
                                                                    onSelect={() => onSelectTopic(topic)}
                                                                    onEdit={() => onOpenModal('topic', 'edit', topic)}
                                                                    onDelete={() => onDelete('topic', topic)}
                                                                    onGenerate={() => onSetGenerationModalTopic(topic)}
                                                                />
                                                            )) : (
                                                                <div className="px-3 py-2 text-xs text-zinc-500">No topics in this campaign.</div>
                                                            )}
                                                       </div>
                                                   )}
                                               </div>
                                            )
                                        }) : (
                                            <div className="pl-6 py-2 text-xs text-zinc-500">No campaigns in this project.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};
