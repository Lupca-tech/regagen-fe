import React, { useState, useCallback, useEffect } from 'react';
import { regeneratePlatformContent } from '../services/geminiService';
import type { GeneratedContent, EditablePlatform } from '../types';

type Tab = 'main' | EditablePlatform;

interface ContentTabsProps {
  content: GeneratedContent;
  topic: string;
  language: string;
  onContentUpdate: (platform: EditablePlatform, newContent: any) => void;
  isReadOnly?: boolean;
}

// Icon Components
const ArticleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);
const WebIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 003 12c0 .778.099 1.533.284 2.253m0 0" />
    </svg>
);
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.03998C6.49999 2.03998 2.03999 6.49998 2.03999 12C2.03999 16.89 5.52999 20.93 10.12 21.8v-8.01H7.07999v-3.72h3.04V8.41998C10.12 5.41998 11.92 3.87998 14.67 3.87998C15.53 3.87998 16.32 3.93998 17.07 4.03998V7.24998H15.21C13.8 7.24998 13.56 8.01998 13.56 8.78998V10.07H17.01L16.36 13.79H13.56V21.8C18.47 20.93 21.96 16.89 21.96 12C21.96 6.49998 17.5 2.03998 12 2.03998Z" />
    </svg>
);
const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.98-1.55-1.97-2.05-4.38-1.51-6.77.52-2.31 2.3-4.14 4.54-5.06 2.72-1.11 5.69-.64 8.04 1.18.12 2.44-.81 4.84-2.55 6.37-1.42 1.25-3.34 1.66-5.18 1.1-1.26-.38-2.35-1.24-2.9-2.42a2.53 2.53 0 0 1 .53-2.77c.8-1.1 2.19-1.65 3.43-1.45.96.15 1.83.69 2.49 1.41.68.74 1.04 1.72 1.04 2.71-.02 1.09-.45 2.09-1.23 2.82-.49.46-1.1.8-1.72.91-.53.09-1.08.08-1.62-.05-1.1-.25-2.09-.89-2.77-1.8-.19-.26-.35-.55-.49-.86-.28-.6-.44-1.28-.5-1.97-.05-.53.03-1.07.18-1.58.46-1.58 1.64-2.8 3.11-3.26.83-.26 1.7-.32 2.55-.2.85.12 1.68.49 2.4 1.05.02.01.03.02.04.04v-4.67c-.33-.16-.67-.3-.99-.47-1.12-.57-2.34-.85-3.55-.95-1.21-.1-2.42.06-3.63.06z" />
    </svg>
);
const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM9.75 15.375V8.625l4.5 3.375-4.5 3.375z" clipRule="evenodd" />
    </svg>
);
const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);
const CodeBracketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 15" />
    </svg>
);
const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.75.75V6h.75a.75.75 0 010 1.5H9.75v.75a.75.75 0 01-1.5 0V7.5H7.5a.75.75 0 010-1.5H8.25V5.25A.75.75 0 019 4.5zM12.75 7.5a.75.75 0 01.75-.75H15v-.75a.75.75 0 011.5 0V6.75H17.25a.75.75 0 010 1.5H16.5v.75a.75.75 0 01-1.5 0V8.25H13.5a.75.75 0 01-.75-.75zM15 12a.75.75 0 01.75.75V15h.75a.75.75 0 010 1.5H15.75v.75a.75.75 0 01-1.5 0V16.5H13.5a.75.75 0 010-1.5H14.25v-.75A.75.75 0 0115 12zM12 1.5a.75.75 0 01.75.75V3h.75a.75.75 0 010 1.5H12.75v.75a.75.75 0 01-1.5 0V4.5H10.5a.75.75 0 010-1.5H11.25V2.25A.75.75 0 0112 1.5zM10.5 18.75a.75.75 0 01.75.75V21h.75a.75.75 0 010 1.5H11.25v.75a.75.75 0 01-1.5 0V22.5H9a.75.75 0 010-1.5h.75v-.75a.75.75 0 01.75-.75zM18.75 10.5a.75.75 0 01.75.75V12h.75a.75.75 0 010 1.5H19.5v.75a.75.75 0 01-1.5 0V13.5H17.25a.75.75 0 010-1.5H18v-.75a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);


const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }, [textToCopy]);

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                isCopied
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
            aria-live="polite"
        >
            {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
            {isCopied ? 'Copied!' : 'Copy'}
        </button>
    );
};

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 whitespace-nowrap ${
      isActive
        ? 'bg-pink-600 text-white shadow-md'
        : 'text-gray-300 hover:bg-gray-700'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ContentEditor: React.FC<{
    platform: EditablePlatform;
    topic: string;
    language: string;
    currentContent: any;
    onContentUpdate: (platform: EditablePlatform, newContent: any) => void;
}> = ({ platform, topic, language, currentContent, onContentUpdate }) => {
    const [prompt, setPrompt] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegenerate = async () => {
        if (!prompt.trim() || isRegenerating) return;
        setIsRegenerating(true);
        setError(null);
        try {
            const newContent = await regeneratePlatformContent(platform, topic, currentContent, prompt, language);
            onContentUpdate(platform, newContent);
            setPrompt('');
        } catch (e: any) {
            setError(e.message || "Failed to regenerate content. Please try again.");
        } finally {
            setIsRegenerating(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleRegenerate();
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h4 className="text-lg font-bold text-pink-400 mb-3">Refine Content</h4>
            <div className="space-y-3">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`e.g., "Make this more professional" or "Add a call to action to sign up for our newsletter"`}
                    disabled={isRegenerating}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    rows={2}
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                        onClick={handleRegenerate}
                        disabled={isRegenerating || !prompt.trim()}
                        className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 font-semibold text-white bg-gradient-to-r from-purple-500/80 to-pink-600/80 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                    >
                        <SparkleIcon className="w-5 h-5 mr-2"/>
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                    {error && <p className="text-red-400 text-sm text-center sm:text-left">{error}</p>}
                </div>
            </div>
        </div>
    );
};


const ContentCard: React.FC<{ 
    title?: string; 
    children: React.ReactNode; 
    copyText?: string;
    editor?: React.ReactNode;
    isReadOnly?: boolean;
}> = ({ title, children, copyText, editor, isReadOnly }) => (
    <div className="bg-gray-800 p-6 rounded-b-xl border-t-0 border border-gray-700">
        <div className="flex justify-between items-start mb-4">
            {title && (
                <h3 className="text-xl font-bold text-purple-300">{title}</h3>
            )}
            {copyText && <CopyButton textToCopy={copyText} />}
        </div>
        <div className="prose prose-invert max-w-none text-gray-300 prose-headings:text-gray-100 prose-strong:text-white">
            {children}
        </div>
        {!isReadOnly && editor}
    </div>
);

export const ContentTabs: React.FC<ContentTabsProps> = ({ content, topic, language, onContentUpdate, isReadOnly = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [webContentView, setWebContentView] = useState<'text' | 'html'>('text');

  useEffect(() => {
    // If the active tab is for a platform that no longer exists in the content, reset to 'main'
    if (activeTab !== 'main' && !content[activeTab]) {
        setActiveTab('main');
    }
    // Reset web content view when switching away from the web tab
    if (activeTab !== 'web') {
      setWebContentView('text');
    }
  }, [activeTab, content]);

  const renderContent = () => {
    const editorFor = (platform: EditablePlatform) => (
      <ContentEditor
        platform={platform}
        topic={topic}
        language={language}
        currentContent={content[platform]}
        onContentUpdate={onContentUpdate}
      />
    );

    switch (activeTab) {
      case 'main':
        return (
            <ContentCard 
                title={content.mainArticle.title}
                copyText={`Title: ${content.mainArticle.title}\n\n${content.mainArticle.body}`}
                isReadOnly={isReadOnly}
            >
                 {content.image.url ? (
                    <>
                        <img src={content.image.url} alt={content.image.prompt} className="w-full h-auto rounded-lg mb-6 shadow-lg object-cover aspect-video" />
                        <p className="text-xs italic text-gray-500 mb-4">AI-generated image prompt: "{content.image.prompt}"</p>
                    </>
                ) : (
                     <div className="w-full h-auto rounded-lg mb-6 bg-zinc-900 border-2 border-dashed border-zinc-700 aspect-video flex items-center justify-center">
                        <p className="text-zinc-500">{content.image.prompt}</p>
                     </div>
                )}
                 <div dangerouslySetInnerHTML={{ __html: content.mainArticle.body.replace(/\n/g, '<br />') }} />
            </ContentCard>
        );
      case 'web': {
        if (!content.web) return null;
        const copyText = webContentView === 'text'
          ? `Meta Title: ${content.web.metaTitle}\n\nMeta Description: ${content.web.metaDescription}\n\n${content.web.body}`
          : content.web.htmlBody;
        
        return (
            <ContentCard 
                title="Web Content (SEO Optimized)"
                copyText={copyText}
                editor={editorFor('web')}
                isReadOnly={isReadOnly}
            >
                <h4 className="font-bold text-gray-400">Meta Title:</h4>
                <p className="p-2 bg-gray-900 rounded font-mono text-sm mb-4">{content.web.metaTitle}</p>
                <h4 className="font-bold text-gray-400">Meta Description:</h4>
                <p className="p-2 bg-gray-900 rounded font-mono text-sm mb-6">{content.web.metaDescription}</p>
                <hr className="border-gray-600 my-6" />

                <div className="flex items-center gap-2 mb-4">
                    <button 
                        onClick={() => setWebContentView('text')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${webContentView === 'text' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                       Formatted Text
                    </button>
                    <button 
                        onClick={() => setWebContentView('html')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${webContentView === 'html' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                    >
                       <CodeBracketIcon className="w-5 h-5"/> HTML Code
                    </button>
                </div>
                
                {webContentView === 'text' ? (
                    <div className="animate-fade-in">
                        <h4 className="font-bold text-gray-400 mb-2">Body:</h4>
                        <div dangerouslySetInnerHTML={{ __html: content.web.body.replace(/\n/g, '<br />') }} />
                    </div>
                ) : (
                    <div className="animate-fade-in">
                         <h4 className="font-bold text-gray-400 mb-2">HTML Body:</h4>
                        <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-900 p-4 rounded-lg overflow-x-auto">
                            <code>{content.web.htmlBody}</code>
                        </pre>
                    </div>
                )}
            </ContentCard>
        );
      }
      case 'facebook':
        if (!content.facebook) return null;
        return (
            <ContentCard title="Facebook Post" copyText={content.facebook.postText} editor={editorFor('facebook')} isReadOnly={isReadOnly}>
                <pre className="whitespace-pre-wrap font-sans bg-gray-900 p-4 rounded-lg">{content.facebook.postText}</pre>
            </ContentCard>
        );
      case 'linkedin':
        if (!content.linkedin) return null;
        return (
            <ContentCard title="LinkedIn Post" copyText={content.linkedin.postText} editor={editorFor('linkedin')} isReadOnly={isReadOnly}>
                <pre className="whitespace-pre-wrap font-sans bg-gray-900 p-4 rounded-lg">{content.linkedin.postText}</pre>
            </ContentCard>
        );
      case 'x':
        if (!content.x) return null;
        return (
            <ContentCard title="X (Twitter) Post" copyText={content.x.postText} editor={editorFor('x')} isReadOnly={isReadOnly}>
                <pre className="whitespace-pre-wrap font-sans bg-gray-900 p-4 rounded-lg">{content.x.postText}</pre>
            </ContentCard>
        );
      case 'tiktok':
        if (!content.tiktok) return null;
        return (
            <ContentCard title="TikTok / Shorts Script" copyText={content.tiktok.script} editor={editorFor('tiktok')} isReadOnly={isReadOnly}>
                <pre className="whitespace-pre-wrap font-sans bg-gray-900 p-4 rounded-lg">{content.tiktok.script}</pre>
            </ContentCard>
        );
      case 'youtube':
        if (!content.youtube) return null;
        return (
            <ContentCard 
                title="YouTube Content"
                copyText={`Title: ${content.youtube.title}\n\nDescription:\n${content.youtube.description}`}
                editor={editorFor('youtube')}
                isReadOnly={isReadOnly}
            >
                 <h4 className="font-bold text-gray-400">Video Title:</h4>
                <p className="p-2 bg-gray-900 rounded font-mono text-sm mb-6">{content.youtube.title}</p>
                <h4 className="font-bold text-gray-400">Video Description:</h4>
                <pre className="whitespace-pre-wrap font-sans bg-gray-900 p-4 rounded-lg">{content.youtube.description}</pre>
            </ContentCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-t-xl border-b border-gray-700 overflow-x-auto">
        <div className="flex space-x-2">
            <TabButton label="Article" icon={<ArticleIcon className="w-5 h-5"/>} isActive={activeTab === 'main'} onClick={() => setActiveTab('main')} />
            {content.web && <TabButton label="Web/SEO" icon={<WebIcon className="w-5 h-5"/>} isActive={activeTab === 'web'} onClick={() => setActiveTab('web')} />}
            {content.facebook && <TabButton label="Facebook" icon={<FacebookIcon className="w-5 h-5"/>} isActive={activeTab === 'facebook'} onClick={() => setActiveTab('facebook')} />}
            {content.linkedin && <TabButton label="LinkedIn" icon={<LinkedInIcon className="w-5 h-5"/>} isActive={activeTab === 'linkedin'} onClick={() => setActiveTab('linkedin')} />}
            {content.x && <TabButton label="X" icon={<XIcon className="w-5 h-5"/>} isActive={activeTab === 'x'} onClick={() => setActiveTab('x')} />}
            {content.tiktok && <TabButton label="TikTok" icon={<TikTokIcon className="w-5 h-5"/>} isActive={activeTab === 'tiktok'} onClick={() => setActiveTab('tiktok')} />}
            {content.youtube && <TabButton label="YouTube" icon={<YouTubeIcon className="w-5 h-5"/>} isActive={activeTab === 'youtube'} onClick={() => setActiveTab('youtube')} />}
        </div>
      </div>
      <div key={activeTab + JSON.stringify(content)} className="animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
};