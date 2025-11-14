

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, getProjects, addProject, updateProject, deleteProject, getCampaigns, addCampaign, updateCampaign, deleteCampaign, getTopics, addTopic, updateTopic, deleteTopic, getContentById, getBrandVoiceProfiles } from '../services/firebaseService';
import { Project, Campaign, Topic, SavedContent, BrandVoiceProfile, View, EditablePlatform, PerformanceAnalysis } from '../types';
import { ContentTabs } from './ContentTabs';
import { useGeneration } from '../contexts/GenerationContext';
import { SearchIcon, BoardViewIcon, ListViewIcon, BackIcon, SkeletonItem } from './Icons';
import { BrandVoiceCTA } from './projects/BrandVoiceCTA';
import { ManagementModal } from './projects/modals/ManagementModal';
import { GenerationModal } from './projects/modals/GenerationModal';
import { TopicGenerationModal } from './projects/modals/TopicGenerationModal';
import { DeleteConfirmationModal } from './projects/modals/DeleteConfirmationModal';
import { ProjectBoardView } from './projects/ProjectBoardView';
import { ProjectListView } from './projects/ProjectListView';

// --- PROPS ---
interface ProjectsDashboardProps {
    user: User;
    onNavigate: (view: View) => void;
}

// --- TYPES ---
type ModalType = 'project' | 'campaign' | 'topic';
type ModalMode = 'add' | 'edit';
type ModalState = {
    isOpen: boolean;
    type: ModalType | null;
    mode: ModalMode;
    data?: Project | Campaign | Topic | null;
}
type ProjectViewMode = 'board' | 'list';

export type CampaignWithTopics = Campaign & { topics: Topic[] };
export type ProjectWithCampaigns = Project & { campaigns: CampaignWithTopics[] };

// --- MAIN COMPONENT ---
export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ user, onNavigate }) => {
    // State
    const [projectViewMode, setProjectViewMode] = useState<ProjectViewMode>('board');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Board view state
    const [projects, setProjects] = useState<Project[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(selectedProjectId ? null : null); // Reset on project change
    
    // List view state
    const [listData, setListData] = useState<ProjectWithCampaigns[]>([]);
    const [isListLoading, setIsListLoading] = useState(false);
    
    // Shared state
    const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
    const [viewedContent, setViewedContent] = useState<SavedContent | null>(null);
    const [loading, setLoading] = useState({ projects: true, campaigns: false, topics: false, content: false });
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null, mode: 'add', data: null });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: ModalType | null; item: Project | Campaign | Topic | null }>({ isOpen: false, type: null, item: null });
    const [isDeleting, setIsDeleting] = useState(false);
    const [generationModalTopic, setGenerationModalTopic] = useState<Topic | null>(null);
    
    const [topicGenModalState, setTopicGenModalState] = useState<{
        isOpen: boolean;
        project?: Project;
        campaign?: Campaign;
    }>({ isOpen: false });

    // Brand Voice CTA state
    const [hasBrandVoiceProfiles, setHasBrandVoiceProfiles] = useState(true);
    const [isCtaDismissed, setIsCtaDismissed] = useState(localStorage.getItem('brandVoiceCtaDismissed') === 'true');
    
    useEffect(() => {
        getBrandVoiceProfiles(user.uid)
            .then(profiles => setHasBrandVoiceProfiles(profiles.length > 0))
            .catch(console.error);
    }, [user.uid]);

    const handleDismissCta = useCallback(() => {
        localStorage.setItem('brandVoiceCtaDismissed', 'true');
        setIsCtaDismissed(true);
    }, []);
    
    // --- DATA FETCHING ---
    const fetchProjects = useCallback(async () => {
        setLoading(prev => ({ ...prev, projects: true }));
        setError(null);
        try {
            const userProjects = await getProjects(user.uid);
            setProjects(userProjects);
            // If selectedProjectId is no longer valid, reset it
            if (selectedProjectId && !userProjects.some(p => p.id === selectedProjectId)) {
                setSelectedProjectId(null);
                setCampaigns([]);
                setTopics([]);
            }
        } catch (e: any) { 
            setError(e.message || "Failed to load projects."); 
        } finally { 
            setLoading(prev => ({ ...prev, projects: false })); 
        }
    }, [user.uid, selectedProjectId]);

    const fetchCampaigns = useCallback(async (projectId: string) => {
        setLoading(prev => ({ ...prev, campaigns: true }));
        setError(null);
        try {
            const projectCampaigns = await getCampaigns(projectId, user.uid);
            setCampaigns(projectCampaigns);
            // If selectedCampaignId is no longer valid, reset it
            if (selectedCampaignId && !projectCampaigns.some(c => c.id === selectedCampaignId)) {
                setSelectedCampaignId(null);
                setTopics([]);
            }
        } catch (e: any) { 
            setError(e.message || "Failed to load campaigns."); 
        } finally { 
            setLoading(prev => ({ ...prev, campaigns: false })); 
        }
    }, [user.uid, selectedCampaignId]);

    const fetchTopics = useCallback(async (campaignId: string) => {
        setLoading(prev => ({ ...prev, topics: true }));
        setError(null);
        try {
            const campaignTopics = await getTopics(campaignId, user.uid);
            setTopics(campaignTopics);
            // If activeTopic is no longer valid, reset it
            if (activeTopic && !campaignTopics.some(t => t.id === activeTopic.id)) {
                setActiveTopic(null);
                setViewedContent(null);
            }
        } catch (e: any) { 
            setError(e.message || "Failed to load topics."); 
        } finally { 
            setLoading(prev => ({ ...prev, topics: false })); 
        }
    }, [user.uid, activeTopic]);
    
    const fetchAllDataForList = useCallback(async () => {
        setIsListLoading(true);
        setError(null);
        try {
            const projects = await getProjects(user.uid);
            const projectsWithData: ProjectWithCampaigns[] = await Promise.all(
                projects.map(async (project) => {
                    const campaigns = await getCampaigns(project.id, user.uid);
                    const campaignsWithTopics: CampaignWithTopics[] = await Promise.all(
                        campaigns.map(async (campaign) => {
                            const topics = await getTopics(campaign.id, user.uid);
                            return { ...campaign, topics };
                        })
                    );
                    return { ...project, campaigns: campaignsWithTopics };
                })
            );
            setListData(projectsWithData);
        } catch (e: any) {
            setError(e.message || "Failed to load data for list view.");
        } finally {
            setIsListLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        if (projectViewMode === 'board') {
            fetchProjects();
        } else {
            fetchAllDataForList();
        }
    }, [projectViewMode, fetchProjects, fetchAllDataForList]);

    // Fetch campaigns when selectedProjectId changes
    useEffect(() => {
        if (selectedProjectId && projectViewMode === 'board') {
            fetchCampaigns(selectedProjectId);
        } else if (!selectedProjectId) {
            setCampaigns([]);
            setTopics([]);
            setSelectedCampaignId(null);
            setActiveTopic(null);
            setViewedContent(null);
        }
    }, [selectedProjectId, projectViewMode, fetchCampaigns]);

    // Fetch topics when selectedCampaignId changes
    useEffect(() => {
        if (selectedCampaignId && projectViewMode === 'board') {
            fetchTopics(selectedCampaignId);
        } else if (!selectedCampaignId) {
            setTopics([]);
            setActiveTopic(null);
            setViewedContent(null);
        }
    }, [selectedCampaignId, projectViewMode, fetchTopics]);
    
    const filteredListData = useMemo(() => {
        if (!searchQuery) return listData;
        const lowercasedQuery = searchQuery.toLowerCase();

        return listData.map(project => {
            const matchingCampaigns = project.campaigns.map(campaign => {
                const matchingTopics = campaign.topics.filter(topic =>
                    topic.name.toLowerCase().includes(lowercasedQuery)
                );
                if (campaign.name.toLowerCase().includes(lowercasedQuery) || matchingTopics.length > 0) {
                    return { ...campaign, topics: matchingTopics };
                }
                return null;
            }).filter((c): c is CampaignWithTopics => c !== null);

            if (project.name.toLowerCase().includes(lowercasedQuery) || matchingCampaigns.length > 0) {
                return { ...project, campaigns: matchingCampaigns };
            }
            return null;
        }).filter((p): p is ProjectWithCampaigns => p !== null);

    }, [searchQuery, listData]);


    // --- SELECTION & NAVIGATION HANDLERS ---
    const handleSelectProject = useCallback((projectId: string) => {
        setSelectedProjectId(projectId);
        setSelectedCampaignId(null); // Reset campaign selection when project changes
        setActiveTopic(null);
        setViewedContent(null);
        setCampaigns([]);
        setTopics([]);
        // fetchCampaigns will be triggered by useEffect
    }, []);

    const handleSelectCampaign = useCallback((campaignId: string) => {
        setSelectedCampaignId(campaignId);
        setActiveTopic(null);
        setViewedContent(null);
        setTopics([]);
        // fetchTopics will be triggered by useEffect
    }, []);
    
    const handleSelectTopic = useCallback((topic: Topic) => {
        setActiveTopic(topic);
        setViewedContent(null);
        if (topic.status === 'Generated' && topic.contentId) {
            setLoading(prev => ({...prev, content: true}));
            setError(null);
            getContentById(topic.contentId)
                .then(content => {
                    if (content) setViewedContent(content);
                    else throw new Error("Content not found.");
                })
                .catch((e: any) => setError(e.message || "Could not load the content for this topic."))
                .finally(() => setLoading(prev => ({...prev, content: false})));
        }
    }, []);
    
    const handleBackToProjects = useCallback(() => {
        setSelectedProjectId(null);
        setSelectedCampaignId(null);
        setActiveTopic(null);
        setViewedContent(null);
        setCampaigns([]);
        setTopics([]);
    }, []);
    
    const handleBackToCampaigns = useCallback(() => {
        setSelectedCampaignId(null);
        setActiveTopic(null);
        setViewedContent(null);
        setTopics([]);
    }, []);
    
    const handleBackToDashboard = useCallback(() => {
        setViewedContent(null);
        setActiveTopic(null);
    }, []);

    const handleUpdateViewedContent = useCallback((platform: EditablePlatform, newContent: any) => {
        setViewedContent(prevContent => {
            if (!prevContent) return null;
            return {
                ...prevContent,
                [platform]: newContent,
            };
        });
    }, []);
    
    const handleAnalysisGenerated = useCallback((analysis: PerformanceAnalysis) => {
        setViewedContent(prev => prev ? { ...prev, analysis } : null);
    }, []);


    // --- CRUD HANDLERS ---
    const openModal = useCallback((type: ModalType, mode: ModalMode, data?: Project | Campaign | Topic) => {
        setModal({ isOpen: true, type, mode, data });
    }, []);

    const handleModalSubmit = useCallback(async (formData: { name: string, description: string }) => {
        if (!modal.type || !formData.name) return;
        
        const currentProject = projects.find(p => p.id === selectedProjectId);
        const currentCampaign = campaigns.find(c => c.id === selectedCampaignId);

        try {
            if (modal.mode === 'add') {
                switch (modal.type) {
                    case 'project':
                        await addProject({ userId: user.uid, name: formData.name, description: formData.description });
                        break;
                    case 'campaign':
                        if (currentProject) await addCampaign({ userId: user.uid, projectId: currentProject.id, name: formData.name, goal: formData.description });
                        break;
                    case 'topic':
                        if (currentProject && currentCampaign) await addTopic({ userId: user.uid, projectId: currentProject.id, campaignId: currentCampaign.id, name: formData.name });
                        break;
                }
            } else if (modal.data) {
                 switch (modal.type) {
                    case 'project':
                        await updateProject(modal.data.id, { name: formData.name, description: formData.description });
                        break;
                    case 'campaign':
                         await updateCampaign(modal.data.id, { name: formData.name, goal: formData.description });
                         break;
                    case 'topic':
                         await updateTopic(modal.data.id, { name: formData.name });
                         break;
                 }
            }
            
            if (projectViewMode === 'list') {
                await fetchAllDataForList();
            } else {
                 await fetchProjects();
                 if(selectedProjectId) await fetchCampaigns(selectedProjectId); // Re-fetch only current selection
                 if(selectedCampaignId) await fetchTopics(selectedCampaignId); // Re-fetch only current selection
            }
        } catch (e: any) {
            setError(e.message || `Failed to ${modal.mode} ${modal.type}.`);
        }
        
        setModal({ isOpen: false, type: null, mode: 'add', data: null });
    }, [modal, user.uid, selectedProjectId, selectedCampaignId, projects, campaigns, projectViewMode, fetchProjects, fetchCampaigns, fetchTopics, fetchAllDataForList]);
    
    const handleDelete = useCallback((type: ModalType, item: Project | Campaign | Topic) => {
        setDeleteModal({ isOpen: true, type, item });
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteModal.type || !deleteModal.item) return;
        const { type, item } = deleteModal;
        
        setIsDeleting(true);
        setError(null);
    
        try {
            switch (type) {
                case 'project': await deleteProject(item.id, user.uid); break;
                case 'campaign': await deleteCampaign(item.id, user.uid); break;
                case 'topic': await deleteTopic(item.id, user.uid); break;
            }
    
            if (projectViewMode === 'list') {
                await fetchAllDataForList();
            } else {
                // Re-fetch only the necessary data based on deletion context
                if (type === 'project') {
                    if (selectedProjectId === item.id) handleBackToProjects(); // Nav back if deleted item was selected
                    await fetchProjects();
                } else if (type === 'campaign') {
                    if (selectedCampaignId === item.id) handleBackToCampaigns(); // Nav back if deleted item was selected
                    if (selectedProjectId) await fetchCampaigns(selectedProjectId);
                } else if (type === 'topic') {
                    if (activeTopic?.id === item.id) handleBackToDashboard(); // Nav back if deleted item was selected
                    if (selectedCampaignId) await fetchTopics(selectedCampaignId);
                }
            }
        } catch (e: any) {
            setError(e.message || `Failed to delete ${type}.`);
        } finally {
            setIsDeleting(false);
            setDeleteModal({ isOpen: false, type: null, item: null });
        }
    }, [deleteModal, user.uid, activeTopic, projectViewMode, selectedProjectId, selectedCampaignId, handleBackToProjects, handleBackToCampaigns, handleBackToDashboard, fetchProjects, fetchCampaigns, fetchTopics, fetchAllDataForList]);
    
    const handleGenerationSuccess = useCallback(() => {
        if (projectViewMode === 'list') {
            fetchAllDataForList();
        } else if (selectedCampaignId) {
            fetchTopics(selectedCampaignId);
        }
    }, [projectViewMode, selectedCampaignId, fetchAllDataForList, fetchTopics]);

    const openTopicGenModal = useCallback((project: Project, campaign: Campaign) => {
        setTopicGenModalState({ isOpen: true, project, campaign });
    }, []);

    if (activeTopic && (viewedContent || loading.content)) {
        return (
            <section className="animate-fade-in min-h-[70vh]">
                <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4">
                    <BackIcon />
                    Back to Dashboard
                </button>
                {loading.content ? <SkeletonItem /> :
                    viewedContent && (
                        <ContentTabs
                            content={viewedContent}
                            topic={activeTopic.name}
                            language={viewedContent.language}
                            onContentUpdate={handleUpdateViewedContent}
                            onAnalysisGenerated={handleAnalysisGenerated}
                        />
                    )
                }
            </section>
        );
    }
    
    return (
        <>
            {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300 animate-fade-in flex justify-between items-center">
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="text-xl font-bold hover:text-white transition-colors">&times;</button>
                </div>
            )}
            
            {!loading.projects && !hasBrandVoiceProfiles && !isCtaDismissed && (
                <BrandVoiceCTA onNavigate={onNavigate} onDismiss={handleDismissCta} />
            )}

            <div className="space-y-6 animate-fade-in-fast">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-xs">
                         <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                         <input
                            type="text"
                            placeholder="Search all..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value) setProjectViewMode('list');
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder-zinc-500"
                        />
                    </div>
                    <div className="flex items-center justify-center bg-zinc-800/50 p-1 rounded-lg">
                         <button onClick={() => setProjectViewMode('board')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${projectViewMode === 'board' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                            <BoardViewIcon /> Board
                         </button>
                         <button onClick={() => setProjectViewMode('list')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${projectViewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}>
                            <ListViewIcon /> List
                         </button>
                    </div>
                </div>
                {projectViewMode === 'board' ? (
                    <ProjectBoardView
                        projects={projects}
                        campaigns={campaigns}
                        topics={topics}
                        loading={loading}
                        selectedProjectId={selectedProjectId}
                        selectedCampaignId={selectedCampaignId}
                        activeTopic={activeTopic}
                        onSelectProject={handleSelectProject}
                        onSelectCampaign={handleSelectCampaign}
                        onSelectTopic={handleSelectTopic}
                        onOpenModal={openModal}
                        onDelete={handleDelete}
                        onOpenTopicGenModal={openTopicGenModal}
                        onSetGenerationModalTopic={setGenerationModalTopic}
                        onBackToProjects={handleBackToProjects}
                        onBackToCampaigns={handleBackToCampaigns}
                    />
                ) : (
                    <ProjectListView
                        isLoading={isListLoading}
                        data={filteredListData}
                        searchQuery={searchQuery}
                        activeTopic={activeTopic}
                        onSelectTopic={handleSelectTopic}
                        onOpenModal={openModal}
                        onDelete={handleDelete}
                        onSetGenerationModalTopic={setGenerationModalTopic}
                    />
                )}
            </div>

            {modal.isOpen && modal.type && (
                <ManagementModal 
                    type={modal.type}
                    mode={modal.mode}
                    initialData={modal.data}
                    onClose={() => setModal({ isOpen: false, type: null, mode: 'add' })}
                    onSubmit={handleModalSubmit}
                />
            )}
            
            {generationModalTopic && (
                <GenerationModal 
                    topic={generationModalTopic}
                    user={user}
                    onClose={() => setGenerationModalTopic(null)}
                    onGenerationSuccess={handleGenerationSuccess}
                />
            )}

            {topicGenModalState.isOpen && topicGenModalState.campaign && topicGenModalState.project && (
                <TopicGenerationModal
                    project={topicGenModalState.project}
                    campaign={topicGenModalState.campaign}
                    user={user}
                    onClose={() => setTopicGenModalState({ isOpen: false })}
                    onGenerationSuccess={() => {
                        if (selectedCampaignId) fetchTopics(selectedCampaignId);
                        if (projectViewMode === 'list') fetchAllDataForList();
                    }}
                />
            )}

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmDelete}
                itemType={deleteModal.type || ''}
                itemName={deleteModal.item?.name || ''}
                isDeleting={isDeleting}
            />
        </>
    );
};