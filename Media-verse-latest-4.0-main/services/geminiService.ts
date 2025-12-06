import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { FavPart, AiSearchFilter } from '../types';

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                // result is a data URL (e.g., "data:image/jpeg;base64,ABC..."), we only want the base64 part
                const base64String = (reader.result as string).split(',')[1];
                if(base64String) {
                    resolve(base64String);
                } else {
                    reject(new Error('Blob to base64 conversion resulted in an empty string.'));
                }
            } else {
                reject(new Error('Failed to read blob as data URL.'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};


if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fastModel = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro';
const visionModel = 'gemini-2.5-flash';

export async function summarizeText(text: string): Promise<string> {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: fastModel,
            contents: text,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing text:", error);
        throw new Error("Failed to get summary from AI.");
    }
}

export async function askQuestionAboutMedia(fileBlob: Blob, mimeType: string, question: string): Promise<string> {
    try {
        if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
             return "I can only answer questions about images and videos.";
        }

        const base64 = await blobToBase64(fileBlob);

        const mediaPart = {
            inlineData: {
                mimeType: mimeType,
                data: base64,
            },
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [mediaPart, { text: question }] },
        });
        
        return response.text;
    } catch (error) {
        console.error(`Error answering question:`, error);
        throw new Error("Failed to get answer from AI.");
    }
}

export async function generateScriptFromClips(clips: (FavPart & { parentTitle?: string })[]): Promise<string> {
    try {
        const prompt = `You are a creative video script writer. Based on the following list of video clips, create a short, engaging script for a highlight reel. The script should have a narrator part and suggest which clip to show.

Clips available:
${clips.map(c => `- "${c.title}" from video "${c.parentTitle || 'Unknown Video'}" ${c.tags ? `(Tags: ${c.tags.join(', ')})` : ''}`).join('\n')}

Generate a script in Markdown format with headings for different sections.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: fastModel,
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating script:", error);
        throw new Error("Failed to generate script from AI.");
    }
}

export async function analyzeMediaContent(fileBlob: Blob, mimeType: string): Promise<{ category: string; tags: string[]; description: string; }> {
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
        throw new Error("Analysis is only available for images and videos.");
    }
    
    try {
        const base64 = await blobToBase64(fileBlob);
        const mediaPart = { inlineData: { mimeType, data: base64 } };
        const prompt = `Analyze this media. Provide a suitable category, a list of 3-5 relevant tags, and a short, one-sentence description. Use general categories like "Nature", "Technology", "People", "Animals", "Food", "Travel", "Sports", "Art", "Abstract".`;

        const response = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [mediaPart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        description: { type: Type.STRING }
                    },
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error analyzing media content:", error);
        throw new Error("Failed to analyze media with AI.");
    }
}

export async function suggestTitleFromContext(parentTitle: string, startTime: number, endTime: number): Promise<string> {
    try {
        const prompt = `The main video is titled "${parentTitle}". Suggest a short, catchy, action-oriented title (3-5 words max) for a video clip that starts at ${formatTime(startTime)} and ends at ${formatTime(endTime)}. Do not include the original title in your suggestion. Just provide the title text.`;
        
        const response = await ai.models.generateContent({
            model: fastModel,
            contents: prompt,
        });

        // Clean up the response to remove potential markdown or quotes
        return response.text.trim().replace(/["'`]/g, '');

    } catch (error) {
        console.error("Error suggesting clip title:", error);
        throw new Error("Failed to suggest a title with AI.");
    }
}

export async function suggestTagsFromText(parentTitle: string, clipTitle: string): Promise<string[]> {
    try {
        const prompt = `Based on a parent video titled "${parentTitle}" and a clip from it titled "${clipTitle}", suggest 3-5 relevant and concise tags (1-2 words each).`;
        
        const response = await ai.models.generateContent({
            model: fastModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        return parsed.tags || [];

    } catch (error) {
        console.error("Error suggesting tags:", error);
        throw new Error("Failed to suggest tags with AI.");
    }
}

export async function generateSocialMediaPost(fileBlob: Blob, mimeType: string, fileTitle: string): Promise<string> {
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
        throw new Error("Social media posts can only be generated for images and videos.");
    }

    try {
        const base64 = await blobToBase64(fileBlob);
        const mediaPart = { inlineData: { mimeType, data: base64 } };
        const prompt = `You are a creative social media manager. Look at this media, which is titled "${fileTitle}". Create an engaging post for a platform like Instagram or X. Include a catchy caption, relevant hashtags (e.g., #photography, #videography), and an appropriate emoji. Format it nicely as a complete post.`;

        const response = await ai.models.generateContent({
            model: proModel,
            contents: { parts: [mediaPart, { text: prompt }] },
        });

        return response.text;

    } catch (error) {
        console.error("Error generating social media post:", error);
        throw new Error("Failed to generate social media post with AI.");
    }
}

export async function interpretNaturalLanguageSearch(query: string): Promise<AiSearchFilter> {
    try {
        const prompt = `Today's date is ${new Date().toISOString().split('T')[0]}. Convert the user's search query into a structured JSON filter. Only use the fields provided in the schema.

User Query: "${query}"`;

        const response = await ai.models.generateContent({
            model: fastModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title_contains: { type: Type.STRING },
                        type_is: { type: Type.STRING, enum: ['video', 'image', 'audio'] },
                        rating_greater_than: { type: Type.NUMBER },
                        rating_less_than: { type: Type.NUMBER },
                        created_after: { type: Type.STRING, description: 'YYYY-MM-DD' },
                        created_before: { type: Type.STRING, description: 'YYYY-MM-DD' },
                        is_favorite: { type: Type.BOOLEAN },
                        has_description: { type: Type.BOOLEAN },
                        tags_include: { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error interpreting search query:", error);
        throw new Error("Failed to understand your search. Please try a different query.");
    }
}

export async function findSimilarImages(baseImage: Blob, candidates: {id: string, blob: Blob}[]): Promise<string[][]> {
     if (candidates.length === 0) return [];
    try {
        const base64 = await blobToBase64(baseImage);
        const parts = [
            { text: `Is the first image visually similar (same subject, different angle/edit) to any of the following images? Group similar image IDs together. Return a JSON object with a key "similar_groups", which is an array of arrays of strings (the IDs). Image ID for the first image is "base".` },
            { inlineData: { mimeType: baseImage.type, data: base64 } }
        ];

        for (const candidate of candidates) {
            const candidateBase64 = await blobToBase64(candidate.blob);
            parts.push({ text: `Image ID: ${candidate.id}` });
            parts.push({ inlineData: { mimeType: candidate.blob.type, data: candidateBase64 } });
        }
        
        const response = await ai.models.generateContent({
            model: visionModel,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        similar_groups: {
                            type: Type.ARRAY,
                            items: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            }
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result.similar_groups || [];

    } catch (error) {
        console.error("Error finding similar images:", error);
        throw new Error("Failed to analyze images for similarity.");
    }
}