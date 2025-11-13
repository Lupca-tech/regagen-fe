
import React, { useState, useEffect } from 'react';
import { EditablePlatform, BrandVoiceProfile } from '../types';
import { getBrandVoiceProfiles, User } from '../services/firebaseService';

// Icons
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

interface TopicFormProps {
  topic: string;
  setTopic: (topic: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  shouldGenerateImage: boolean;
  setShouldGenerateImage: (value: boolean) => void;
  selectedPlatforms: Set<EditablePlatform>;
  setSelectedPlatforms: (platforms: Set<EditablePlatform>) => void;
  onSubmit: (brandVoiceProfile?: BrandVoiceProfile) => void;
  isLoading: boolean;
  isContextual?: boolean;
  user?: User | null;
}

const LANGUAGES = [
    { code: 'English', name: 'English' },
    { code: 'Spanish', name: 'Español' },
    { code: 'French', name: 'Français' },
    { code: 'German', name: 'Deutsch' },
    { code: 'Japanese', name: '日本語' },
    { code: 'Chinese', name: '中文' },
    { code: 'Vietnamese', name: 'Tiếng Việt' },
];

const ALL_PLATFORMS: { id: EditablePlatform; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIcon },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
    { id: 'youtube', name: 'YouTube', icon: YouTubeIcon },
];

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.75.75V6h.75a.75.75 0 010 1.5H9.75v.75a.75.75 0 01-1.5 0V7.5H7.5a.75.75 0 010-1.5H8.25V5.25A.75.75 0 019 4.5zM12.75 7.5a.75.75 0 01.75-.75H15v-.75a.75.75 0 011.5 0V6.75H17.25a.75.75 0 010 1.5H16.5v.75a.75.75 0 01-1.5 0V8.25H13.5a.75.75 0 01-.75-.75zM15 12a.75.75 0 01.75.75V15h.75a.75.75 0 010 1.5H15.75v.75a.75.75 0 01-1.5 0V16.5H13.5a.75.75 0 010-1.5H14.25v-.75A.75.75 0 0115 12zM12 1.5a.75.75 0 01.75.75V3h.75a.75.75 0 010 1.5H12.75v.75a.75.75 0 01-1.5 0V4.5H10.5a.75.75 0 010-1.5H11.25V2.25A.75.75 0 0112 1.5zM10.5 18.75a.75.75 0 01.75.75V21h.75a.75.75 0 010 1.5H11.25v.75a.75.75 0 01-1.5 0V22.5H9a.75.75 0 010-1.5h.75v-.75a.75.75 0 01.75-.75zM18.75 10.5a.75.75 0 01.75.75V12h.75a.75.75 0 010 1.5H19.5v.75a.75.75 0 01-1.5 0V13.5H17.25a.75.75 0 010-1.5H18v-.75a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);


export const TopicForm: React.FC<TopicFormProps> = ({ 
    topic, setTopic, language, setLanguage, shouldGenerateImage, setShouldGenerateImage, 
    selectedPlatforms, setSelectedPlatforms, onSubmit, isLoading, isContextual = false, user
}) => {
  const [brandVoiceProfiles, setBrandVoiceProfiles] = useState<BrandVoiceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('default');
    
  useEffect(() => {
    if (user) {
      getBrandVoiceProfiles(user.uid).then(setBrandVoiceProfiles).catch(console.error);
    }
  }, [user]);

  const handleSubmit = () => {
    const selectedProfile = brandVoiceProfiles.find(p => p.id === selectedProfileId);
    onSubmit(selectedProfile);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePlatformToggle = (platformId: EditablePlatform) => {
    if (isLoading) return;
    const newSelection = new Set(selectedPlatforms);
    if (newSelection.has(platformId)) {
        newSelection.delete(platformId);
    } else {
        newSelection.add(platformId);
    }
    setSelectedPlatforms(newSelection);
  };

  return (
    <div className="relative">
      <div className={`bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-lg space-y-4`}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., 'The future of electric vehicles'"
            disabled={isLoading || isContextual}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative w-full">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isLoading}
                className="w-full appearance-none px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Select language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
             <div className="relative w-full">
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                disabled={isLoading || !user}
                className="w-full appearance-none px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Select Brand Voice Profile"
              >
                <option value="default">Default Brand Voice</option>
                {brandVoiceProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
        </div>

        <div>
          <h3 className="text-center text-sm font-semibold text-zinc-300 mb-3">Choose Your Platforms</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {ALL_PLATFORMS.map(platform => {
                  const isSelected = selectedPlatforms.has(platform.id);
                  return (
                      <button
                          key={platform.id}
                          onClick={() => handlePlatformToggle(platform.id)}
                          disabled={isLoading}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                              isSelected ? 'border-pink-500 bg-pink-500/10' : 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                          } ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                          <platform.icon className={`w-6 h-6 mb-1 transition-colors ${isSelected ? 'text-pink-400' : 'text-zinc-400'}`} />
                          <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{platform.name}</span>
                      </button>
                  )
              })}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <label htmlFor="image-toggle" className={`flex items-center select-none group ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="relative">
                  <input 
                      type="checkbox" 
                      id="image-toggle" 
                      className="sr-only" 
                      checked={shouldGenerateImage}
                      onChange={(e) => setShouldGenerateImage(e.target.checked)}
                      disabled={isLoading}
                  />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${shouldGenerateImage ? 'bg-pink-600' : 'bg-zinc-700'} ${isLoading ? 'bg-zinc-600' : ''}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${shouldGenerateImage ? 'translate-x-6' : ''}`}></div>
              </div>
              <span className={`ml-3 text-sm transition-colors ${isLoading ? 'text-zinc-500' : 'text-zinc-300 group-hover:text-white'}`}>Generate Cover Image</span>
          </label>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading || !topic.trim() || selectedPlatforms.size === 0}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 shadow-md flex-shrink-0"
          >
            <SparkleIcon className="w-5 h-5 mr-2"/>
            {isLoading ? 'Generating...' : isContextual ? 'Generate for Topic' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};