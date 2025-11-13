
import React, { useState, useRef, useCallback, useEffect } from 'react';

// Import services and types
import { onAuthStateChangedListener, type User } from './services/firebaseService';
import type { EditablePlatform, GeneratedContent, BrandVoiceProfile } from './types';

// Import components
import { Header } from './components/Header';
import { TopicForm } from './components/TopicForm';
import { LoadingDisplay } from './components/LoadingDisplay';
import { ContentTabs } from './components/ContentTabs';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { GenerationProvider, useGeneration } from './contexts/GenerationContext';
import { GenerationQueueWidget } from './components/GenerationQueueWidget';


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

// --- SVG ICON COMPONENTS ---
const TrendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
const AiIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.5 1.591L5.25 15.25M9.75 3.104a2.25 2.25 0 00-3.364-.623l-2.25 2.25a2.25 2.25 0 00-.623 3.364v5.714a2.25 2.25 0 001.591.5l9.75-9.75M9.75 3.104a2.25 2.25 0 013.364-.623l2.25 2.25a2.25 2.25 0 01.623 3.364v5.714a2.25 2.25 0 01-1.591.5l-9.75-9.75" />
    </svg>
);
const RocketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.45v5.7m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448c.019-.104.039-.207.06-.311m-4.8 5.84c.041.104.082.207.124.311a15.09 15.09 0 01-2.448-2.448c.104-.042.207-.082.311-.124m2.448 2.448a6 6 0 01-3.408 1.472h9.456a6 6 0 01-3.408-1.472z" />
    </svg>
);

// --- HELPER COMPONENTS ---
const NeonDivider: React.FC = () => (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent my-20"></div>
);

type View = 'creator' | 'dashboard';

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
    
    const { startGeneration, activeGenerations, cancelGeneration } = useGeneration();
    const isLoading = activeGenerations.length > 0; // Simplified loading state
    const mainGenerationTask = activeGenerations.find(g => g.context.view === 'creator');


    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => {
            setCurrentUser(user);
            if (user) {
                // If user is logged in, default to dashboard view
                setView('dashboard');
            } else {
                // If user logs out, or is not logged in, show creator view
                setView('creator');
            }
        });
        return unsubscribe;
    }, []);
    
    const handleNavigate = (newView: View) => {
        // Reset state when navigating between main views
        setGeneratedContent(null);
        setTopic('');
        setView(newView);
    }

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
                // Fix: Add missing 'type' property. This is a content generation task.
                type: 'content',
                view: 'creator', // To distinguish from dashboard generations
                params: {
                    topic,
                    language,
                    shouldGenerateImage,
                    selectedPlatforms,
                    brandVoiceProfile,
                },
                onSuccess: (result) => {
                    setGeneratedContent(result);
                    setTimeout(() => {
                        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
        });
        
    }, [topic, language, shouldGenerateImage, selectedPlatforms, startGeneration]);

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
                        {mainGenerationTask && (
                            <LoadingDisplay 
                                message={mainGenerationTask.message} 
                                progress={mainGenerationTask.progress} 
                                onCancel={() => cancelGeneration(mainGenerationTask.id)} 
                            />
                        )}
                        {mainGenerationTask?.status === 'error' && (
                            <div className="mt-8 flex flex-col items-center justify-center p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-red-300">
                               <h3 className="text-lg font-bold">Error</h3>
                               <p className="mt-2 text-center">{mainGenerationTask.message}</p>
                            </div>
                        )}
                        {generatedContent && !mainGenerationTask && (
                           <div className="animate-fade-in">
                             <ContentTabs 
                                content={generatedContent} 
                                topic={topic}
                                language={language}
                                onContentUpdate={() => {}}
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
              {view === 'dashboard' && currentUser && (
                <ProjectsDashboard user={currentUser} />
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
