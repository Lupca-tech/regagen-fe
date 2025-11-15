import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GeneratedContent, EditablePlatform, BrandVoiceProfile, Project, Campaign, PerformanceAnalysis, CalendarSettings, CalendarEvent, AIVisibilitySettings, AIVisibilityResult, FirestoreTimestamp, ActionItem } from '../types';
import type { User } from './firebaseService';


if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const allPlatformProperties = {
  web: {
    type: Type.OBJECT,
    properties: {
      metaTitle: { type: Type.STRING, description: "An SEO-optimized meta title (50-60 characters)." },
      metaDescription: { type: Type.STRING, description: "An SEO-optimized meta description (150-160 characters)." },
      body: { type: Type.STRING, description: "The main article body, optimized for web reading with clear headings and structure, formatted as plain text with markdown-style line breaks." },
      htmlBody: { type: Type.STRING, description: "A clean, semantic HTML version of the article body. Use tags like <h2>, <h3>, <p>, <strong>, <em>, <ul>, and <li>. This is for direct pasting into a CMS like Blogger or WordPress." },
      focusKeyword: { type: Type.STRING, description: "The single most important keyword or phrase (2-4 words) that the content should rank for." }
    },
    required: ["metaTitle", "metaDescription", "body", "htmlBody", "focusKeyword"],
  },
  facebook: {
    type: Type.OBJECT,
    properties: {
      postText: { type: Type.STRING, description: "A short, engaging Facebook post with emojis and a call to action." },
    },
    required: ["postText"],
  },
  linkedin: {
    type: Type.OBJECT,
    properties: {
      postText: { type: Type.STRING, description: "A professional, business-oriented LinkedIn post. It should be insightful, use relevant hashtags, and encourage professional discussion." },
    },
    required: ["postText"],
  },
  x: {
    type: Type.OBJECT,
    properties: {
      postText: { type: Type.STRING, description: "A concise, impactful post for X (formerly Twitter), under 280 characters, with relevant hashtags." },
    },
    required: ["postText"],
  },
  tiktok: {
    type: Type.OBJECT,
    properties: {
      script: { type: Type.STRING, description: "A script for a 30-60 second TikTok/YT Shorts video, including visual cues and spoken lines." },
    },
    required: ["script"],
  },
  youtube: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy, keyword-rich title for a YouTube video." },
      description: { type: Type.STRING, description: "A detailed YouTube video description with timestamps, links, and hashtags." },
    },
    required: ["title", "description"],
  },
};

type ProgressCallback = (progress: number, message: string) => void;

async function generateImage(prompt: string, onProgress: ProgressCallback, signal?: AbortSignal): Promise<string> {
    try {
        onProgress(75, "Generating cover image...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                onProgress(90, "Image received...");
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image data found in response.");

    } catch (error) {
        if ((error as Error).name === 'AbortError') {
          throw error;
        }
        console.error("Error generating image:", error);
         onProgress(90, "Image failed, using placeholder.");
        return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/768`;
    }
}

interface FullGenerationContext {
    user?: User;
    projects?: Project[];
    campaigns?: Campaign[];
    brandVoiceProfile?: Omit<BrandVoiceProfile, 'id' | 'userId' | 'createdAt'>;
}

export const analyzePerformance = async (
  content: GeneratedContent,
  platforms: ('web' | 'tiktok' | 'facebook')[],
  signal?: AbortSignal
): Promise<PerformanceAnalysis> => {
    const seoAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER, description: "Overall SEO score from 0 to 100." },
            headlineStrength: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Headline strength score from 0 to 100 based on length, keywords, and sentiment." },
                    feedback: { type: Type.STRING, description: "Concise feedback on the headline's effectiveness." },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 alternative, stronger headline suggestions." }
                },
                required: ["score", "feedback", "suggestions"]
            },
            keywordAnalysis: {
                type: Type.OBJECT,
                properties: {
                    density: { type: Type.NUMBER, description: "Keyword density percentage for the focus keyword." },
                    feedback: { type: Type.STRING, description: "Feedback on keyword usage and placement." }
                },
                required: ["density", "feedback"]
            },
            readability: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Readability score from 0-100 (like Flesch-Kincaid), where higher is better and easier to read." },
                    feedback: { type: Type.STRING, description: "Feedback on the content's readability and complexity." }
                },
                required: ["score", "feedback"]
            }
        },
        required: ["score", "headlineStrength", "keywordAnalysis", "readability"]
    };

    const tiktokAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            hookScore: { type: Type.NUMBER, description: "A score from 0-100 on how engaging the first 3 seconds of the script are." },
            hookFeedback: { type: Type.STRING, description: "Specific feedback on the script's hook and how to improve it." },
            predictedRetention: { type: Type.NUMBER, description: "Predicted audience retention percentage for the full video." },
            retentionFeedback: { type: Type.STRING, description: "Feedback on what might affect viewer retention throughout the script." }
        },
        required: ["hookScore", "hookFeedback", "predictedRetention", "retentionFeedback"]
    };

    const facebookAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            engagementScore: { type: Type.NUMBER, description: "A score from 0-100 predicting the post's engagement potential (likes, comments, shares)." },
            ctaPresence: {
                type: Type.OBJECT,
                properties: {
                    detected: { type: Type.BOOLEAN, description: "Whether a clear call-to-action was detected." },
                    feedback: { type: Type.STRING, description: "Feedback on the CTA's effectiveness or absence." }
                },
                required: ["detected", "feedback"]
            },
            sentiment: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "Sentiment score from -1 (very negative) to 1 (very positive)." },
                    label: { type: Type.STRING, description: "Sentiment label (e.g., 'Positive', 'Neutral', 'Mixed')." }
                },
                required: ["score", "label"]
            },
            lengthAnalysis: {
                type: Type.OBJECT,
                properties: {
                    isOptimal: { type: Type.BOOLEAN, description: "Whether the post length is considered optimal for Facebook engagement." },
                    feedback: { type: Type.STRING, description: "Feedback on the post's length and suggestions if needed." }
                },
                required: ["isOptimal", "feedback"]
            }
        },
        required: ["engagementScore", "ctaPresence", "sentiment", "lengthAnalysis"]
    };

    const analysisProperties: any = {};
    const requiredProperties: string[] = [];
    let contentToAnalyze = "Here is the content to analyze:\n\n";

    if (platforms.includes('web') && content.web) {
        analysisProperties.web = seoAnalysisSchema;
        requiredProperties.push('web');
        contentToAnalyze += `--- WEB CONTENT ---\nMeta Title: ${content.web.metaTitle}\nFocus Keyword: ${content.web.focusKeyword}\nBody:\n${content.web.body}\n\n`;
    }
    if (platforms.includes('tiktok') && content.tiktok) {
        analysisProperties.tiktok = tiktokAnalysisSchema;
        requiredProperties.push('tiktok');
        contentToAnalyze += `--- TIKTOK SCRIPT ---\n${content.tiktok.script}\n\n`;
    }
    if (platforms.includes('facebook') && content.facebook) {
        analysisProperties.facebook = facebookAnalysisSchema;
        requiredProperties.push('facebook');
        contentToAnalyze += `--- FACEBOOK POST ---\n${content.facebook.postText}\n\n`;
    }

    if (requiredProperties.length === 0) return {};

    const dynamicAnalysisSchema = {
        type: Type.OBJECT,
        properties: analysisProperties,
        required: requiredProperties,
    };

    const systemInstruction = `You are a world-class performance marketing analyst and content strategist. Your task is to analyze generated content for various platforms and provide a detailed, data-driven "Pre-Publish Performance Analysis". You must score the content on key metrics and provide actionable feedback for improvement.

    - **For Web/SEO content:** Analyze the provided meta title, focus keyword, and body. Evaluate headline strength, keyword density, and readability. Provide concrete suggestions for better headlines.
    - **For TikTok scripts:** Focus on the first 3 seconds to score the "hook". Predict the overall retention rate based on the script's structure and flow.
    - **For Facebook posts:** Evaluate the potential for engagement. Check for a clear Call-to-Action (CTA), analyze the sentiment, and assess if the length is optimal for the platform.

    Your output MUST be a clean JSON object that adheres to the provided schema. Do not include any text outside of the JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: contentToAnalyze,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: dynamicAnalysisSchema,
            },
        });
        
        return JSON.parse(response.text.trim());

    } catch (error) {
        console.error("Error analyzing content performance:", error);
        if (error instanceof Error) {
            if (error.name === 'AbortError') throw error;
            throw new Error(`Gemini API call failed during performance analysis: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during performance analysis.");
    }
};


export const generateContentFlow = async (
  topic: string, 
  language: string, 
  shouldGenerateImage: boolean, 
  selectedPlatforms: Set<EditablePlatform>,
  onProgress: ProgressCallback = () => {},
  generationContext?: FullGenerationContext,
  signal?: AbortSignal
): Promise<GeneratedContent> => {
  try {
    const properties: any = {
       mainArticle: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A compelling headline for the main article." },
          body: { type: Type.STRING, description: "The full text of the article, formatted in Markdown." },
        },
        required: ["title", "body"],
      },
    };
    
    if (shouldGenerateImage) {
      properties.imagePrompts = {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 3-5 detailed, visually descriptive prompts for an image generation AI. The prompts must be highly specific to the article's content and topic. For abstract topics (like software or finance), you MUST specify a concrete visual style (e.g., 'digital art', 'minimalist vector illustration'). The first prompt must be for a general-purpose cover image. Subsequent prompts should illustrate key points in the article, create a storyboard for a video script, or assets for a social media carousel, relevant to the selected platforms."
      };
    }

    const required = ['mainArticle'];
    if (shouldGenerateImage) {
      required.push('imagePrompts');
    }

    for (const platform of selectedPlatforms) {
        if (allPlatformProperties[platform]) {
            properties[platform] = allPlatformProperties[platform];
            required.push(platform);
        }
    }
    
    const dynamicContentGenerationSchema = {
      type: Type.OBJECT,
      properties,
      required,
    };

    let brandVoiceInstruction = '';
    if (generationContext?.brandVoiceProfile) {
        brandVoiceInstruction = `
        **CRITICAL: ADHERE TO THE BRAND VOICE PROFILE: ${generationContext.brandVoiceProfile.name}**
        - **Tone & Manner:** ${generationContext.brandVoiceProfile.toneAndManner}
        - **Vocabulary Level:** ${generationContext.brandVoiceProfile.vocabularyLevel}
        - **Sentence Structure:** ${generationContext.brandVoiceProfile.sentenceStructure}
        - **Rules to Follow (Do's):**
          ${generationContext.brandVoiceProfile.dos.map(rule => `- ${rule}`).join('\n')}
        - **Things to Avoid (Don'ts):**
          ${generationContext.brandVoiceProfile.donts.map(rule => `- ${rule}`).join('\n')}
        `;
    }

    let ragContext = '';
    if (generationContext) {
        ragContext = `
        **IMPORTANT CONTEXT TO PERSONALIZE CONTENT:**
        - **User Profile:** The user's display name is "${generationContext.user?.displayName || 'N/A'}".
        - **Existing Projects:** The user is working on these projects: ${generationContext.projects?.map(p => p.name).join(', ') || 'none'}.
        - **Existing Campaigns:** The user has these active campaigns: ${generationContext.campaigns?.map(c => c.name).join(', ') || 'none'}.
        - **Brand Voice:** ${brandVoiceInstruction || 'Use a default, engaging, and informative tone.'}

        Use this context to ensure the generated content is highly relevant to the user's ongoing work and brand identity.
        `;
    }

    const systemInstruction = `You are a world-class content strategist and creation engine. Your task is to take a single topic and execute a multi-step content generation flow.
    ${ragContext}
    1.  **Simulate Research (RAG Pre-computation):** First, act as a market research tool. For the given topic, internally brainstorm the top 3-5 trending keywords and imagine 2-3 highly-ranked articles.
    2.  **Core Generation (RAG Application):** Using this simulated research as your context, write a comprehensive, unique, and high-quality main blog post.
    3.  **Visual Asset Prompt Generation:** ${shouldGenerateImage ? `Based on the article and adapted content for the topic '${topic}', create a set of 3-5 detailed, dynamic, and visually descriptive prompts suitable for a text-to-image AI. These prompts MUST be highly relevant to the specific topic and avoid generic concepts like abstract landscapes unless they are directly relevant. For technical or abstract topics (e.g., software, finance), you MUST specify an appropriate visual style like 'digital art', 'vector illustration', 'cyberpunk aesthetic', or 'minimalist tech graphic'. For other topics, choose a fitting style (e.g., 'vibrant photorealistic', 'cinematic shot'). The first prompt MUST be for a general-purpose cover image. Subsequent prompts should be for: a) illustrating key sections of the web article, b) creating storyboard scenes for the TikTok/YouTube script, or c) summarizing key points for a Facebook/LinkedIn carousel. Generate prompts relevant to the platforms being created for.` : "Visual asset generation is disabled by the user. Do not generate any image prompts."}
    4.  **Content Adaptation:** Adapt the main article into specific formats ONLY for the following selected platforms: ${Array.from(selectedPlatforms).join(', ')}.
    5.  **Language Requirement:** All generated content MUST be in this language: ${language}.
    6.  **Output:** Return all of this information in a single, structured JSON object that adheres to the provided schema. Do not include any text outside of the JSON object.`;
    
    onProgress(10, "Analyzing trends...");
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Generate a full content package for the topic: "${topic}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: dynamicContentGenerationSchema,
        temperature: 0.8,
      },
    });
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    onProgress(50, "Writing and adapting content...");
    const textContentString = response.text.trim();
    const textContent = JSON.parse(textContentString);
    
    const result: GeneratedContent = {
      mainArticle: textContent.mainArticle,
      images: [],
    };

    for (const platform of selectedPlatforms) {
        if (textContent[platform]) {
            result[platform] = textContent[platform];
        }
    }
    
    if (shouldGenerateImage && textContent.imagePrompts && Array.isArray(textContent.imagePrompts) && textContent.imagePrompts.length > 0) {
        const imagePrompts: string[] = textContent.imagePrompts;
        onProgress(75, `Generating ${imagePrompts.length} visual assets...`);

        const imageUrls = await Promise.all(
            imagePrompts.map(prompt => generateImage(prompt, () => {}, signal))
        );
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        result.images = imageUrls.map((url, index) => ({
            url: url,
            prompt: imagePrompts[index]
        }));

        onProgress(90, "Visual assets received...");
    } else {
        onProgress(90, "Skipping visual asset generation...");
    }
    
    onProgress(95, "Analyzing content performance...");
    const platformsToAnalyze = Array.from(selectedPlatforms).filter(p => ['web', 'tiktok', 'facebook'].includes(p)) as ('web' | 'tiktok' | 'facebook')[];
    if (platformsToAnalyze.length > 0) {
      try {
        result.analysis = await analyzePerformance(result, platformsToAnalyze, signal);
      } catch (analysisError) {
        if ((analysisError as Error).name === 'AbortError') throw analysisError;
        console.warn("Performance analysis failed, but content was generated:", analysisError);
      }
    }
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    onProgress(100, "Finalizing package...");
    return result;

  } catch (error) {
    if ((error as Error).name === 'AbortError') {
        throw error;
    }
    console.error("Error in content generation flow:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API call failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during content generation.");
  }
};

export const regeneratePlatformContent = async (
  platform: EditablePlatform,
  topic: string,
  currentContent: any,
  userPrompt: string,
  language: string,
  signal?: AbortSignal
): Promise<any> => {
    try {
        const systemInstruction = `You are an expert content editor. A user has provided you with existing content for a specific platform and a request for changes.
        Your task is to rewrite the content based on their feedback, keeping the original topic in mind and adhering to the best practices for the target platform.
        Original Topic: "${topic}"
        Target Platform: ${platform}
        Language: ${language}
        Return ONLY the updated content in a structured JSON object that matches the required schema for the platform.`;

        const prompt = `
        Here is the current content:
        \`\`\`json
        ${JSON.stringify(currentContent, null, 2)}
        \`\`\`

        Here is the user's request for changes:
        "${userPrompt}"

        Please provide the rewritten content in the required JSON format.
        `;

        let responseSchema;
        switch (platform) {
            case 'facebook':
            case 'linkedin':
            case 'x':
                responseSchema = { type: Type.OBJECT, properties: { postText: { type: Type.STRING } }, required: ["postText"] };
                break;
            case 'tiktok':
                responseSchema = { type: Type.OBJECT, properties: { script: { type: Type.STRING } }, required: ["script"] };
                break;
            case 'youtube':
                responseSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] };
                break;
            case 'web':
                 responseSchema = { type: Type.OBJECT, properties: { metaTitle: { type: Type.STRING }, metaDescription: { type: Type.STRING }, body: { type: Type.STRING }, htmlBody: { type: Type.STRING }, focusKeyword: { type: Type.STRING } }, required: ["metaTitle", "metaDescription", "body", "htmlBody", "focusKeyword"] };
                break;
            default:
                throw new Error(`Unsupported platform for regeneration: ${platform}`);
        }

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });
    
        const regeneratedContent = JSON.parse(response.text.trim());
        return regeneratedContent;

    } catch (error) {
        console.error(`Error regenerating content for ${platform}:`, error);
        if (error instanceof Error) {
            if (error.name === 'AbortError') throw error;
            throw new Error(`Gemini API call failed during regeneration: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during content regeneration.");
    }
};

export const analyzeBrandVoice = async (samples: string): Promise<Omit<BrandVoiceProfile, 'id'|'userId'|'name'|'createdAt'>> => {
    try {
        const schema = {
            type: Type.OBJECT,
            properties: {
                toneAndManner: { type: Type.STRING, description: "A concise description of the overall tone and manner (e.g., 'Professional yet approachable', 'Enthusiastic and witty', 'Formal and academic')." },
                vocabularyLevel: { type: Type.STRING, description: "The level of vocabulary used (e.g., 'Simple and direct', 'Business professional', 'Highly technical and specific')." },
                sentenceStructure: { type: Type.STRING, description: "Describe the typical sentence structure (e.g., 'Mostly short, declarative sentences', 'A mix of long, complex sentences and short, punchy ones')." },
                dos: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "A list of 3-5 specific, actionable rules to follow to replicate this voice (e.g., 'Use rhetorical questions to engage the reader', 'Incorporate industry-specific acronyms', 'Always start with a compelling statistic')."
                },
                donts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of 3-5 things to avoid (e.g., 'Avoid using passive voice', 'Do not use slang or overly casual language', 'Never make unsubstantiated claims')."
                }
            },
            required: ["toneAndManner", "vocabularyLevel", "sentenceStructure", "dos", "donts"]
        };

        const systemInstruction = `You are an expert brand strategist and linguistic analyst. Your task is to analyze the provided text samples and create a concise, actionable 'Style Profile' that captures the essence of the writing voice. Focus on tone, vocabulary, sentence complexity, and recurring patterns. Extract specific rules for what to DO and what NOT TO DO to replicate this voice. The output MUST be in the provided JSON schema.`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `Analyze the following text samples and generate a style profile:\n\n---\n\n${samples}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const analyzedProfile = JSON.parse(response.text.trim());
        return analyzedProfile;
    } catch (error) {
        console.error("Error analyzing brand voice:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API call failed during brand voice analysis: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during brand voice analysis.");
    }
};

export const generateTopicsAI = async (
  project: { name: string, description: string },
  campaign: { name: string, goal: string },
  count: number,
  signal?: AbortSignal
): Promise<string[]> => {
    try {
        const schema = {
            type: Type.OBJECT,
            properties: {
                topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: `An array of ${count} topic ideas.`
                }
            },
            required: ["topics"]
        };

        const systemInstruction = `You are a world-class viral marketing strategist and SEO expert. Your task is to generate compelling, clickable, and highly relevant topic ideas (like blog post titles) based on a given project and campaign.
        1.  **Analyze Context:** Deeply consider the project's overall purpose and the specific goal of the campaign.
        2.  **Simulate Research:** Internally brainstorm current trends, common questions, and high-interest angles related to the project and campaign. Think about what a real audience would search for or click on.
        3.  **Generate Topics:** Create a list of exactly ${count} unique topic ideas. They should be engaging, clear, and optimized for discoverability.
        4.  **Output:** Return the list in a single, structured JSON object that adheres to the provided schema. Do not include any text outside of the JSON object.`;
        
        const prompt = `
        Project Name: "${project.name}"
        Project Description: "${project.description}"

        Campaign Name: "${campaign.name}"
        Campaign Goal: "${campaign.goal}"

        Generate ${count} topic ideas.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.9,
            },
        });

        const result = JSON.parse(response.text.trim());
        if (result.topics && Array.isArray(result.topics)) {
            return result.topics;
        }
        throw new Error("Invalid response format from AI.");

    } catch (error) {
        console.error("Error generating topics with AI:", error);
        if (error instanceof Error) {
            if (error.name === 'AbortError') throw error;
            throw new Error(`Gemini API call failed during topic generation: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during AI topic generation.");
    }
};


export const analyzeInputForScaffolding = async (
  userInput: string,
  signal?: AbortSignal
): Promise<{ projectName: string; campaignName: string; topicName: string; }> => {
    try {
        const schema = {
            type: Type.OBJECT,
            properties: {
                projectName: { type: Type.STRING, description: "A short, high-level name for the overall project or content category. (e.g., 'EV Innovations 2024')." },
                campaignName: { type: Type.STRING, description: "A name for a specific campaign or content series under the project. (e.g., 'Future of Batteries')." },
                topicName: { type: Type.STRING, description: "A specific, article-like title for the content itself, derived from the input. (e.g., 'The Revolution of Solid-State Batteries in Electric Vehicles')." },
            },
            required: ["projectName", "campaignName", "topicName"]
        };

        const systemInstruction = `You are an expert content strategist. Your task is to analyze a user's input (which could be a simple topic, a full article, or a prompt) and extract a logical hierarchy for it. Based on the input, suggest a concise and relevant Project Name, Campaign Name, and Topic Name. The output must be a clean JSON object that adheres to the provided schema. Do not include any other text.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `Analyze the following input and generate a project, campaign, and topic name structure:\n\n---\n\n${userInput}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        return JSON.parse(response.text.trim());

    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error analyzing input for scaffolding:", error);
        }
        throw error;
    }
};

export const generateCalendarSuggestions = async (
  settings: CalendarSettings,
  currentDate: Date,
  signal?: AbortSignal
): Promise<Omit<CalendarEvent, 'id' | 'userId'>[]> => {
    try {
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();

        const systemInstruction = `You are a world-class content strategist and trend analyst. Your task is to generate 5 strategic content ideas for a user's content calendar.
        1.  **Analyze Context:** The user's main topics are "${settings.mainTopics}" and their target audience is "${settings.targetAudience}". The target month is ${monthName} ${year}.
        2.  **Find Events & Trends:** Use Google Search to find relevant holidays, cultural events, or trending topics for the specified month and user context.
        3.  **For EACH idea, perform a deep analysis:**
            a.  **Historical Analysis:** Briefly consider common content themes from past years to identify what is likely "saturated".
            b.  **Trend Analysis:** Find emerging sub-topics or trending discussions with high "trending velocity".
            c.  **Synthesize Insight:** Write a concise "insight" (2-3 sentences) explaining why traditional angles are saturated and highlighting new opportunities.
            d.  **Suggest Angles:** Generate 2-3 specific, actionable content angles (like blog post titles) based on your insight.
            e.  **Predict Performance:** For each angle, provide a "predictionScore" (0-100) estimating its potential for virality.
        4.  **Output Format:** Your final output MUST be a single, clean JSON object. Do not include any text outside of the JSON object. The JSON should have a single key "suggestions" which is an array of 5 objects, each with these keys: "title", "date" (YYYY-MM-DD), "type" ('event' or 'trend'), "insight", and "suggestedAngles" (an array of objects with "title" and "predictionScore").`;

        const prompt = `Generate 5 strategic content suggestions for ${monthName} ${year}.`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
                temperature: 0.9,
            },
        });

        // Clean potential markdown code fences from the response
        let responseText = response.text.trim();
        if (responseText.startsWith('```json')) {
            responseText = responseText.substring(7, responseText.length - 3).trim();
        } else if (responseText.startsWith('```')) {
             responseText = responseText.substring(3, responseText.length - 3).trim();
        }

        const result = JSON.parse(responseText);
        if (result.suggestions && Array.isArray(result.suggestions)) {
            // Transform the result to match the expected structure if needed
            return result.suggestions.map((s: any) => ({
                title: s.title,
                start: s.date, // Ensure the key is 'start' for the CalendarEvent type
                status: s.type === 'trend' ? 'suggested_trend' : 'suggested_event',
                type: s.type,
                insight: s.insight,
                suggestedAngles: s.suggestedAngles,
            }));
        }
        throw new Error("Invalid response format from AI for calendar suggestions.");

    } catch (error) {
        console.error("Error generating calendar suggestions with AI:", error);
        if (error instanceof Error) {
            if (error.name === 'AbortError') throw error;
            throw new Error(`Gemini API call failed during calendar suggestion generation: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during AI calendar suggestion generation.");
    }
};

// --- AI VISIBILITY SERVICE (Mocked "AI-on-AI" flow) ---

/**
 * Simulates analyzing raw LLM text to produce a structured JSON object.
 */
function simulateMetaPromptAnalysis(rawText: string, settings: AIVisibilitySettings, query: string) {
    const mentions: string[] = [];
    const sentiments: AIVisibilityResult['sentimentAnalysis'] = [];
    let citation: AIVisibilityResult['citationTracking'][0] = {
        query,
        domain: settings.domain,
        cited: false
    };

    const textLower = rawText.toLowerCase();
    const allBrands = [settings.brandName, ...settings.competitors];

    // Analyze mentions and sentiment
    allBrands.forEach(brand => {
        const brandLower = brand.toLowerCase();
        if (textLower.includes(brandLower)) {
            mentions.push(brand);
            let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
            let reason = `The brand ${brand} was mentioned in the context of the query.`;

            if (/\b(excellent|best|great|highly recommended|love)\b/.test(textLower)) {
                sentiment = 'positive';
                reason = `Described with positive language like "excellent" or "best".`;
            } else if (/\b(disappointing|lacks|not as good|poorly)\b/.test(textLower)) {
                sentiment = 'negative';
                reason = `Associated with negative phrases like "disappointing" or "lacks features".`;
            }
            sentiments.push({ brand, sentiment, reason });
        }
    });

    // Analyze citation
    if (textLower.includes(settings.domain.toLowerCase())) {
        const urlMatch = rawText.match(new RegExp(`https?://${settings.domain.replace('.', '\\.')}[^\\s]*`, 'i'));
        citation = {
            ...citation,
            cited: true,
            url: urlMatch ? urlMatch[0] : `${settings.domain}/blog/ai-seo`,
            snippet: `...${rawText.substring(Math.max(0, textLower.indexOf(settings.domain.toLowerCase()) - 30), 150)}...`,
        };
    }
    
    return { mentions, sentiments, citation };
}

/**
 * Mocks a raw text response from a generic LLM.
 */
function mockLLMResponse(keyword: string, brandName: string, competitors: string[], domain: string): string {
    const brandPool = [brandName, ...competitors, ...competitors]; // Skew towards competitors
    const mentionedBrand = brandPool[Math.floor(Math.random() * brandPool.length)];
    const secondMention = brandPool[Math.floor(Math.random() * brandPool.length)];
    const positiveWords = ['excellent', 'the best', 'highly recommended', 'a great choice'];
    const negativeWords = ['disappointing', 'lacks features', 'is not as good as', 'poorly reviewed'];
    
    let sentence = `When considering "${keyword}", many people find that ${mentionedBrand} is a popular option. `;
    
    const sentimentRoll = Math.random();
    if (sentimentRoll < 0.5) { // Positive
        sentence += `It is often described as ${positiveWords[Math.floor(Math.random() * positiveWords.length)]}. `;
    } else if (sentimentRoll < 0.7) { // Negative
        sentence += `However, some users find it ${negativeWords[Math.floor(Math.random() * negativeWords.length)]}. `;
    } else { // Neutral/Comparison
        sentence += `Compared to ${secondMention}, it has its own strengths. `;
    }

    const citationRoll = Math.random();
    if (citationRoll < 0.4) { // Citation happens
        sentence += `For more details on this, a good resource can be found at ${domain}/blog/${keyword.replace(/\s+/g, '-')}.`;
    }

    return sentence;
}

/**
 * Simulates the Strategy Agent. It analyzes the aggregated results to find one key insight.
 */
function _generateActionItem(perKeywordAnalyses: any[], settings: AIVisibilitySettings): ActionItem | undefined {
    // Priority 1: Find a threat (negative sentiment for our brand)
    for (const analysis of perKeywordAnalyses) {
        const negativeMention = analysis.sentiments.find((s: any) => s.brand === settings.brandName && s.sentiment === 'negative');
        if (negativeMention) {
            return {
                type: 'threat',
                insight: `Your brand received negative sentiment for the keyword "${analysis.citation.query}". The analysis noted: "${negativeMention.reason}"`,
                suggested_action: `Review the content associated with "${analysis.citation.query}" to address the negative feedback. Consider publishing a corrective or clarifying piece.`
            };
        }
    }

    // Priority 2: Find a citation opportunity
    for (const analysis of perKeywordAnalyses) {
        if (!analysis.citation.cited) {
            const competitorMentioned = analysis.sentiments.some((s: any) => s.brand !== settings.brandName);
            if (competitorMentioned) {
                return {
                    type: 'opportunity',
                    insight: `A competitor was mentioned for the strategic keyword "${analysis.citation.query}", but your domain was not cited as a source.`,
                    suggested_action: `Create a comprehensive blog post or guide titled 'The Ultimate Guide to ${analysis.citation.query}' to become the primary source and capture this citation.`
                };
            }
        }
    }

    // Fallback if no specific threat/opportunity is found
    return {
        type: 'opportunity',
        insight: `Daily analysis complete. No high-priority threats detected. General opportunity exists to increase overall Share of Voice.`,
        suggested_action: `Continue monitoring daily performance and consider a broader content push on keywords where competitor presence is high.`
    };
}

export const getAIVisibilityAnalysis = async (settings: AIVisibilitySettings, signal?: AbortSignal): Promise<AIVisibilityResult> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const allBrands = [settings.brandName, ...settings.competitors];
    const perKeywordAnalyses: any[] = [];

    // 1. Simulate Analysis Agent for each keyword
    for (const keyword of settings.keywords) {
        const rawResponse = mockLLMResponse(keyword, settings.brandName, settings.competitors, settings.domain);
        const analysis = simulateMetaPromptAnalysis(rawResponse, settings, keyword);
        perKeywordAnalyses.push(analysis);
    }
    
    // 2. Simulate Summary Logic: Aggregate results
    const finalResult: AIVisibilityResult = {
        id: `result-${Date.now()}`,
        userId: settings.userId,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as FirestoreTimestamp,
        shareOfVoice: [],
        sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
        sentimentAnalysis: [],
        citationTracking: [],
    };
    
    const mentionCounts: Record<string, number> = {};
    allBrands.forEach(b => mentionCounts[b] = 0);

    perKeywordAnalyses.forEach(analysis => {
        analysis.mentions.forEach((brand: string) => {
             mentionCounts[brand] = (mentionCounts[brand] || 0) + 1;
        });
        finalResult.sentimentAnalysis.push(...analysis.sentiments);
        finalResult.citationTracking.push(analysis.citation);
    });

    // 4. Finalize aggregations
    const totalMentions = Object.values(mentionCounts).reduce((sum, count) => sum + count, 0);
    finalResult.shareOfVoice = allBrands.map(brand => ({
        brand,
        percentage: totalMentions > 0 ? (mentionCounts[brand] / totalMentions) * 100 : 0,
    }));
    
    finalResult.sentimentAnalysis.forEach(s => {
        if (s.brand === settings.brandName) {
            if (s.sentiment === 'positive') finalResult.sentimentCounts.positive++;
            else if (s.sentiment === 'negative') finalResult.sentimentCounts.negative++;
            else finalResult.sentimentCounts.neutral++;
        }
    });
    
    // 5. Simulate Strategy Agent to generate a single ActionItem
    const actionItem = _generateActionItem(perKeywordAnalyses, settings);
    if (actionItem) {
        finalResult.actionItem = actionItem;
    }

    return finalResult;
};