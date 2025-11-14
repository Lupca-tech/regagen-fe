import React, { useState } from 'react';
import { useGeneration } from '../../contexts/GenerationContext';
import { Project, Campaign, Topic } from '../../types';
import { PlusIcon, EditIcon, DeleteIcon, SparkleIcon, BackIcon, SkeletonItem } from '../Icons';
import { ProjectWithCounts, CampaignWithCounts } from '../ProjectsDashboard'; // Import augmented types

type ModalType = 'project' | 'campaign' | 'topic';

interface ProjectBoardViewProps {
    projects: ProjectWithCounts[]; // Use augmented type
    campaigns: CampaignWithCounts[]; // Use augmented type
    topics: Topic[];
    loading: { projects: boolean; campaigns: boolean; topics: boolean };
    selectedProjectId: string | null;
    selectedCampaignId: string | null;
    activeTopic: Topic | null;
    onSelectProject: (id: string) => void;
    onSelectCampaign: (id: string) => void;
    onSelectTopic: (topic: Topic) => void;
    onOpenModal: (type: ModalType, mode: 'add' | 'edit', data?: Project | Campaign | Topic) => void;
    onDelete: (type: ModalType, item: Project | Campaign | Topic) => void;
    onOpenTopicGenModal: (project: Project, campaign: Campaign) => void;
    onSetGenerationModalTopic: (topic: Topic | null) => void;
    onBackToProjects: () => void;
    onBackToCampaigns: () => void;
}

const ItemButton: React.FC<{ 
    item: ProjectWithCounts | CampaignWithCounts; 
    type: 'project' | 'campaign'; 
    isSelected: boolean; 
    onSelect: () => void; 
    onEdit: () => void; 
    onDelete: () => void 
}> = React.memo(({ item, type, isSelected, onSelect, onEdit, onDelete }) => (
    <div className={`relative rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-pink-500/10 border-pink-500' : 'bg-zinc-900/50 border-transparent hover:bg-zinc-800'}`}>
        <button onClick={onSelect} className="w-full text-left p-3 pr-20">
            <h3 className={`font-bold truncate ${isSelected ? 'text-pink-300' : 'text-zinc-200'}`}>{item.name}</h3>
            {(item as Project).description && <p className="text-xs text-zinc-400 truncate mt-1">{(item as Project).description}</p>}
            {(item as Campaign).goal && <p className="text-xs text-zinc-400 truncate mt-1">{(item as Campaign).goal}</p>}
            
            <div className="text-xs text-zinc-500 mt-2">
                <p>Created: {item.formattedCreatedAt}</p>
                {type === 'project' && 'campaignCount' in item && (
                    <p>Campaigns: {item.campaignCount}</p>
                )}
                {type === 'campaign' && 'topicCount' in item && (
                    <p>Topics: {item.topicCount}</p>
                )}
            </div>
        </button>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
            <button onClick={onDelete} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
        </div>
    </div>
));

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
        <div className={`relative group rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-pink-500/10 border-pink-500' : 'bg-zinc-900/50 border-transparent hover:bg-zinc-800'}`}>
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

const Column: React.FC<{ title: string; children: React.ReactNode; onAdd: () => void; addDisabled?: boolean; headerContent?: React.ReactNode; }> = ({ title, children, onAdd, addDisabled = false, headerContent }) => (
    <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            {headerContent || <h2 className="text-xl font-bold text-zinc-300">{title}</h2>}
            <button onClick={onAdd} disabled={addDisabled} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded-lg hover:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <PlusIcon className="w-4 h-4"/> New
            </button>
        </div>
        <div className="space-y-2 flex-grow overflow-y-auto pr-1">{children}</div>
    </div>
);

export const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({
    projects, campaigns, topics, loading, selectedProjectId, selectedCampaignId, activeTopic,
    onSelectProject, onSelectCampaign, onSelectTopic, onOpenModal, onDelete, onOpenTopicGenModal,
    onSetGenerationModalTopic, onBackToProjects, onBackToCampaigns
}) => {

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    return (
        <div className="relative lg:grid lg:grid-cols-3 lg:gap-6 w-full min-h-[60vh] flex overflow-x-hidden animate-fade-in-fast">
            {/* Projects Column */}
            <div className={`w-full flex-shrink-0 lg:w-auto transition-transform duration-300 ease-in-out ${selectedProjectId ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
                <Column title="Projects" onAdd={() => onOpenModal('project', 'add')} headerContent={<h2 className="text-xl font-bold text-zinc-300">Projects</h2>}>
                    {loading.projects ? Array.from({length: 3}).map((_, i) => <SkeletonItem key={i} />)
                        : projects.length > 0 ? projects.map(p => <ItemButton key={p.id} item={p} type="project" isSelected={p.id === selectedProjectId} onSelect={() => onSelectProject(p.id)} onEdit={() => onOpenModal('project', 'edit', p)} onDelete={() => onDelete('project', p)} />)
                        : <div className="text-center text-zinc-500 text-sm py-8">Create your first project.</div>
                    }
                </Column>
            </div>
            
            {/* Campaigns Column */}
            <div className={`absolute lg:relative w-full h-full flex-shrink-0 lg:w-auto transition-transform duration-300 ease-in-out ${!selectedProjectId ? 'translate-x-full' : selectedCampaignId ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
                <Column title="Campaigns" onAdd={() => onOpenModal('campaign', 'add')} addDisabled={!selectedProjectId}
                    headerContent={
                        <div className="flex items-center gap-2">
                            <button onClick={onBackToProjects} className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white"><BackIcon /></button>
                            <h2 className="text-xl font-bold text-zinc-300">Campaigns</h2>
                        </div>
                    }
                >
                    {loading.campaigns ? Array.from({length: 3}).map((_, i) => <SkeletonItem key={i} />)
                        : campaigns.length > 0 ? campaigns.map(c => <ItemButton key={c.id} item={c} type="campaign" isSelected={c.id === selectedCampaignId} onSelect={() => onSelectCampaign(c.id)} onEdit={() => onOpenModal('campaign', 'edit', c)} onDelete={() => onDelete('campaign', c)} />)
                        : <div className="text-center text-zinc-500 text-sm py-8">{selectedProjectId ? 'This project has no campaigns.' : 'Select a project.'}</div>
                    }
                </Column>
            </div>

            {/* Topics Column */}
             <div className={`absolute lg:relative w-full h-full flex-shrink-0 lg:w-auto transition-transform duration-300 ease-in-out ${!selectedCampaignId ? 'translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
                <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <button onClick={onBackToCampaigns} className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white lg:hidden"><BackIcon /></button>
                            <h2 className="text-xl font-bold text-zinc-300 truncate">Topics</h2>
                        </div>
                         <div className="flex-shrink-0 flex items-center gap-2">
                            <button onClick={() => selectedProject && selectedCampaign && onOpenTopicGenModal(selectedProject, selectedCampaign)} disabled={!selectedCampaignId} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600/50 border border-purple-500 rounded-lg hover:bg-purple-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Generate Topics with AI">
                                <SparkleIcon className="w-4 h-4"/> AI
                            </button>
                            <button onClick={() => onOpenModal('topic', 'add')} disabled={!selectedCampaignId} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded-lg hover:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <PlusIcon className="w-4 h-4"/> New
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-1 space-y-2">
                         {loading.topics ? Array.from({length: 3}).map((_, i) => <SkeletonItem key={i} />)
                          : topics.length > 0 ? topics.map(t => <TopicItem key={t.id} topic={t} isSelected={activeTopic?.id === t.id} onSelect={() => onSelectTopic(t)} onEdit={() => onOpenModal('topic', 'edit', t)} onDelete={() => onDelete('topic', t)} onGenerate={() => onSetGenerationModalTopic(t)} />)
                          : <div className="text-center text-zinc-500 text-sm py-8">{selectedCampaignId ? 'This campaign has no topics.' : 'Select a campaign.'}</div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};