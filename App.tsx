import React, { useState, useRef, useCallback, useEffect } from 'react';

// Import services and types
import { onAuthStateChangedListener, type User } from './services/firebaseService';
import type { EditablePlatform, GeneratedContent, BrandVoiceProfile, View } from './types';

// Import components
import { Header } from './components/Header';
import { ContentTabs } from './components/ContentTabs';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { BrandVoiceDashboard } from './components/BrandVoiceDashboard';
import { AccountDashboard } from './components/AccountDashboard';
import { GenerationProvider, useGeneration } from './contexts/GenerationContext';
import { GenerationQueueWidget } from './components/GenerationQueueWidget';
import { TrendIcon, AiIcon, RocketIcon } from './components/Icons';
import { AuthModal } from './components/AuthModal';
import { MagicCreatorDashboard } from './components/MagicCreatorDashboard';
import { CalendarDashboard } from './components/CalendarDashboard';


// Custom hook to handle scroll animations using Intersection Observer
const useScrollAnimation = (view: View) => {
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
  }, [view]); // Re-run the animation setup whenever the view changes
};

// --- HELPER COMPONENTS ---
const NeonDivider: React.FC = () => (
    <div className="w-full h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent my-20"></div>
);

const MainApp: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('magicCreator');
    const [topic, setTopic] = useState(''); // This might be deprecated or used differently
    const [prefillTopic, setPrefillTopic] = useState<string | undefined>(undefined);
    const [sourceCalendarEventId, setSourceCalendarEventId] = useState<string | undefined>();
    
    useScrollAnimation(view); // Pass the current view to the hook

    // Legacy states from old creator, might be removed or repurposed
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    
    const { activeGenerations } = useGeneration();
    const mainGenerationTask = activeGenerations.find(g => g.context.view === 'magicCreator' && g.context.type === 'content');

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);


    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => {
            setCurrentUser(user);
            setView(user ? 'projects' : 'magicCreator');
        });
        return unsubscribe;
    }, []);
    
    const handleNavigate = useCallback((newView: View, context?: any) => {
        setGeneratedContent(null);
        if (newView === 'magicCreator') {
            setTopic('');
            if (context?.prefillTopic) {
                setPrefillTopic(context.prefillTopic);
            }
            if (context?.sourceCalendarEventId) {
                setSourceCalendarEventId(context.sourceCalendarEventId);
            }
        } else {
            setPrefillTopic(undefined); // Clear prefill when navigating away from magic creator
            setSourceCalendarEventId(undefined); // Clear calendar event source
        }
        
        setView(newView);
        setIsAuthModalOpen(false); // Close auth modal on navigation
    }, []);
    
    const handleContentUpdate = useCallback((platform: EditablePlatform, newContent: any) => {
      setGeneratedContent(prevContent => {
        if (!prevContent) return null;
        return {
          ...prevContent,
          [platform]: newContent,
        };
      });
    }, []);

    const isDashboardView = ['projects', 'brandVoice', 'account', 'calendar'].includes(view);
    const dashboardTitles: Record<string, string> = {
        projects: 'Content Dashboard',
        brandVoice: 'Brand Voice Co-Pilot',
        account: 'My Account',
        calendar: 'Smart Content Calendar'
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
            case 'calendar':
                return <CalendarDashboard user={currentUser} onNavigate={handleNavigate} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-black text-[#EAEAEA] font-sans overflow-x-hidden">
            <Header
                user={currentUser}
                onNavigate={handleNavigate}
                currentView={view}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
            <main className="container mx-auto px-4 pt-24">
                {view === 'magicCreator' && (
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
                        <div className="mt-10 w-full max-w-4xl scroll-animate" style={{ transitionDelay: '200ms' }}>
                           <MagicCreatorDashboard 
                                user={currentUser}
                                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                                onGenerationComplete={(context) => handleNavigate('projects', context)}
                                prefillTopic={prefillTopic}
                                sourceCalendarEventId={sourceCalendarEventId}
                           />
                        </div>
                    </section>

                    {/* This section might be removed as Magic Creator redirects on completion */}
                    <div ref={contentRef} className="my-10 min-h-[100px]">
                        {generatedContent && !mainGenerationTask && (
                           <div className="animate-fade-in">
                             <ContentTabs 
                                content={generatedContent} 
                                topic={topic}
                                language={"English"} // Needs to be dynamic
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
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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