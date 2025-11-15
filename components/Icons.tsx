import React from 'react';

// --- HELPER WRAPPER ---
// Using a wrapper to apply common Lucide props and handle className
const LucideIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {children}
    </svg>
);


// --- General UI Icons ---
export const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => <LucideIcon className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></LucideIcon>;
export const PlusIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M5 12h14"/><path d="M12 5v14"/></LucideIcon>;
export const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => <LucideIcon className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></LucideIcon>;
export const DeleteIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => <LucideIcon className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></LucideIcon>;
export const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></LucideIcon>;
export const MoreVerticalIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></LucideIcon>;
export const SparkleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9Z"/></LucideIcon>;
export const BackIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="m15 18-6-6 6-6"/></LucideIcon>;
export const BoardViewIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></LucideIcon>;
export const ListViewIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></LucideIcon>;
export const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></LucideIcon>;
export const CloseIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></LucideIcon>;
export const XIcon: React.FC<{ className?: string }> = ({ className }) => <LucideIcon className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></LucideIcon>;
export const SkeletonItem: React.FC = () => (<div className="bg-zinc-800/50 rounded-lg p-3 animate-pulse"><div className="h-4 bg-zinc-700 rounded w-3/4 mb-2"></div><div className="h-3 bg-zinc-700 rounded w-full"></div></div>);
export const BellIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></LucideIcon>;


// --- Platform Icons ---
export const WebIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<LucideIcon className={className}><title>{title}</title><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></LucideIcon>);
export const FacebookIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<LucideIcon className={className}><title>{title}</title><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></LucideIcon>);
export const TikTokIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => ( <LucideIcon className={className}><title>{title}</title><path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4"/><path d="M4 10h16"/><path d="m10 4 2 2"/><path d="m16 4-2 2"/></LucideIcon>);
export const YouTubeIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<LucideIcon className={className}><title>{title}</title><path d="M2.5 17a24.12 24.12 0 0 1 0-10C2.5 4.24 4.24 2.5 7 2.5h10c2.76 0 4.5 1.74 4.5 4.5a24.12 24.12 0 0 1 0 10c0 2.76-1.74 4.5-4.5 4.5H7c-2.76 0-4.5-1.74-4.5-4.5z"/><path d="m10 15 5-3-5-3z"/></LucideIcon>);
export const LinkedInIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<LucideIcon className={className}><title>{title}</title><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></LucideIcon>);
export const XIconPlatform: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (<LucideIcon className={className}><title>{title}</title><path d="M22 4s-.7 2.1-2 3.4c1.6 1.4 3.3 4.9 3.3 4.9s-5.2-.6-7.1-.2c-1.4 1.1-2.8 2.2-4.2 3.3-1.2 1-2.5 1.1-3.8 1.1s-3.6-1.6-4.9-2.6c-2-1.4-2.8-3.3-3-5.5s.5-4.3 1.3-6.1c1.1-2.5 3.8-4.5 6.4-5.1 2.5-.6 5.1-.5 7.5.4s4.2 2.2 5.2 3.8c1 1.6 1 3.3 1 3.3s-1.3-.4-2.6-.7-2.6-.4-3.9-.2c-1.2.2-2.3.5-3.4 1s-2.1 1-2.8 1.7c-.7.7-1.1 1.4-1.2 2.2s0 1.7.5 2.5c.5.8 1.3 1.5 2.3 1.8s2.3.3 3.4-.1c1.1-.4 2.1-1.1 2.8-2 .7-.9 1.1-2.1 1.1-3.3s-.2-2.5-.5-3.7c-.3-1.2-.7-2.3-1.1-3.4z"/></LucideIcon>);


// --- Header Icons ---
export const SignInIcon: React.FC<{className?: string}> = ({ className }) => (<LucideIcon className={className}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></LucideIcon>);
export const MagicWandIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M12 21a9 9 0 0 0 9-9"/><path d="M3 12a9 9 0 0 0 9 9"/><path d="M17.8 6.2 19 5"/></LucideIcon>;
export const ProjectsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M6 5v11"/><path d="M12 5v6"/><path d="M18 5v14"/></LucideIcon>;
export const CalendarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></LucideIcon>;
export const BrandVoiceIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M12 13.5a2.5 2.5 0 0 0 5 0V12a2.5 2.5 0 1 0-5 0v1.5Z"/><path d="M8 12a4.5 4.5 0 0 0 8.76.65c.1-.16.14-.34.14-.52V8.5a4.5 4.5 0 1 0-9 0v3.83c0 .18.04.36.14.52A4.5 4.5 0 0 0 8 12Z"/><path d="M12 19a6 6 0 0 0 6-6h-4a2 2 0 0 1-4 0H6a6 6 0 0 0 6 6Z"/></LucideIcon>;
export const AccountIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></LucideIcon>;
export const SignOutIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></LucideIcon>;
export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => <LucideIcon className={className}><path d="m6 9 6 6 6-6"/></LucideIcon>;

// --- Auth Modal Icons ---
// Branded icon - do not change to Lucide wrapper
export const GoogleIcon: React.FC = () => (<svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>);
export const UserIcon: React.FC<{className?: string}> = ({className}) => (<LucideIcon className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></LucideIcon>);
export const MailIcon: React.FC<{className?: string}> = ({className}) => (<LucideIcon className={className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></LucideIcon>);
export const LockIcon: React.FC<{className?: string}> = ({className}) => (<LucideIcon className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></LucideIcon>);

// --- Content Creation Icons ---
export const TrendIcon: React.FC<{className?: string}> = ({className}) => <LucideIcon className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></LucideIcon>;
export const AiIcon: React.FC<{className?: string}> = ({className}) => <LucideIcon className={className}><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5v.14a4.33 4.33 0 0 0-1.2.62 4.17 4.17 0 0 0-1.16 1.25 4.1 4.1 0 0 0-.02 4.98 4.5 4.5 0 0 0 5.88 5.88 4.1 4.1 0 0 0 4.98-.02 4.17 4.17 0 0 0 1.25-1.16 4.33 4.33 0 0 0 .62-1.2V6.5A4.5 4.5 0 0 0 12 2Z"/><path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path d="M19.5 13.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path d="M4.5 13.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path d="M16 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path d="M8 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path d="m15.5 19.5 1-1"/><path d="m8.5 19.5-1-1"/><path d="M12 22v-2"/><path d="M15.24 16.5 14 14.5"/><path d="M8.76 16.5 10 14.5"/></LucideIcon>;
export const RocketIcon: React.FC<{className?: string}> = ({className}) => <LucideIcon className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.7-3 .27-1.24.2-4.3-.2-6.5l2.5-2.5c2.7 1.2 5.17 2.33 7.5 3.5-1.17 2.33-2.3 4.8-3.5 7.5l-2.5-2.5c-2.2.4-5.26.47-6.5.2-.7-.07-2.16-.21-3-.7z"/><path d="m15 5 3.3-3.3a1 1 0 0 1 1.4 1.4L16 6"/><path d="m18 8 2 2"/><path d="m13 13 2 2"/><path d="m13 18 2 2"/><path d="M2 21h6"/><path d="M3 3v6"/></LucideIcon>;

// --- Content Tabs Icons ---
export const ArticleIcon: React.FC<{ className?: string }> = ({ className }) => <LucideIcon className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></LucideIcon>;
export const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => <LucideIcon className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></LucideIcon>;
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => <LucideIcon className={className}><path d="M20 6 9 17l-5-5"/></LucideIcon>;
export const CodeBracketIcon: React.FC<{ className?: string }> = ({ className }) => <LucideIcon className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></LucideIcon>;
export const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => <LucideIcon className={className}><path d="M3 3v18h18"/><path d="M7 16V8"/><path d="M12 16V4"/><path d="M17 16v-4"/></LucideIcon>;

// --- Generation Status Icons ---
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></LucideIcon>;
export const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></LucideIcon>;
export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (<LucideIcon className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></LucideIcon>);

// --- Account Dashboard Icons ---
export const UserCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12"cy="12" r="10"/></LucideIcon>;
export const ActivityIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></LucideIcon>;
export const SettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <LucideIcon className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></LucideIcon>;