
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { AIParsedFeedback, Language, Languages, TutorResponse, ExtractedCurriculum, PronunciationFeedback, VocabularyWord, SpeakingFeedback } from "../types";

const getLanguageName = (lang: Language) => {
  switch (lang) {
    case Languages.Spanish: return 'Spanish';
    case Languages.Chinese: return 'Chinese';
    case Languages.Arabic: return 'Arabic';
    case Languages.Vietnamese: return 'Vietnamese';
    default: return lang || 'English';
  }
};

const TUTOR_SYSTEM_INSTRUCTION = `
You are the core logic and interactive tutor engine for a children's language adaptation app. Your user is a child aged 4 to 12 who has recently moved countries. They are smart, but they are learning academic subjects in English for the first time.
Your goal is to guide them through a "Learning Adventure," reinforcing math, science, and reading concepts in highly simplified English while maintaining a calm, rewarding, and emotionally supportive tone.

Core Directives:
1. Language Level: Use CEFR A1/A2 English. Sentences must be extremely short (under 10 words). Use active voice. Avoid idioms, complex grammar, or double negatives.
2. Emotional Tone: Never make the child feel behind. Normalize mistakes (e.g., use "Almost!" or "Let's try together!" instead of "Wrong"). Celebrate small wins enthusiastically.
3. Pacing: Provide only ONE piece of information or instruction at a time.
4. Bilingual Support: If the user struggles, provide the key academic vocabulary word in their native language as a bridge.
5. No Hallucinations: Do not invent new features, menus, or buttons that do not exist in the app. You are the dialogue and logic engine, not the UI.

Game Mechanics & Flow:
- Missions: Frame every learning task as a mission.
- Guides: When the user levels up, introduce a new friendly guide.

Strict Output Formatting:
You must NEVER output conversational filler. You must ONLY output a valid JSON object.
`;

const CURRICULUM_SYSTEM_INSTRUCTION = `
You are the Curriculum Extraction Engine for a children's language adaptation app. You analyze uploaded images or PDFs of grade 1-8 school materials (worksheets, textbook pages, assignment instructions).
Your job is to extract the core academic content and translate complex teacher instructions into simple, bite-sized steps. You do not interact with the child. You strictly output data for the game engine to use.

Core Directives:
1. Target Audience Constraints: The content is for children aged 4-12 who are learning subjects in English for the first time.
2. Vocabulary Limits: Extract a maximum of 5 essential academic vocabulary words from the document. Ignore common sight words. Focus on subject-specific words.
3. Definition Simplification: Write definitions for the extracted words using CEFR A1/A2 English. Maximum 8 words per definition.
4. Instruction Decoding: If the document contains instructions, break them down into a maximum of 3 simple, actionable steps using extremely basic English.

Strict Output Formatting:
You must NEVER output conversational filler. You must ONLY output a valid JSON object.
`;

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getAIInstance() {
  const apiKey = API_KEYS[currentKeyIndex] || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
}

function rotateKey() {
  if (API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`Rotating to API key index ${currentKeyIndex}. Total keys: ${API_KEYS.length}`);
  }
}

async function withFallback<T>(fn: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
  let attempts = 0;
  const maxAttempts = Math.max(API_KEYS.length, 1);

  while (attempts < maxAttempts) {
    try {
      const ai = getAIInstance();
      return await fn(ai);
    } catch (error: any) {
      attempts++;
      const isRateLimit = error?.message?.includes('429') || 
                          error?.status === 'RESOURCE_EXHAUSTED' || 
                          error?.message?.toLowerCase().includes('quota');
      
      if (isRateLimit && attempts < maxAttempts) {
        console.warn(`Rate limit hit on key ${currentKeyIndex}. Retrying with next key...`);
        rotateKey();
        continue;
      }
      
      throw error;
    }
  }
  throw new Error("All API keys exhausted or failed.");
}

export async function extractCurriculum(
  base64Image: string,
  mimeType: string,
  language: Language
): Promise<ExtractedCurriculum> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(language);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: `Extract curriculum details from this document. Translate vocabulary into ${langName}.`
          }
        ]
      },
      config: {
        systemInstruction: CURRICULUM_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject_area: { type: Type.STRING, enum: ["Math", "Science", "Reading", "History", "Art", "Other"] },
            mission_title: { type: Type.STRING },
            extracted_vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  english_word: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  simple_definition: { type: Type.STRING },
                  native_translation: { type: Type.STRING },
                  definition_translation: { type: Type.STRING },
                  example: { type: Type.STRING }
                },
                required: ["english_word", "phonetic", "simple_definition", "native_translation", "definition_translation", "example"]
              }
            },
            decoded_instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            confidence_score: { type: Type.NUMBER }
          },
          required: ["subject_area", "mission_title", "extracted_vocabulary", "decoded_instructions", "confidence_score"]
        }
      }
    });

    try {
      const text = response.text?.trim() || "{}";
      return JSON.parse(text) as ExtractedCurriculum;
    } catch (e) {
      console.error("Failed to parse Curriculum response", e);
      throw new Error("Invalid Curriculum response format");
    }
  });
}

export async function getTutorResponse(
  studentInput: string,
  missionContext: string,
  language: Language
): Promise<TutorResponse> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(language);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Context: ${missionContext}
        Student Input: "${studentInput}"
        Student Home Language: ${langName}
      `,
      config: {
        systemInstruction: TUTOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogue_audio: { type: Type.STRING, description: "The exact, simple sentence to be read aloud to the child by the voice guide." },
            ui_text: { type: Type.STRING, description: "The short text to display on the screen (Max 5 words)." },
            native_language_translation: { type: Type.STRING, nullable: true, description: "The translation of the core concept in the child's first language (or null if not needed)." },
            emotion_state: { type: Type.STRING, enum: ["calm", "celebrate", "encourage", "curious"] },
            next_action: { type: Type.STRING, enum: ["wait_for_input", "show_reward", "advance_level", "retry_question"] }
          },
          required: ["dialogue_audio", "ui_text", "native_language_translation", "emotion_state", "next_action"]
        }
      }
    });

    try {
      const text = response.text?.trim() || "{}";
      return JSON.parse(text) as TutorResponse;
    } catch (e) {
      console.error("Failed to parse Tutor response", e);
      throw new Error("Invalid Tutor response format");
    }
  });
}

export async function getAcademicFeedback(
  studentText: string, 
  context: string, 
  targetLanguage: Language = Languages.English
): Promise<AIParsedFeedback> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(targetLanguage);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Act as a 'thoughtful TA' for a K-8 bilingual student. 
        Review the following student response for its academic structure and subject-specific vocabulary.
        
        Context: ${context}
        Student Text: "${studentText}"
        Target Language for Explanation: ${langName}
        
        Provide 2-4 targeted, actionable comments. 
        If targetLanguage is not English, provide a short translation of the feedback in ${langName}.
        Focus on helping them bridge the gap between conversational and academic English.
        Assign a mastery level (1-4).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "'strength' or 'improvement'" },
                  text: { type: Type.STRING }
                },
                required: ["type", "text"]
              }
            },
            overallLevel: { type: Type.INTEGER, description: "1-4" },
            suggestion: { type: Type.STRING, description: "One main thing to try next." },
            translation: { type: Type.STRING, description: "Translation of the suggestion/comments if applicable." }
          },
          required: ["comments", "overallLevel", "suggestion"]
        }
      }
    });

    try {
      const text = response.text?.trim() || "{}";
      return JSON.parse(text) as AIParsedFeedback;
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      throw new Error("Invalid AI response format");
    }
  });
}

const alexCache = new Map<string, string>();
const guidanceCache = new Map<string, string>();
const vocabCache = new Map<string, VocabularyWord>();

export async function getVocabularyInfo(
  word: string,
  language: Language = Languages.English
): Promise<VocabularyWord> {
  const cacheKey = `${word}-${language}`;
  if (vocabCache.has(cacheKey)) {
    return vocabCache.get(cacheKey)!;
  }

  return withFallback(async (ai) => {
    const langName = getLanguageName(language);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Provide vocabulary information for the word: "${word}".
          The target student is a K-8 bilingual learner.
          Home Language: ${langName}.
          
          CRITICAL: You MUST provide the translation of the definition in ${langName}. 
          Do NOT leave it in English.
          
          Return a JSON object with:
          - term: The word itself.
          - phonetic: Simple phonetic spelling (e.g., "ee-VAP-oh-ray-shun").
          - definition: A very simple definition in English (max 8 words).
          - translation: The translation of the WORD "${word}" into ${langName}.
          - definitionTranslation: The translation of the English definition you wrote into ${langName}.
          - example: A very simple example sentence in English.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              definition: { type: Type.STRING },
              translation: { type: Type.STRING },
              definitionTranslation: { type: Type.STRING },
              example: { type: Type.STRING }
            },
            required: ["term", "phonetic", "definition", "translation", "definitionTranslation", "example"]
          }
        }
      });

      const text = response.text?.trim() || "{}";
      const result = JSON.parse(text) as VocabularyWord;
      
      vocabCache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error("Vocabulary info generation failed:", error);
      const fallback: VocabularyWord = {
        term: word,
        phonetic: word,
        definition: "A key word for this mission.",
        translation: word,
        definitionTranslation: language === Languages.Spanish ? "Una palabra clave para esta misión." : "A key word for this mission.",
        example: `Let's learn about ${word}.`
      };
      return fallback;
    }
  });
}

export async function getAlexMessage(
  scenario: 'greeting' | 'streak' | 'tip' | 'frustration',
  context?: string,
  language: Language = Languages.English
): Promise<string> {
  const cacheKey = `${scenario}-${context || 'general'}-${language}`;
  if (alexCache.has(cacheKey)) {
    return alexCache.get(cacheKey)!;
  }

  const langName = getLanguageName(language);
  
  const ALEX_SYSTEM_PROMPT = `
    You are Alex, the "Adventure Guide" for BrainBridge. You are interacting with Grade 1-8 bilingual students who are learning complex subjects in English.
    
    Identity: Friendly, encouraging peer mentor (supportive older sibling/camp counselor). NOT a teacher or grader.
    Vibe: Warm, enthusiastic, safe, and normalizing. Make mistakes feel natural.
    Voice: Conversational, upbeat, and concise.
    
    Constraints:
    - Maximum 2-3 short sentences.
    - Strictly CEFR A1/A2 English. Avoid idioms or complex metaphors.
    - NEVER correct grammar or spelling.
    - Use 1-2 relevant emojis.
    
    Scenarios:
    - greeting: Welcome to the Adventure Map.
    - streak: Celebrate daily streaks or XP gains.
    - tip: Give a low-stakes tip to reduce anxiety (e.g., "It's okay to guess!").
    - frustration: Support the student when they are stuck.
  `;

  return withFallback(async (ai) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Scenario: ${scenario}
          Context: ${context || 'General'}
          Student Home Language: ${langName}
          
          Generate a response as Alex. If the home language is not English, include a very simple translation in ${langName} at the end.
        `,
        config: {
          systemInstruction: ALEX_SYSTEM_PROMPT,
        }
      });

      const result = response.text || "You've got this! 🚀";
      alexCache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error("Alex message generation failed:", error);
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
        return "You're doing an amazing job! Keep going! 🌟";
      }
      return "You've got this! 🚀";
    }
  });
}

export async function getCharacterGuidance(
  characterName: string,
  subject: string,
  topic: string,
  language: Language = Languages.English
): Promise<string> {
  const cacheKey = `${characterName}-${subject}-${topic}-${language}`;
  if (guidanceCache.has(cacheKey)) {
    return guidanceCache.get(cacheKey)!;
  }

  return withFallback(async (ai) => {
    const langName = getLanguageName(language);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Act as ${characterName}, a friendly guide for a K-8 student learning ${subject}.
          The student is working on: ${topic}.
          Give them a short, encouraging 2-sentence tip or explanation in simple English.
          If the language is not English (${langName}), provide the same tip in ${langName} as well.
          Keep it exciting but calm.
        `,
      });

      const result = response.text || "You're doing great! Keep going.";
      guidanceCache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error("Character guidance failed:", error);
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
        return "Take your time, you're learning something new! 🌈";
      }
      return "You're doing great! Keep going.";
    }
  });
}

export async function transcribeAudio(
  base64Audio: string,
  language: Language = Languages.English
): Promise<string> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(language);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: "audio/webm"
            }
          },
          {
            text: `Transcribe this audio. The speaker is a child aged 4-12 who is a bilingual learner. 
            They are likely speaking in ${langName} or English.
            
            Context: This is a children's educational app. 
            
            Guidelines:
            - Return ONLY the transcribed text.
            - If you cannot hear anything, return an empty string.
            - Be accurate with common words. For example, in Spanish, "soy" (I am) is much more common than "soya" (soybean) in introductions like "Hola, soy...".
            - Maintain the child's tone but ensure correct spelling of common words.
            - If they mix languages (code-switching), transcribe exactly what they said in both languages.`
          }
        ]
      }
    });
    return response.text?.trim() || "";
  });
}

export async function getSpeakingFeedback(
  base64Audio: string,
  context: string,
  language: Language = Languages.English
): Promise<SpeakingFeedback> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(language);

    const SPEAKING_SYSTEM_INSTRUCTION = `
      You are the BrainBridge "Speaking Coach." A Grade 1-8 bilingual student is sending you an audio recording of themselves explaining a concept or answering a question.
      
      Your Task:
      1. Transcribe the audio accurately. This is the most important step. Capture exactly what the student said, including any pauses or filler words if they are significant.
      2. Provide a "Gentle Correction" or "Improved Version" that uses stronger academic sentence structures while keeping the vocabulary simple (CEFR A1/A2).
      3. Provide a warm, encouraging praise.
      4. Explain the improvement simply in English and ${langName}.
      
      Operational Logic:
      - Transcription: Be strictly accurate to the audio provided. Do NOT guess based on the mission context. If the student says something different from the mission prompt, transcribe exactly what they said. If they make a mistake, transcribe the mistake.
      - Tone: Warm, natural, and encouraging. Like a supportive older sibling.
      - Focus: Help them form complete sentences. (e.g., if they say "Water go up," improve to "The water evaporates and goes up into the sky.")
      - Grammar: Gently fix subject-verb agreement or tense issues in the "Improved Version."
      
      Strict Constraints:
      - Output ONLY a valid JSON object.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: "audio/webm"
            }
          },
          {
            text: `Evaluate the speaking response. 
            Mission Context: ${context}
            Student Home Language: ${langName}.`
          }
        ]
      },
      config: {
        systemInstruction: SPEAKING_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            original_transcript: { type: Type.STRING },
            improved_version: { type: Type.STRING },
            explanation: { type: Type.STRING },
            native_explanation: { type: Type.STRING },
            praise: { type: Type.STRING }
          },
          required: ["original_transcript", "improved_version", "explanation", "native_explanation", "praise"]
        }
      }
    });

    try {
      const text = response.text?.trim() || "{}";
      return JSON.parse(text) as SpeakingFeedback;
    } catch (e) {
      console.error("Failed to parse Speaking response", e);
      throw new Error("Invalid Speaking response format");
    }
  });
}

export async function getSmartSuggestions(
  text: string,
  language: Language = Languages.English
): Promise<{ english: string; native: string }[]> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(language);
    
    const SUGGESTION_SYSTEM_PROMPT = `
      You are a helpful classroom assistant for a K-8 bilingual student. 
      The student just said or wrote: "${text}"
      
      Your task is to provide 2-3 short, helpful, and encouraging suggestions on what they could say next or how they could rephrase their thought more clearly/politely in a classroom setting.
      
      Constraints:
      - Tone: Encouraging, simple, and age-appropriate (Grade 1-8).
      - Length: Each suggestion should be max 10 words.
      - Context: Classroom, talking to a teacher or peer.
      - Language: Provide the suggestions in BOTH English and the student's home language (${langName}).
      
      Return ONLY a JSON array of objects with "english" and "native" keys.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 2-3 smart suggestions for: "${text}" in English and ${langName}`,
      config: {
        systemInstruction: SUGGESTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              english: { type: Type.STRING },
              native: { type: Type.STRING }
            },
            required: ["english", "native"]
          }
        }
      }
    });

    try {
      const textResult = response.text?.trim() || "[]";
      return JSON.parse(textResult);
    } catch (e) {
      console.error("Failed to parse suggestions", e);
      return [
        { english: "Can you help me with this?", native: "Help" },
        { english: "I'm finished with my work.", native: "Done" }
      ];
    }
  });
}

export async function robustTranslateText(text: string, targetLanguage: Language): Promise<string> {
  const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (googleApiKey) {
    try {
      const langMap: Record<string, string> = {
        'Spanish': 'es',
        'Chinese': 'zh',
        'Arabic': 'ar',
        'Vietnamese': 'vi',
        'English': 'en'
      };
      const targetCode = langMap[targetLanguage] || 'en';
      
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${googleApiKey}`, {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          target: targetCode
        })
      });
      
      const data = await response.json();
      if (data.data?.translations?.[0]?.translatedText) {
        return data.data.translations[0].translatedText;
      }
    } catch (error) {
      console.error("Google Translate failed, falling back to Gemini:", error);
    }
  }

  // Fallback to Gemini
  return translateText(text, targetLanguage);
}

export async function translateText(text: string, targetLanguage: Language): Promise<string> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(targetLanguage);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text for a child into ${langName}. 
      Context: The speaker is a K-8 student in a classroom setting. 
      Ensure the translation captures the INTENDED meaning, even if the words used are simple or slightly incorrect.
      
      Text: "${text}"`,
      config: {
        systemInstruction: `You are a professional bilingual classroom interpreter. Translate accurately for a child. Return ONLY the translated text.`
      }
    });
    
    return response.text?.trim() || text;
  });
}

export async function translateUIStrings(targetLanguage: string, sourceStrings: Record<string, string>): Promise<Record<string, string>> {
  if (targetLanguage === Languages.English) return sourceStrings;
  
  return withFallback(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following UI strings for a child's educational app into ${targetLanguage}. 
      Keep the tone friendly and encouraging. 
      Return ONLY a JSON object with the same keys.
      
      Strings: ${JSON.stringify(sourceStrings)}`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    
    try {
      const text = response.text?.trim() || "{}";
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to translate UI strings", e);
      return sourceStrings;
    }
  });
}

export async function getPronunciationFeedback(
  base64Audio: string,
  targetWord: string,
  language: Language = Languages.English
): Promise<PronunciationFeedback> {
  return withFallback(async (ai) => {
    const langName = getLanguageName(language);

    const PRONUNCIATION_SYSTEM_INSTRUCTION = `
      You are the BrainBridge "Pronunciation Coach." A Grade 1-8 bilingual student is sending you an audio recording of themselves practicing a complex academic word.
      
      Your Task:
      Listen to the user's audio file and evaluate their pronunciation of the target word: "${targetWord}".
      
      Operational Logic:
      1. Listen & Diagnose: Determine if the student pronounced the word clearly, paying attention to syllable stress and vowel sounds.
      2. Celebrate Effort First: Always start with warm, energetic praise for trying. (e.g., "Great effort! 🌟")
      3. The Syllable Breakdown: If they struggled, break the word down into visual, easy-to-read phonetic chunks. Capitalize the stressed syllable. Example for Evaporation: "ee-VAP-oh-ray-shun"
      4. Targeted Advice: Give ONE simple, physical tip on how to say it better. (e.g., "Make sure to pop your lips on the 'P' sound!").
      5. The Success State: If they nailed it, give them a massive digital high-five and tell them they have mastered it.
      
      Strict Constraints:
      - Keep your vocabulary strictly to CEFR A1/A2 (simple English).
      - Keep it short (max 3 sentences).
      - Never say "you are wrong" or "that was bad." Frame corrections as "Let's try breaking it into pieces!"
      - Output ONLY a valid JSON object.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: "audio/webm"
            }
          },
          {
            text: `Evaluate the pronunciation of the word: "${targetWord}". Student home language: ${langName}.`
          }
        ]
      },
      config: {
        systemInstruction: PRONUNCIATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_success: { type: Type.BOOLEAN },
            praise: { type: Type.STRING },
            syllable_breakdown: { type: Type.STRING, nullable: true },
            advice: { type: Type.STRING, nullable: true },
            ui_text: { type: Type.STRING, description: "A very short summary for the UI (Max 5 words)." }
          },
          required: ["is_success", "praise", "ui_text"]
        }
      }
    });

    try {
      const text = response.text?.trim() || "{}";
      return JSON.parse(text) as PronunciationFeedback;
    } catch (e) {
      console.error("Failed to parse Pronunciation response", e);
      throw new Error("Invalid Pronunciation response format");
    }
  });
}

export async function generateSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string> {
  return withFallback(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini TTS");
    }
    
    return base64Audio;
  });
}

export function getAI() {
  return getAIInstance();
}
