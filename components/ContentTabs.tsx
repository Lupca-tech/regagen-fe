
import React, { useState, useCallback, useEffect } from 'react';
import { regeneratePlatformContent } from '../services/geminiService';
import type { GeneratedContent, EditablePlatform } from '../types';
import { ArticleIcon, WebIcon, FacebookIcon, LinkedInIcon, XIcon, TikTokIcon, YouTubeIcon, ClipboardIcon, CheckIcon, CodeBracketIcon, SparkleIcon } from './Icons';

type Tab = 'main' | EditablePlatform;

interface ContentTabsProps {
  content: GeneratedContent;
  topic: string;
  language: string;
  onContentUpdate: (platform: EditablePlatform, newContent: any) => void;
  isReadOnly?: boolean;
}

const CopyButton: React.FC<{ textToCopy: string }> = React.memo(({ textToCopy }) => {
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
});

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = React.memo(({ label, isActive, onClick, icon }) => (
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
));

const ContentEditor: React.FC<{
    platform: EditablePlatform;
    topic: string;
    language: string;
    currentContent: any;
    onContentUpdate: (platform: EditablePlatform, newContent: any) => void;
}> = React.memo(({ platform, topic, language, currentContent, onContentUpdate }) => {
    const [prompt, setPrompt] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegenerate = useCallback(async () => {
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
    }, [prompt, isRegenerating, platform, topic, currentContent, language, onContentUpdate]);
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleRegenerate();
        }
    }, [handleRegenerate]);

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
});


const ContentCard: React.FC<{ 
    title?: string; 
    children: React.ReactNode; 
    copyText?: string;
    editor?: React.ReactNode;
    isReadOnly?: boolean;
}> = React.memo(({ title, children, copyText, editor, isReadOnly }) => (
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
));

export const ContentTabs: React.FC<ContentTabsProps> = ({ content, topic, language, onContentUpdate, isReadOnly = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [webContentView, setWebContentView] = useState<'text' | 'html'>('text');

  useEffect(() => {
    if (activeTab !== 'main' && !content[activeTab]) {
        setActiveTab('main');
    }
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
