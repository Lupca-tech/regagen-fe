

import React, { useState, useRef, useCallback, useEffect } from 'react';

// Import services and types
import { onAuthStateChangedListener, type User } from './services/firebaseService';
import type { EditablePlatform, GeneratedContent, BrandVoiceProfile, View } from './types';

// Import components
import { Header } from './components/Header';
import { TopicForm } from './components/TopicForm';
import { ContentTabs } from './components/ContentTabs';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { BrandVoiceDashboard } from './components/BrandVoiceDashboard';
import { AccountDashboard } from './components/AccountDashboard';
import { GenerationProvider, useGeneration } from './contexts/GenerationContext';
import { GenerationQueueWidget } from './components/GenerationQueueWidget';
import { TrendIcon, AiIcon, RocketIcon } from './components/Icons';


// Custom hook to handle scroll animations using Intersection Observer
const useScrollAnimation = () => {
  const animatedElementsRef = useRef<Set<Element>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedElementsRef.current.has(entry.target)) {
            entry.target.classList.add('visible');
            animatedElementsRef.current.add(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);
};

// --- HELPER COMPONENTS ---
const NeonDivider: React.FC = () => (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent my-20"></div>
);

const MainApp: React.FC = () => {
    useScrollAnimation();
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('creator');
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('English');
    const [shouldGenerateImage, setShouldGenerateImage] = useState(true);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<EditablePlatform>>(
        new Set(['web', 'facebook', 'tiktok'])
    );
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    
    const { startGeneration, activeGenerations } = useGeneration();
    const mainGenerationTask = activeGenerations.find(g => g.context.view === 'creator' && g.context.type === 'content');


    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => {
            setCurrentUser(user);
            setView(user ? 'projects' : 'creator');
        });
        return unsubscribe;
    }, []);
    
    const handleNavigate = useCallback((newView: View) => {
        setGeneratedContent(null);
        if (newView === 'creator') {
            setTopic('');
        }
        setView(newView);
    }, []);

    const handleGenerate = useCallback(async (brandVoiceProfile?: BrandVoiceProfile) => {
        if (!topic.trim() || selectedPlatforms.size === 0) return;
        
        setGeneratedContent(null);

        const generationId = `creator-${Date.now()}`;
        startGeneration({
            id: generationId,
            topicName: topic,
            status: 'queued',
            progress: 0,
            message: 'Starting generation...',
            context: {
                type: 'content',
                view: 'creator',
                params: {
                    topic,
                    language,
                    shouldGenerateImage,
                    selectedPlatforms,
                    brandVoiceProfile,
                },
                onSuccess: (result: GeneratedContent) => {
                    setGeneratedContent(result);
                    setTimeout(() => {
                        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
        });
        
    }, [topic, language, shouldGenerateImage, selectedPlatforms, startGeneration]);
    
    const handleContentUpdate = useCallback((platform: EditablePlatform, newContent: any) => {
      setGeneratedContent(prevContent => {
        if (!prevContent) return null;
        return {
          ...prevContent,
          [platform]: newContent,
        };
      });
    }, []);

    const isDashboardView = ['projects', 'brandVoice', 'account'].includes(view);
    const dashboardTitles: Record<string, string> = {
        projects: 'Content Dashboard',
        brandVoice: 'Brand Voice Co-Pilot',
        account: 'My Account'
    };
    const currentDashboardTitle = dashboardTitles[view] || '';

    const renderDashboard = () => {
        if (!currentUser) return null;
        switch (view) {
            case 'projects':
                return <ProjectsDashboard user={currentUser} onNavigate={handleNavigate} />;
            case 'brandVoice':
                return <BrandVoiceDashboard user={currentUser} />;
            case 'account':
                return <AccountDashboard user={currentUser} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-black text-[#EAEAEA] font-sans overflow-x-hidden">
            <Header user={currentUser} onNavigate={handleNavigate} currentView={view} />
            <main className="container mx-auto px-4 pt-24">
                {view === 'creator' && (
                  <>
                    <section className="min-h-screen flex flex-col justify-center items-center text-center -mt-24">
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter scroll-animate">
                            DON'T CHASE TRENDS.
                            <br />
                            <span className="text-pink-500">BECOME ONE.</span>
                        </h1>
                        <p className="max-w-2xl mt-6 text-lg text-zinc-400 scroll-animate" style={{ transitionDelay: '100ms' }}>
                            RageGen scans the internet for trends, and writes viral-ready content for you in any language.
                        </p>
                        <div className="mt-10 w-full max-w-3xl scroll-animate" style={{ transitionDelay: '200ms' }}>
                            <TopicForm 
                               topic={topic}
                               setTopic={setTopic}
                               language={language}
                               setLanguage={setLanguage}
                               shouldGenerateImage={shouldGenerateImage}
                               setShouldGenerateImage={setShouldGenerateImage}
                               selectedPlatforms={selectedPlatforms}
                               setSelectedPlatforms={setSelectedPlatforms}
                               onSubmit={handleGenerate}
                               isLoading={!!mainGenerationTask}
                               user={currentUser}
                            />
                        </div>
                    </section>

                    <div ref={contentRef} className="my-10 min-h-[100px]">
                        {generatedContent && !mainGenerationTask && (
                           <div className="animate-fade-in">
                             <ContentTabs 
                                content={generatedContent} 
                                topic={topic}
                                language={language}
                                onContentUpdate={handleContentUpdate}
                              />
                           </div>
                        )}
                    </div>
                    
                    <NeonDivider />

                    <section className="py-20">
                        <h2 className="text-4xl md:text-5xl font-black text-center uppercase scroll-animate">HOW IT WORKS</h2>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            <div className="scroll-animate">
                                <TrendIcon className="h-12 w-12 mx-auto text-pink-500" />
                                <h3 className="mt-4 text-2xl font-bold uppercase">1. Find The Rage</h3>
                                <p className="mt-2 text-zinc-400">We analyze real-time data from Google, TikTok, and X to pinpoint emerging trends before they hit the mainstream.</p>
                            </div>
                            <div className="scroll-animate" style={{ transitionDelay: '100ms' }}>
                                <AiIcon className="h-12 w-12 mx-auto text-pink-500" />
                                <h3 className="mt-4 text-2xl font-bold uppercase">2. Feed The AI</h3>
                                <p className="mt-2 text-zinc-400">Our AI synthesizes top-performing content and trending keywords to understand the core of the viral potential.</p>
                            </div>
                            <div className="scroll-animate" style={{ transitionDelay: '200ms' }}>
                                <RocketIcon className="h-12 w-12 mx-auto text-pink-500" />
                                <h3 className="mt-4 text-2xl font-bold uppercase">3. Go Viral</h3>
                                <p className="mt-2 text-zinc-400">Receive perfectly adapted content for every platform, ready to post and capture the wave of attention.</p>
                            </div>
                        </div>
                    </section>
                </>
              )}
              {isDashboardView && (
                <section className="animate-fade-in min-h-[70vh]">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8">
                        {currentDashboardTitle.split(' ').slice(0, -1).join(' ')} <span className="text-pink-500">{currentDashboardTitle.split(' ').pop()}</span>
                    </h1>
                    {renderDashboard()}
                </section>
              )}
            </main>
            <footer className="container mx-auto px-4 text-center py-8 text-zinc-500 border-t border-zinc-900 mt-20">
                <p>&copy; {new Date().getFullYear()} RageGen. All rights reserved.</p>
            </footer>
        </div>
    );
};


const App: React.FC = () => (
    <GenerationProvider>
        <MainApp />
        <GenerationQueueWidget />
    </GenerationProvider>
);

export default App;
