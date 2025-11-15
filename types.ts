export type View = 'magicCreator' | 'projects' | 'brandVoice' | 'account' | 'calendar' | 'aiVisibility';

export type EditablePlatform = 'web' | 'facebook' | 'linkedin' | 'x' | 'tiktok' | 'youtube';

export interface SEOAnalysis {
  score: number; // 0-100
  headlineStrength: {
    score: number; // 0-100
    feedback: string;
    suggestions: string[];
  };
  keywordAnalysis: {
    density: number; // percentage
    feedback: string;
  };
  readability: {
    score: number; // A score from 0-100, where higher is better.
    feedback: string;
  };
}

export interface TikTokAnalysis {
  hookScore: number; // 0-100
  hookFeedback: string;
  predictedRetention: number; // percentage
  retentionFeedback: string;
}

export interface FacebookAnalysis {
  engagementScore: number; // 0-100
  ctaPresence: {
    detected: boolean;
    feedback: string;
  };
  sentiment: {
    score: number; // -1 to 1 (negative to positive)
    label: string; // e.g., 'Positive', 'Neutral'
  };
  lengthAnalysis: {
    isOptimal: boolean;
    feedback: string;
  };
}

export interface PerformanceAnalysis {
  web?: SEOAnalysis;
  tiktok?: TikTokAnalysis;
  facebook?: FacebookAnalysis;
}


export interface GeneratedContent {
  mainArticle: {
    title: string;
    body: string;
  };
  images: {
    url: string;
    prompt: string;
  }[];
  web?: {
    metaTitle: string;
    metaDescription: string;
    body: string;
    htmlBody: string;
    focusKeyword: string; // Added focusKeyword
  };
  facebook?: {
    postText: string;
  };
  linkedin?: {
    postText: string;
  };
  x?: {
    postText: string;
  };
  tiktok?: {
    script: string;
  };
  youtube?: {
    title: string;
    description: string;
  };
  analysis?: PerformanceAnalysis;
}

export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: FirestoreTimestamp;
}

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  projectId: string;
  userId: string;
  createdAt: FirestoreTimestamp;
}

export interface Topic {
  id: string;
  name: string;
  status: 'Draft' | 'Generated';
  campaignId: string;
  projectId: string;
  userId: string;
  createdAt: FirestoreTimestamp;
  contentId?: string; // ID of the generated content in the 'generations' collection
}

export type SavedContent = GeneratedContent & {
  id: string;
  userId: string;
  topic: string; // The original topic text, kept for display
  language: string;
  createdAt: FirestoreTimestamp;
  // Linking fields
  projectId: string;
  campaignId: string;
  topicId: string;
};

export interface BrandVoiceProfile {
  id: string;
  userId: string;
  name: string;
  createdAt: FirestoreTimestamp;
  // Analyzed data
  toneAndManner: string;
  vocabularyLevel: string;
  sentenceStructure: string;
  dos: string[];
  donts: string[];
}

// --- CALENDAR TYPES ---
export interface CalendarSettings {
    userId: string;
    mainTopics: string;
    targetAudience: string;
}

export interface CalendarEvent {
    id: string;
    userId: string;
    title: string;
    start: string; // ISO string for the date
    status: 'suggested_trend' | 'suggested_event' | 'draft' | 'published';
    type: 'trend' | 'event' | 'manual';
    contentId?: string; // Link to the generated content
    // Fields for AI Event Reasoning
    insight?: string;
    suggestedAngles?: {
        title: string;
        predictionScore: number;
    }[];
}

// --- AI VISIBILITY (AIO) TYPES ---
export interface ActionItem {
    type: 'opportunity' | 'threat';
    insight: string;
    suggested_action: string;
}

export interface AIVisibilitySettings {
    userId: string;
    brandName: string;
    domain: string;
    keywords: string[];
    competitors: string[];
    // Linking fields
    projectId?: string;
    brandVoiceProfileId?: string;
}

export interface AIVisibilityResult {
    id: string;
    userId: string;
    createdAt: FirestoreTimestamp;
    shareOfVoice: { brand: string; percentage: number }[];
    sentimentCounts: {
        positive: number;
        neutral: number;
        negative: number;
    };
    sentimentAnalysis: {
        brand: string;
        sentiment: 'positive' | 'neutral' | 'negative';
        reason: string;
    }[];
    citationTracking: {
        query: string;
        domain: string;
        cited: boolean;
        url?: string;
        snippet?: string;
    }[];
    actionItem?: ActionItem;
}