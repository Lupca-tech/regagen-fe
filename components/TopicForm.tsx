import React, { useState, useEffect, useCallback } from 'react';
import { EditablePlatform, BrandVoiceProfile } from '../types';
import { getBrandVoiceProfiles, User } from '../services/firebaseService';
import { WebIcon, FacebookIcon, LinkedInIcon, XIcon, TikTokIcon, YouTubeIcon, SparkleIcon } from './Icons';

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

export const TopicForm: React.FC<TopicFormProps> = React.memo(({ 
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

  const handleSubmit = useCallback(() => {
    const selectedProfile = brandVoiceProfiles.find(p => p.id === selectedProfileId);
    onSubmit(selectedProfile);
  }, [brandVoiceProfiles, selectedProfileId, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const handlePlatformToggle = useCallback((platformId: EditablePlatform) => {
    if (isLoading) return;
    const newSelection = new Set(selectedPlatforms);
    if (newSelection.has(platformId)) {
        newSelection.delete(platformId);
    } else {
        newSelection.add(platformId);
    }
    setSelectedPlatforms(newSelection);
  }, [isLoading, selectedPlatforms, setSelectedPlatforms]);

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
              <span className={`ml-3 text-sm transition-colors ${isLoading ? 'text-zinc-500' : 'text-zinc-300 group-hover:text-white'}`}>Generate Visual Assets</span>
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
});