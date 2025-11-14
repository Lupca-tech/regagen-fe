



import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { GeneratedContent, EditablePlatform, BrandVoiceProfile, Project, Campaign, PerformanceAnalysis } from '../types';
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

async function generateImage(prompt: string, onProgress: ProgressCallback): Promise<string> {
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
        console.error("Error generating image:", error);
         onProgress(90, "Image failed, using placeholder.");
        // Return a placeholder image on failure
        return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/768`;
    }
}

// Fix: Made properties of FullGenerationContext optional to support partial context from different sources.
interface FullGenerationContext {
    user?: User;
    projects?: Project[];
    campaigns?: Campaign[];
    brandVoiceProfile?: Omit<BrandVoiceProfile, 'id' | 'userId' | 'createdAt'>;
}

export const analyzePerformance = async (
  content: GeneratedContent,
  platforms: ('web' | 'tiktok' | 'facebook')[]
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
            model: "gemini-2.5-pro",
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
  generationContext?: FullGenerationContext
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
      properties.imagePrompt = { 
        type: Type.STRING, 
        description: "A detailed, visually descriptive prompt for an image generation AI, based on the article's content. This is optional and should only be generated if requested."
      };
    }

    const required = ['mainArticle'];
    if (shouldGenerateImage) {
      required.push('imagePrompt');
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
        // Fix: Added optional chaining and nullish coalescing to prevent runtime errors if parts of the context are missing.
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
    3.  **Image Prompt Generation:** ${shouldGenerateImage ? "Based on the article, create a detailed, dynamic, and visually descriptive prompt suitable for a text-to-image AI like Imagen." : "Image generation is disabled by the user. Do not generate an image prompt."}
    4.  **Content Adaptation:** Adapt the main article into specific formats ONLY for the following selected platforms: ${Array.from(selectedPlatforms).join(', ')}.
    5.  **Language Requirement:** All generated content MUST be in this language: ${language}.
    6.  **Output:** Return all of this information in a single, structured JSON object that adheres to the provided schema. Do not include any text outside of the JSON object.`;
    
    onProgress(10, "Analyzing trends...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Generate a full content package for the topic: "${topic}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: dynamicContentGenerationSchema,
        temperature: 0.8,
      },
    });

    onProgress(50, "Writing and adapting content...");
    const textContentString = response.text.trim();
    const textContent = JSON.parse(textContentString);
    
    const result: GeneratedContent = {
      mainArticle: textContent.mainArticle,
      image: {
        url: '',
        prompt: 'Image generation was disabled.',
      },
    };

    for (const platform of selectedPlatforms) {
        if (textContent[platform]) {
            result[platform] = textContent[platform];
        }
    }
    
    let imagePrompt = 'Image generation was disabled.';
    if (shouldGenerateImage && textContent.imagePrompt) {
        onProgress(70, "Creating image prompt...");
        imagePrompt = textContent.imagePrompt;
        result.image.url = await generateImage(imagePrompt, onProgress);
    } else {
        onProgress(90, "Skipping image generation...");
    }
    result.image.prompt = imagePrompt;
    
    onProgress(95, "Analyzing content performance...");
    const platformsToAnalyze = Array.from(selectedPlatforms).filter(p => ['web', 'tiktok', 'facebook'].includes(p)) as ('web' | 'tiktok' | 'facebook')[];
    if (platformsToAnalyze.length > 0) {
      try {
        result.analysis = await analyzePerformance(result, platformsToAnalyze);
      } catch (analysisError) {
        console.warn("Performance analysis failed, but content was generated:", analysisError);
        // Proceed without analysis data if it fails
      }
    }

    onProgress(100, "Finalizing package...");
    return result;

  } catch (error) {
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
  language: string
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
            model: "gemini-2.5-pro",
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
            model: "gemini-2.5-pro",
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
  count: number
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
            model: "gemini-2.5-pro",
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
            model: "gemini-2.5-flash",
            contents: `Analyze the following input and generate a project, campaign, and topic name structure:\n\n---\n\n${userInput}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
            signal,
        });

        return JSON.parse(response.text.trim());

    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error analyzing input for scaffolding:", error);
        }
        // Re-throw the error so the component can handle it (e.g., ignore AbortError)
        throw error;
    }
};