import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, getProjects, addProject, updateProject, deleteProject, getCampaigns, addCampaign, updateCampaign, deleteCampaign, getTopics, addTopic, updateTopic, deleteTopic, getContentById, saveGeneratedContent, getBrandVoiceProfiles, addBrandVoiceProfile, updateBrandVoiceProfile, deleteBrandVoiceProfile } from '../services/firebaseService';
import { analyzeBrandVoice } from '../services/geminiService';
import { Project, Campaign, Topic, SavedContent, EditablePlatform, BrandVoiceProfile } from '../types';
import { ContentTabs } from './ContentTabs';
import { useGeneration } from '../contexts/GenerationContext';
import { AccountDashboard } from './AccountDashboard'; // Import the new component

// --- PROPS ---
interface ProjectsDashboardProps {
    user: User;
}

// --- ICONS (copied from TopicForm to be self-contained) ---
const WebIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 003 12c0 .778-.099 1.533-.284 2.253m0 0" /></svg>);
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.03998C6.49999 2.03998 2.03999 6.49998 2.03999 12C2.03999 16.89 5.52999 20.93 10.12 21.8v-8.01H7.07999v-3.72h3.04V8.41998C10.12 5.41998 11.92 3.87998 14.67 3.87998C15.53 3.87998 16.32 3.93998 17.07 4.03998V7.24998H15.21C13.8 7.24998 13.56 8.01998 13.56 8.78998V10.07H17.01L16.36 13.79H13.56V21.8C18.47 20.93 21.96 16.89 21.96 12C21.96 6.49998 17.5 2.03998 12 2.03998Z" /></svg>);
const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.98-1.55-1.97-2.05-4.38-1.51-6.77.52-2.31 2.3-4.14 4.54-5.06 2.72-1.11 5.69-.64 8.04 1.18.12 2.44-.81 4.84-2.55 6.37-1.42 1.25-3.34 1.66-5.18 1.1-1.26-.38-2.35-1.24-2.9-2.42a2.53 2.53 0 0 1 .53-2.77c.8-1.1 2.19-1.65 3.43-1.45.96.15 1.83.69 2.49 1.41.68.74 1.04 1.72 1.04 2.71-.02 1.09-.45 2.09-1.23 2.82-.49.46-1.1.8-1.72.91-.53.09-1.08.08-1.62-.05-1.1-.25-2.09-.89-2.77-1.8-.19-.26-.35-.55-.49-.86-.28-.6-.44-1.28-.5-1.97-.05-.53.03-1.07.18-1.58.46-1.58 1.64-2.8 3.11-3.26.83-.26 1.7-.32 2.55-.2.85.12 1.68.49 2.4 1.05.02.01.03.02.04.04v-4.67c-.33-.16-.67-.3-.99-.47-1.12-.57-2.34-.85-3.55-.95-1.21-.1-2.42.06-3.63.06z" /></svg>);
const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM9.75 15.375V8.625l4.5 3.375-4.5 3.375z" clipRule="evenodd" /></svg>);
const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0 -2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>);
const XIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const PlusIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const EditIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const DeleteIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const SparkleIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M9 4.5a.75.75 0 01.75.75V6h.75a.75.75 0 010 1.5H9.75v.75a.75.75 0 01-1.5 0V7.5H7.5a.75.75 0 010-1.5H8.25V5.25A.75.75 0 019 4.5zM12.75 7.5a.75.75 0 01.75-.75H15v-.75a.75.75 0 011.5 0V6.75H17.25a.75.75 0 010 1.5H16.5v.75a.75.75 0 01-1.5 0V8.25H13.5a.75.75 0 01-.75-.75zM15 12a.75.75 0 01.75.75V15h.75a.75.75 0 010 1.5H15.75v.75a.75.75 0 01-1.5 0V16.5H13.5a.75.75 0 010-1.5H14.25v-.75A.75.75 0 0115 12zM12 1.5a.75.75 0 01.75.75V3h.75a.75.75 0 010 1.5H12.75v.75a.75.75 0 01-1.5 0V4.5H10.5a.75.75 0 010-1.5H11.25V2.25A.75.75 0 0112 1.5zM10.5 18.75a.75.75 0 01.75.75V21h.75a.75.75 0 010 1.5H11.25v.75a.75.75 0 01-1.5 0V22.5H9a.75.75 0 010-1.5h.75v-.75a.75.75 0 01.75-.75zM18.75 10.5a.75.75 0 01.75.75V12h.75a.75.75 0 010 1.5H19.5v.75a.75.75 0 01-1.5 0V13.5H17.25a.75.75 0 010-1.5H18v-.75a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
const BackIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const CoPilotIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ProjectsIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-13.5h16.5M3.75 6.75h16.5v10.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6.75z" /></svg>;
const BoardViewIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-15h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013.5 4.5z" /></svg>;
const ListViewIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const SearchIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const UserCircleIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


// --- TYPES ---
type ModalType = 'project' | 'campaign' | 'topic';
type ModalMode = 'add' | 'edit';
type ModalState = {
    isOpen: boolean;
    type: ModalType | null;
    mode: ModalMode;
    data?: Project | Campaign | Topic | null;
}
type DashboardView = 'projects' | 'brandVoice' | 'account';
type ProjectViewMode = 'board' | 'list';

type CampaignWithTopics = Campaign & { topics: Topic[] };
type ProjectWithCampaigns = Project & { campaigns: CampaignWithTopics[] };


const ALL_PLATFORMS: { id: EditablePlatform; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIcon },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
    { id: 'youtube', name: 'YouTube', icon: YouTubeIcon },
];

// --- HELPER COMPONENTS ---
const SkeletonItem = () => (
    <div className="bg-zinc-800/50 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-zinc-700 rounded w-full"></div>
    </div>
);

// --- MAIN COMPONENT ---
export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ user }) => {
    // State
    const [dashboardView, setDashboardView] = useState<DashboardView>('projects');
    const [projectViewMode, setProjectViewMode] = useState<ProjectViewMode>('board');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Board view state
    const [projects, setProjects] = useState<Project[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    
    // List view state
    const [listData, setListData] = useState<ProjectWithCampaigns[]>([]);
    const [isListLoading, setIsListLoading] = useState(false);
    
    // Shared state
    const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
    const [viewedContent, setViewedContent] = useState<SavedContent | null>(null);
    const [loading, setLoading] = useState({ projects: true, campaigns: false, topics: false, content: false });
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null, mode: 'add', data: null });
    const [generationModalTopic, setGenerationModalTopic] = useState<Topic | null>(null);
    const { activeGenerations, showProgressModal } = useGeneration();
    const [topicGenModalState, setTopicGenModalState] = useState<{
        isOpen: boolean;
        project?: Project;
        campaign?: Campaign;
    }>({ isOpen: false });
    
    // --- DATA FETCHING ---
    const fetchProjects = useCallback(async () => {
        setLoading(prev => ({ ...prev, projects: true }));
        setError(null);
        try {
            const userProjects = await getProjects(user.uid);
            setProjects(userProjects);
        } catch (e: any) { 
            console.error("Error projects:", e.message);
            setError(e.message || "Failed to load projects."); 
        } finally { 
            setLoading(prev => ({ ...prev, projects: false })); 
        }
    }, [user.uid]);

    useEffect(() => {
        if (dashboardView === 'projects' && projectViewMode === 'board') {
            fetchProjects();
        }
    }, [fetchProjects, dashboardView, projectViewMode]);
    
    const fetchCampaigns = useCallback(async (projectId: string) => {
        setLoading(prev => ({ ...prev, campaigns: true }));
        setError(null);
        try {
            const projectCampaigns = await getCampaigns(projectId, user.uid);
            setCampaigns(projectCampaigns);
        } catch (e: any) { 
            console.error("Error campaigns:", e.message);
            setError(e.message || "Failed to load campaigns."); 
        } finally { 
            setLoading(prev => ({ ...prev, campaigns: false })); 
        }
    }, [user.uid]);

    const fetchTopics = useCallback(async (campaignId: string) => {
        setLoading(prev => ({ ...prev, topics: true }));
        setError(null);
        try {
            const campaignTopics = await getTopics(campaignId, user.uid);
            setTopics(campaignTopics);
        } catch (e: any) { 
            console.error("Error topics:", e.message);
            setError(e.message || "Failed to load topics."); 
        } finally { 
            setLoading(prev => ({ ...prev, topics: false })); 
        }
    }, [user.uid]);
    
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
        if (dashboardView === 'projects' && projectViewMode === 'list') {
            fetchAllDataForList();
        }
    }, [dashboardView, projectViewMode, fetchAllDataForList]);
    
    const filteredListData = useMemo(() => {
        if (!searchQuery) return listData;
        const lowercasedQuery = searchQuery.toLowerCase();

        return listData.map(project => {
            const matchingCampaigns = project.campaigns.map(campaign => {
                const matchingTopics = campaign.topics.filter(topic =>
                    topic.name.toLowerCase().includes(lowercasedQuery)
                );
                // Keep campaign if it matches or has matching topics
                if (campaign.name.toLowerCase().includes(lowercasedQuery) || matchingTopics.length > 0) {
                    return { ...campaign, topics: matchingTopics };
                }
                return null;
            }).filter((c): c is CampaignWithTopics => c !== null);

            // Keep project if it matches or has matching campaigns
            if (project.name.toLowerCase().includes(lowercasedQuery) || matchingCampaigns.length > 0) {
                return { ...project, campaigns: matchingCampaigns };
            }
            return null;
        }).filter((p): p is ProjectWithCampaigns => p !== null);

    }, [searchQuery, listData]);


    // --- SELECTION HANDLERS & EFFECTS ---
    const handleSelectProject = (projectId: string) => {
        setSelectedProjectId(projectId);
        setSelectedCampaignId(null);
        setActiveTopic(null);
        setViewedContent(null);
        setCampaigns([]);
        setTopics([]);
        fetchCampaigns(projectId);
    };

    const handleSelectCampaign = (campaignId: string) => {
        setSelectedCampaignId(campaignId);
        setActiveTopic(null);
        setViewedContent(null);
        setTopics([]);
        fetchTopics(campaignId);
    };
    
    const handleSelectTopic = useCallback((topic: Topic) => {
        setActiveTopic(topic);
        setViewedContent(null); // Clear previous content
        if (topic.status === 'Generated' && topic.contentId) {
            setLoading(prev => ({...prev, content: true}));
            setError(null);
            getContentById(topic.contentId)
                .then(content => {
                    if (content) {
                        setViewedContent(content);
                    } else {
                        throw new Error("Content not found.");
                    }
                })
                .catch((e: any) => {
                    console.error(e);
                    setError(e.message || "Could not load the content for this topic.");
                })
                .finally(() => {
                    setLoading(prev => ({...prev, content: false}));
                });
        }
    }, []);
    
    const handleBackToProjects = () => {
        setSelectedProjectId(null);
        setSelectedCampaignId(null);
        setActiveTopic(null);
        setViewedContent(null);
        setCampaigns([]);
        setTopics([]);
    };
    
    const handleBackToCampaigns = () => {
        setSelectedCampaignId(null);
        setActiveTopic(null);
        setViewedContent(null);
        setTopics([]);
    };
    
    const handleBackToDashboard = () => {
        setViewedContent(null);
        setActiveTopic(null);
    };

    // --- CRUD HANDLERS ---
    const handleModalSubmit = useCallback(async (formData: { name: string, description: string }) => {
        if (!modal.type || !formData.name) return;
        
        const selectedProject = projects.find(p => p.id === selectedProjectId);
        const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

        try {
            if (modal.mode === 'add') {
                switch (modal.type) {
                    case 'project':
                        await addProject({ userId: user.uid, name: formData.name, description: formData.description });
                        break;
                    case 'campaign':
                        if (!selectedProject) return;
                        await addCampaign({ userId: user.uid, projectId: selectedProject.id, name: formData.name, goal: formData.description });
                        break;
                    case 'topic':
                        if (!selectedProject || !selectedCampaign) return;
                        await addTopic({ userId: user.uid, projectId: selectedProject.id, campaignId: selectedCampaign.id, name: formData.name });
                        break;
                }
            } else { // Edit mode
                 if (!modal.data) return;
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
            // Refetch data for the active view
            if (projectViewMode === 'list') {
                await fetchAllDataForList();
            } else {
                 await fetchProjects();
                 if(selectedProjectId) await fetchCampaigns(selectedProjectId);
                 if(selectedCampaignId) await fetchTopics(selectedCampaignId);
            }
        } catch (e: any) {
            console.error(`Error during modal submit for ${modal.type}:`, e);
            setError(e.message || `Failed to ${modal.mode} ${modal.type}.`);
        }
        
        setModal({ isOpen: false, type: null, mode: 'add', data: null });
    }, [modal, user.uid, selectedProjectId, selectedCampaignId, projects, campaigns, projectViewMode, fetchProjects, fetchCampaigns, fetchTopics, fetchAllDataForList]);
    
    const handleDelete = useCallback(async (type: ModalType, item: Project | Campaign | Topic) => {
        if (!window.confirm(`Are you sure you want to delete this ${type} and all its contents? This action cannot be undone.`)) return;
        try {
            switch (type) {
                case 'project':
                    await deleteProject(item.id);
                    if(selectedProjectId === item.id) handleBackToProjects();
                    break;
                case 'campaign':
                    await deleteCampaign(item.id);
                    if(selectedCampaignId === item.id) handleBackToCampaigns();
                    break;
                case 'topic':
                    await deleteTopic(item.id);
                    if (activeTopic?.id === item.id) handleBackToDashboard();
                    break;
            }
            // Refetch data for the active view
            if (projectViewMode === 'list') {
                await fetchAllDataForList();
            } else {
                 await fetchProjects();
                 if(selectedProjectId) await fetchCampaigns(selectedProjectId);
                 if(selectedCampaignId) await fetchTopics(selectedCampaignId);
            }
        } catch (e: any) {
            console.error(`Error deleting ${type}:`, e);
            setError(e.message || `Failed to delete ${type}.`);
        }
    }, [fetchProjects, selectedProjectId, selectedCampaignId, fetchCampaigns, fetchTopics, activeTopic, projectViewMode, fetchAllDataForList]);
    
    const handleGenerationSuccess = () => {
        if (projectViewMode === 'list') {
            fetchAllDataForList();
        } else if (selectedCampaignId) {
            fetchTopics(selectedCampaignId);
        }
    };
    

    const renderItem = (item: Project | Campaign, type: 'project' | 'campaign', isSelected: boolean, onSelect: () => void) => (
        <div key={item.id} className={`relative rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-pink-500/10 border-pink-500' : 'bg-zinc-900/50 border-transparent hover:bg-zinc-800'}`}>
            <button onClick={onSelect} className="w-full text-left p-3 pr-20">
                <h3 className={`font-bold truncate ${isSelected ? 'text-pink-300' : 'text-zinc-200'}`}>{item.name}</h3>
                {(item as any).description && <p className="text-xs text-zinc-400 truncate mt-1">{(item as any).description}</p>}
                {(item as any).goal && <p className="text-xs text-zinc-400 truncate mt-1">{(item as any).goal}</p>}
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setModal({isOpen: true, type: type, mode: 'edit', data: item})}} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(type, item)}} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
            </div>
        </div>
    );
    
    const renderTopicItem = (topic: Topic, isSelected: boolean) => {
        const existingTask = activeGenerations.find(task => task.id === topic.id);

        return (
            <div key={topic.id} className={`relative group rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-pink-500/10 border-pink-500' : 'bg-zinc-900/50 border-transparent hover:bg-zinc-800'}`}>
                <button onClick={() => handleSelectTopic(topic)} className="w-full text-left p-3 pr-24 flex justify-between items-center gap-2">
                    <div>
                        <span className={`font-medium truncate ${isSelected ? 'text-pink-300' : 'text-zinc-200'}`}>{topic.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${topic.status === 'Generated' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-300'}`}>{topic.status}</span>
                </button>
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(topic.status === 'Draft' || existingTask) && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (existingTask) {
                                    showProgressModal();
                                } else {
                                    setGenerationModalTopic(topic);
                                }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-md"
                        >
                            <SparkleIcon className={`w-4 h-4 ${existingTask ? 'animate-pulse text-pink-400' : ''}`} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setModal({isOpen: true, type: 'topic', mode: 'edit', data: topic})}} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('topic', topic)}} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
                </div>
            </div>
        );
    }
    
    const renderBoardView = () => (
        <div className="relative lg:grid lg:grid-cols-3 lg:gap-6 w-full min-h-[60vh] flex overflow-x-hidden animate-fade-in-fast">
            {/* Projects Column */}
            <div className={`w-full flex-shrink-0 lg:w-auto transition-transform duration-300 ease-in-out ${selectedProjectId ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
                {renderColumn('Projects', 'project', projects, loading.projects, selectedProjectId, handleSelectProject, () => setModal({isOpen: true, type: 'project', mode: 'add'}), 'Create your first project.', false, <h2 className="text-xl font-bold text-zinc-300">Projects</h2>)}
            </div>
            
            {/* Campaigns Column */}
            <div className={`absolute lg:relative w-full h-full flex-shrink-0 lg:w-auto transition-transform duration-300 ease-in-out ${!selectedProjectId ? 'translate-x-full' : selectedCampaignId ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
                {renderColumn('Campaigns', 'campaign', campaigns, loading.campaigns, selectedCampaignId, handleSelectCampaign, () => setModal({isOpen: true, type: 'campaign', mode: 'add'}), selectedProjectId ? 'This project has no campaigns.' : 'Select a project to see campaigns.', !selectedProjectId, 
                    <div className="flex items-center gap-2">
                        <button onClick={handleBackToProjects} className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white">
                            <BackIcon />
                        </button>
                        <h2 className="text-xl font-bold text-zinc-300">Campaigns</h2>
                    </div>
                )}
            </div>

            {/* Topics Column */}
             <div className={`absolute lg:relative w-full h-full flex-shrink-0 lg:w-auto transition-transform duration-300 ease-in-out ${!selectedCampaignId ? 'translate-x-full' : 'translate-x-0'} lg:translate-x-0`}>
                <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <button onClick={handleBackToCampaigns} className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white lg:hidden">
                                <BackIcon />
                            </button>
                            <h2 className="text-xl font-bold text-zinc-300 truncate">Topics</h2>
                        </div>
                         <div className="flex-shrink-0 flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    const project = projects.find(p => p.id === selectedProjectId);
                                    const campaign = campaigns.find(c => c.id === selectedCampaignId);
                                    if (project && campaign) {
                                        setTopicGenModalState({ isOpen: true, project, campaign });
                                    }
                                }}
                                disabled={!selectedCampaignId} 
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600/50 border border-purple-500 rounded-lg hover:bg-purple-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Generate Topics with AI"
                            >
                                <SparkleIcon className="w-4 h-4"/> AI
                            </button>
                            <button onClick={() => setModal({isOpen: true, type: 'topic', mode: 'add'})} disabled={!selectedCampaignId} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded-lg hover:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <PlusIcon className="w-4 h-4"/> New
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-1 space-y-2">
                         {loading.topics ? Array.from({length: 3}).map((_, i) => <SkeletonItem key={i} />)
                          : topics.length > 0 ? topics.map(topic => renderTopicItem(topic, activeTopic?.id === topic.id))
                          : <div className="text-center text-zinc-500 text-sm py-8">{selectedCampaignId ? 'This campaign has no topics.' : 'Select a campaign to see topics.'}</div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
    
    const renderListView = () => (
         <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 animate-fade-in-fast min-h-[60vh]">
             {isListLoading ? (
                 <div className="space-y-2">{Array.from({length: 8}).map((_, i) => <SkeletonItem key={i} />)}</div>
             ) : filteredListData.length === 0 ? (
                 <div className="text-center text-zinc-500 text-sm py-12">{searchQuery ? 'No results found.' : 'Create a project to get started.'}</div>
             ) : (
                 <div className="space-y-1">
                     {filteredListData.map(project => (
                         <div key={project.id}>
                             <div className="group relative flex justify-between items-center p-2 rounded-md hover:bg-zinc-800/50">
                                 <div className="font-bold text-zinc-200">{project.name}</div>
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setModal({isOpen: true, type: 'project', mode: 'edit', data: project})}} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete('project', project)}} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
                                </div>
                             </div>
                             {project.campaigns.map(campaign => (
                                <div key={campaign.id} className="pl-4">
                                     <div className="group relative flex justify-between items-center p-2 rounded-md hover:bg-zinc-800/50">
                                        <div className="text-zinc-300">{campaign.name}</div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); setModal({isOpen: true, type: 'campaign', mode: 'edit', data: campaign})}} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete('campaign', campaign)}} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
                                        </div>
                                    </div>
                                    <div className="pl-4 space-y-2 py-1">
                                        {campaign.topics.map(topic => renderTopicItem(topic, activeTopic?.id === topic.id))}
                                    </div>
                                </div>
                             ))}
                         </div>
                     ))}
                 </div>
             )}
         </div>
    );
    

    const renderColumn = (title: string, type: 'project' | 'campaign', items: any[], loadingState: boolean, selectedId: string | null, onSelect: (id: string) => void, onAdd: () => void, emptyText: string, addDisabled: boolean = false, mobileHeader?: React.ReactNode) => (
        <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 flex flex-col h-full">
             <div className="flex justify-between items-center mb-4">
                <div className="lg:hidden">{mobileHeader}</div>
                <h2 className="text-xl font-bold text-zinc-300 hidden lg:block">{title}</h2>
                <button onClick={onAdd} disabled={addDisabled} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded-lg hover:border-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <PlusIcon className="w-4 h-4"/> New
                </button>
            </div>
            <div className="space-y-2 flex-grow overflow-y-auto pr-1">
                {loadingState ? Array.from({length: 3}).map((_, i) => <SkeletonItem key={i} />)
                  : items.length > 0 ? items.map(item => renderItem(item, type, item.id === selectedId, () => onSelect(item.id)))
                  : <div className="text-center text-zinc-500 text-sm py-8">{emptyText}</div>
                }
            </div>
        </div>
    );
    
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
                            onContentUpdate={() => {}}
                            isReadOnly={true}
                        />
                    )
                }
            </section>
        );
    }
    
    return (
        <section className="animate-fade-in min-h-[70vh]">
             <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8">
                Content <span className="text-pink-500">Dashboard</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <aside className="md:col-span-1">
                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 space-y-1">
                        <button onClick={() => setDashboardView('projects')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${dashboardView === 'projects' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                            <ProjectsIcon />
                            Projects
                        </button>
                        <button onClick={() => setDashboardView('brandVoice')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${dashboardView === 'brandVoice' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                            <CoPilotIcon />
                            Brand Voice Co-Pilot
                        </button>
                         <button onClick={() => setDashboardView('account')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${dashboardView === 'account' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                            <UserCircleIcon />
                            My Account
                        </button>
                    </div>
                </aside>

                 {/* Main Content Area */}
                <main className="md:col-span-3">
                     {error && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-300 animate-fade-in flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">An Error Occurred</h3>
                                <p className="text-sm">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="text-xl font-bold hover:text-white transition-colors">&times;</button>
                        </div>
                    )}

                    {dashboardView === 'projects' && (
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
                            {projectViewMode === 'board' ? renderBoardView() : renderListView()}
                        </div>
                    )}
                    
                    {dashboardView === 'brandVoice' && (
                        <BrandVoiceDashboard user={user} />
                    )}
                    
                    {dashboardView === 'account' && (
                        <AccountDashboard user={user} />
                    )}

                </main>
            </div>


            {/* MODAL for Add/Edit */}
            {modal.isOpen && modal.type && (
                <ManagementModal 
                    type={modal.type}
                    mode={modal.mode}
                    initialData={modal.data}
                    onClose={() => setModal({ isOpen: false, type: null, mode: 'add' })}
                    onSubmit={handleModalSubmit}
                />
            )}
            
            {/* MODAL for Content Generation */}
            {generationModalTopic && (
                <GenerationModal 
                    topic={generationModalTopic}
                    user={user}
                    onClose={() => setGenerationModalTopic(null)}
                    onGenerationSuccess={handleGenerationSuccess}
                />
            )}

            {/* MODAL for AI Topic Generation */}
            {topicGenModalState.isOpen && topicGenModalState.campaign && topicGenModalState.project && (
                <TopicGenerationModal
                    project={topicGenModalState.project}
                    campaign={topicGenModalState.campaign}
                    user={user}
                    onClose={() => setTopicGenModalState({ isOpen: false })}
                    onGenerationSuccess={() => {
                        if (selectedCampaignId) fetchTopics(selectedCampaignId);
                    }}
                />
            )}
        </section>
    );
};


// --- SUB-COMPONENT: ManagementModal ---
interface ManagementModalProps {
    type: ModalType;
    mode: ModalMode;
    initialData?: Project | Campaign | Topic | null;
    onClose: () => void;
    onSubmit: (data: { name: string, description: string }) => void;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ type, mode, initialData, onClose, onSubmit }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(mode === 'edit' && initialData && 'description' in initialData ? initialData.description : (mode === 'edit' && initialData && 'goal' in initialData ? initialData.goal : ''));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ name, description });
        setLoading(false);
    };

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
                        <button type="submit" disabled={loading || !name} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- SUB-COMPONENT: GenerationModal ---
interface GenerationModalProps {
    topic: Topic;
    user: User;
    onClose: () => void;
    onGenerationSuccess: () => void;
}

const GenerationModal: React.FC<GenerationModalProps> = ({ topic, user, onClose, onGenerationSuccess }) => {
    const { startGeneration } = useGeneration();
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<EditablePlatform>>(new Set(['web', 'facebook', 'tiktok']));
    const [shouldGenerateImage, setShouldGenerateImage] = useState(true);
    const [brandVoiceProfiles, setBrandVoiceProfiles] = useState<BrandVoiceProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('default');
    
    useEffect(() => {
        getBrandVoiceProfiles(user.uid).then(setBrandVoiceProfiles).catch(console.error);
    }, [user.uid]);

    const handlePlatformToggle = (platformId: EditablePlatform) => {
        const newSelection = new Set(selectedPlatforms);
        if (newSelection.has(platformId)) {
            newSelection.delete(platformId);
        } else {
            newSelection.add(platformId);
        }
        setSelectedPlatforms(newSelection);
    };

    const handleGenerate = () => {
        if (!topic.name.trim() || selectedPlatforms.size === 0) return;
        
        const selectedProfile = brandVoiceProfiles.find(p => p.id === selectedProfileId);

        startGeneration({
            id: topic.id, // Use topic ID as unique identifier for the task
            topicName: topic.name,
            status: 'queued',
            progress: 0,
            message: 'Queued...',
            context: {
                type: 'content',
                view: 'dashboard',
                params: {
                    topic,
                    userId: user.uid,
                    language: 'English', // Or from a setting
                    shouldGenerateImage,
                    selectedPlatforms,
                    brandVoiceProfile: selectedProfile
                },
                onSuccess: () => {
                    onGenerationSuccess();
                }
            }
        });
        
        onClose(); // Close modal immediately
    };
    
    return (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-2">Generate Content</h2>
                <p className="text-zinc-400 text-center mb-6">
                    Configure options for the topic: <span className="font-bold text-pink-400">{topic.name}</span>
                </p>
                <div className="space-y-6">
                     <div className="relative w-full">
                        <label htmlFor="brand-voice-select" className="block text-sm font-medium text-zinc-300 mb-1 text-center">Brand Voice Co-Pilot</label>
                          <select
                            id="brand-voice-select"
                            value={selectedProfileId}
                            onChange={(e) => setSelectedProfileId(e.target.value)}
                            className="w-full max-w-sm mx-auto appearance-none px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300"
                            aria-label="Select Brand Voice Profile"
                          >
                            <option value="default">Default (None)</option>
                            {brandVoiceProfiles.map((profile) => (
                              <option key={profile.id} value={profile.id}>{profile.name}</option>
                            ))}
                          </select>
                           <div className="pointer-events-none absolute inset-y-0 right-0 top-7 mx-auto max-w-sm flex items-center px-2 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                    </div>
                    <div>
                        <h3 className="text-center text-sm font-semibold text-zinc-300 mb-3">Choose Your Platforms</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {ALL_PLATFORMS.map(platform => {
                                const isSelected = selectedPlatforms.has(platform.id);
                                return (
                                    <button key={platform.id} onClick={() => handlePlatformToggle(platform.id)} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-pink-500 bg-pink-500/10' : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'}`}>
                                        <platform.icon className={`w-6 h-6 mb-1 transition-colors ${isSelected ? 'text-pink-400' : 'text-zinc-400'}`} />
                                        <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{platform.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <label htmlFor="image-toggle-modal" className="flex items-center select-none group cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" id="image-toggle-modal" className="sr-only" checked={shouldGenerateImage} onChange={(e) => setShouldGenerateImage(e.target.checked)} />
                                <div className={`block w-12 h-6 rounded-full transition-colors ${shouldGenerateImage ? 'bg-pink-600' : 'bg-zinc-700'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${shouldGenerateImage ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-sm transition-colors text-zinc-300 group-hover:text-white">Generate Cover Image</span>
                        </label>
                    </div>
                     <div className="flex justify-center sm:justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                        <button onClick={handleGenerate} disabled={selectedPlatforms.size === 0} className="flex items-center justify-center px-6 py-2.5 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                           <SparkleIcon className="w-5 h-5 mr-2"/>
                            Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: TopicGenerationModal ---
interface TopicGenerationModalProps {
    project: Project;
    campaign: Campaign;
    user: User;
    onClose: () => void;
    onGenerationSuccess: () => void;
}

const TopicGenerationModal: React.FC<TopicGenerationModalProps> = ({ project, campaign, user, onClose, onGenerationSuccess }) => {
    const { startGeneration } = useGeneration();
    const [count, setCount] = useState(5);

    const handleCountChange = (amount: number) => {
        setCount(prev => {
            const newValue = prev + amount;
            if (newValue >= 1 && newValue <= 20) {
                return newValue;
            }
            return prev;
        });
    };

    const handleGenerate = () => {
        startGeneration({
            id: `topics-${campaign.id}-${Date.now()}`,
            topicName: `AI Topics for ${campaign.name}`, // Display name for the queue
            status: 'queued',
            progress: 0,
            message: 'Queued for generation...',
            context: {
                type: 'topics',
                view: 'dashboard',
                params: {
                    project,
                    campaign,
                    count,
                    userId: user.uid,
                },
                onSuccess: () => {
                    onGenerationSuccess();
                }
            }
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-700 shadow-2xl shadow-pink-500/10 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center mb-2">AI Topic Generator</h2>
                <p className="text-zinc-400 text-center mb-6">
                    Generating ideas for campaign: <span className="font-bold text-pink-400">{campaign.name}</span>
                </p>
                <div className="space-y-6">
                    <div className="text-center">
                        <label className="block text-sm font-medium text-zinc-300 mb-3">Number of Topics to Generate</label>
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={() => handleCountChange(-1)} disabled={count <= 1} className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                            </button>
                            <span className="text-5xl font-black w-20 text-center">{count}</span>
                            <button onClick={() => handleCountChange(1)} disabled={count >= 20} className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-center sm:justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                        <button onClick={handleGenerate} className="flex items-center justify-center px-6 py-2.5 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300">
                           <SparkleIcon className="w-5 h-5 mr-2"/>
                            Generate Topics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- SUB-COMPONENT: BrandVoiceDashboard ---
interface BrandVoiceDashboardProps {
    user: User;
}

const BrandVoiceDashboard: React.FC<BrandVoiceDashboardProps> = ({ user }) => {
    const [profiles, setProfiles] = useState<BrandVoiceProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingProfile, setEditingProfile] = useState<Partial<BrandVoiceProfile> | null>(null);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBrandVoiceProfiles(user.uid);
            setProfiles(data);
        } catch (e: any) {
            setError(e.message || "Failed to load profiles.");
        } finally {
            setLoading(false);
        }
    }, [user.uid]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleSave = async (profileData: Partial<BrandVoiceProfile>) => {
        setError(null);
        try {
            if (profileData.id) {
                await updateBrandVoiceProfile(profileData.id, profileData);
            } else {
                 // Destructure to remove the 'id' field which might be undefined
                const { id, ...dataToAdd } = profileData;
                await addBrandVoiceProfile({ userId: user.uid, ...dataToAdd } as Omit<BrandVoiceProfile, 'id' | 'createdAt'>);
            }
            await fetchProfiles();
            setEditingProfile(null);
        } catch (e: any) {
            setError(e.message || "Failed to save profile.");
            throw e; // Re-throw to be caught by the editor component
        }
    };

    const handleDelete = async (profileId: string) => {
        if (!window.confirm("Are you sure you want to delete this brand voice profile?")) return;
        setError(null);
        try {
            await deleteBrandVoiceProfile(profileId);
            await fetchProfiles();
        } catch (e: any) {
            setError(e.message || "Failed to delete profile.");
        }
    };

    if (editingProfile) {
        return <BrandVoiceEditor user={user} initialProfile={editingProfile} onSave={handleSave} onCancel={() => setEditingProfile(null)} />;
    }

    return (
        <div className="animate-fade-in-fast">
             <div className="flex justify-between items-center mb-6">
                <p className="text-zinc-400">Manage your brand voices to ensure consistent content generation.</p>
                <button onClick={() => setEditingProfile({})} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors">
                    <PlusIcon className="w-4 h-4"/> Create New Profile
                </button>
            </div>
             {loading && <div className="space-y-2">{Array.from({length: 3}).map((_, i) => <SkeletonItem key={i} />)}</div>}
             {!loading && profiles.length === 0 && <p className="text-center text-zinc-500 py-12">No brand voice profiles found. Create one to get started!</p>}
             <div className="space-y-3">
                 {profiles.map(profile => (
                     <div key={profile.id} className="bg-zinc-900/50 p-4 rounded-lg flex justify-between items-center">
                         <span className="font-bold text-zinc-200">{profile.name}</span>
                         <div className="flex items-center gap-2">
                             <button onClick={() => setEditingProfile(profile)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md"><EditIcon /></button>
                             <button onClick={() => handleDelete(profile.id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><DeleteIcon /></button>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
};

// --- SUB-COMPONENT: BrandVoiceEditor ---
interface BrandVoiceEditorProps {
    user: User;
    initialProfile: Partial<BrandVoiceProfile>;
    onSave: (profile: Partial<BrandVoiceProfile>) => Promise<void>;
    onCancel: () => void;
}

const BrandVoiceEditor: React.FC<BrandVoiceEditorProps> = ({ user, initialProfile, onSave, onCancel }) => {
    const [name, setName] = useState(initialProfile.name || '');
    const [samples, setSamples] = useState('');
    const [analyzedProfile, setAnalyzedProfile] = useState<Omit<BrandVoiceProfile, 'id'|'userId'|'name'|'createdAt'>>({
        toneAndManner: initialProfile.toneAndManner || '',
        vocabularyLevel: initialProfile.vocabularyLevel || '',
        sentenceStructure: initialProfile.sentenceStructure || '',
        dos: initialProfile.dos || [],
        donts: initialProfile.donts || [],
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!samples.trim()) {
            setError("Please provide text samples to analyze.");
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await analyzeBrandVoice(samples);
            setAnalyzedProfile(result);
        } catch (e: any) {
            setError(e.message || "Failed to analyze voice.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSave = async () => {
        setError(null);
        if (!name.trim()) {
            setError("Profile name is required.");
            return;
        }
        setIsSaving(true);
        try {
            await onSave({ id: initialProfile.id, name, ...analyzedProfile });
            // On success, the parent component will unmount this, so no need to setIsSaving(false).
        } catch (e: any) {
            setError(e.message || "Failed to save profile. Please try again.");
            setIsSaving(false);
        }
    };

    const handleListChange = (key: 'dos' | 'donts', value: string) => {
        setAnalyzedProfile(prev => ({ ...prev, [key]: value.split('\n') }));
    };

    return (
        <div className="bg-zinc-950/70 p-6 rounded-xl border border-zinc-800 animate-fade-in-fast">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-200">{initialProfile.id ? 'Edit' : 'Create'} Brand Voice Profile</h2>
                <button onClick={onCancel} className="text-zinc-400 hover:text-white">&times;</button>
            </div>
            
            {error && <div className="bg-red-900/20 text-red-300 p-3 rounded-md mb-4 border border-red-500/30">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left side: Input */}
                <div className="space-y-4">
                     <div>
                        <label htmlFor="profileName" className="block text-sm font-medium text-zinc-300 mb-1">Profile Name</label>
                        <input id="profileName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., RageGen Marketing Voice" className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" />
                    </div>
                    <div>
                        <label htmlFor="samples" className="block text-sm font-medium text-zinc-300 mb-1">1. Provide Writing Samples</label>
                        <p className="text-xs text-zinc-500 mb-2">Paste 3-5 examples of your best writing below. More text provides a better analysis.</p>
                        <textarea id="samples" value={samples} onChange={e => setSamples(e.target.value)} rows={12} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" placeholder="Paste your content here..." />
                    </div>
                     <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 disabled:opacity-50">
                        {isAnalyzing ? <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...</> : <><SparkleIcon /> 2. Analyze & Create Profile</>}
                    </button>
                </div>
                {/* Right side: Output */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-zinc-300">3. Refine and Save Profile</h3>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Tone & Manner</label>
                        <input type="text" value={analyzedProfile.toneAndManner} onChange={e => setAnalyzedProfile(prev => ({...prev, toneAndManner: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Vocabulary Level</label>
                        <input type="text" value={analyzedProfile.vocabularyLevel} onChange={e => setAnalyzedProfile(prev => ({...prev, vocabularyLevel: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Sentence Structure</label>
                        <input type="text" value={analyzedProfile.sentenceStructure} onChange={e => setAnalyzedProfile(prev => ({...prev, sentenceStructure: e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Do's (one rule per line)</label>
                        <textarea value={analyzedProfile.dos.join('\n')} onChange={e => handleListChange('dos', e.target.value)} rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Don'ts (one rule per line)</label>
                        <textarea value={analyzedProfile.donts.join('\n')} onChange={e => handleListChange('donts', e.target.value)} rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2"/>
                    </div>
                </div>
            </div>
             <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800 mt-6">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold bg-zinc-700 hover:bg-zinc-600 rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={isSaving || !name.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </div>
    );
};