// Fix: Import React to use React.FC type.
import React from 'react';
import type { EditablePlatform } from './types';
import { WebIcon, FacebookIcon, LinkedInIcon, XIcon, TikTokIcon, YouTubeIcon, XIconPlatform } from './components/Icons';

export const LANGUAGES = [
    { code: 'English', name: 'English' },
    { code: 'Spanish', name: 'Español' },
    { code: 'French', name: 'Français' },
    { code: 'German', name: 'Deutsch' },
    { code: 'Japanese', name: '日本語' },
    { code: 'Chinese', name: '中文' },
    { code: 'Vietnamese', name: 'Tiếng Việt' },
];

export const ALL_PLATFORMS: { id: EditablePlatform; name: string; icon: React.FC<{className?: string; title?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIcon },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
    { id: 'youtube', name: 'YouTube', icon: YouTubeIcon },
];

export const ALL_PLATFORMS_WITH_TITLES: { id: EditablePlatform; name: string; icon: React.FC<{className?: string; title?: string}> }[] = [
    { id: 'web', name: 'Web/SEO', icon: WebIcon },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon },
    { id: 'x', name: 'X', icon: XIconPlatform },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon },
    { id: 'youtube', name: 'YouTube', icon: YouTubeIcon },
];
