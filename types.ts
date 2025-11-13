
export type EditablePlatform = 'web' | 'facebook' | 'linkedin' | 'x' | 'tiktok' | 'youtube';

export interface GeneratedContent {
  mainArticle: {
    title: string;
    body: string;
  };
  image: {
    url: string;
    prompt: string;
  };
  web?: {
    metaTitle: string;
    metaDescription: string;
    body: string;
    htmlBody: string;
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
