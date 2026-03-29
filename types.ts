
export enum ViewMode {
  Landing = 'landing',
  Onboarding = 'onboarding',
  Missions = 'missions',
  ActiveMission = 'active-mission',
  TeacherDashboard = 'teacher-dashboard',
  Progress = 'progress',
  StudentDemo = 'student-demo',
  Account = 'account'
}

export enum UserRole {
  Student = 'student',
  Teacher = 'teacher'
}

export interface UserProfile {
  uid: string;
  name: string;
  role: UserRole;
  grade?: string;
  classCode?: string;
  avatarSeed: string;
  xp: number;
  streak: number;
  homeLanguage?: string;
  createdAt?: string;
}

export type Language = string;

export const Languages = {
  English: 'English',
  Spanish: 'Spanish',
  Chinese: 'Chinese',
  Arabic: 'Arabic',
  Vietnamese: 'Vietnamese',
  French: 'French',
  Hindi: 'Hindi',
  Bengali: 'Bengali',
  Portuguese: 'Portuguese',
  Russian: 'Russian',
  Japanese: 'Japanese',
  Punjabi: 'Punjabi',
  German: 'German',
  Javanese: 'Javanese',
  Wu: 'Wu',
  Malay: 'Malay',
  Telugu: 'Telugu',
  Korean: 'Korean',
  Marathi: 'Marathi',
  Tamil: 'Tamil',
  Urdu: 'Urdu',
  Turkish: 'Turkish',
  Italian: 'Italian',
  Thai: 'Thai',
  Gujarati: 'Gujarati',
  Persian: 'Persian',
  Polish: 'Polish',
  Pashto: 'Pashto',
  Kannada: 'Kannada',
  Malayalam: 'Malayalam',
  Sundanese: 'Sundanese',
  Hausa: 'Hausa',
  Oromo: 'Oromo',
  Burmese: 'Burmese',
  Oriya: 'Oriya',
  Armenian: 'Armenian',
  Ukrainian: 'Ukrainian',
  Yoruba: 'Yoruba',
  Maithili: 'Maithili',
  Uzbek: 'Uzbek',
  Sindhi: 'Sindhi',
  Amharic: 'Amharic',
  Fula: 'Fula',
  Romanian: 'Romanian',
  Azerbaijani: 'Azerbaijani',
  Dutch: 'Dutch',
  Kurdish: 'Kurdish',
  SerboCroatian: 'Serbo-Croatian',
  Malagasy: 'Malagasy',
  Nepali: 'Nepali',
  Sinhalese: 'Sinhalese',
  Chittagonian: 'Chittagonian',
  Zhuang: 'Zhuang',
  Khmer: 'Khmer',
  Turkmen: 'Turkmen',
  Assamese: 'Assamese',
  Madurese: 'Madurese',
  Somali: 'Somali',
  Marwari: 'Marwari',
  Magahi: 'Magahi',
  Haryanvi: 'Haryanvi',
  Hungarian: 'Hungarian',
  Chhattisgarhi: 'Chhattisgarhi',
  Greek: 'Greek',
  Chewa: 'Chewa',
  Deccan: 'Deccan',
  Akan: 'Akan',
  Kazakh: 'Kazakh',
  Minang: 'Minang',
  Sylheti: 'Sylheti',
  Zulu: 'Zulu',
  Czech: 'Czech',
  Kinyarwanda: 'Kinyarwanda',
  Dhundhari: 'Dhundhari',
  HaitianCreole: 'Haitian Creole',
  Ilocano: 'Ilocano',
  Quechua: 'Quechua',
  Kirundi: 'Kirundi',
  Swedish: 'Swedish',
  Hmong: 'Hmong',
  Shona: 'Shona',
  Uyghur: 'Uyghur',
  Hiligaynon: 'Hiligaynon',
  Mossi: 'Mossi',
  Xhosa: 'Xhosa',
  Belarusian: 'Belarusian',
  Balochi: 'Balochi',
  Konkani: 'Konkani'
};

export enum Subject {
  Science = 'Science',
  Math = 'Math',
  Reading = 'Reading',
  SocialStudies = 'Social Studies',
  History = 'History',
  Art = 'Art',
  Other = 'Other'
}

export interface Mission {
  id: string;
  title: string;
  subject: Subject;
  description: string;
  characterId: string;
  xp: number;
  skill: string;
  content: {
    prompt: string;
    vocabulary: VocabularyWord[];
    visualHint?: string;
  };
}

export interface ExtractedVocabulary {
  english_word: string;
  phonetic: string;
  simple_definition: string;
  native_translation: string;
  definition_translation: string;
  example: string;
}

export interface ExtractedCurriculum {
  subject_area: 'Math' | 'Science' | 'Reading' | 'History' | 'Art' | 'Other';
  mission_title: string;
  extracted_vocabulary: ExtractedVocabulary[];
  decoded_instructions: string[];
  confidence_score: number;
}

export interface FeedbackComment {
  type: 'strength' | 'improvement';
  text: string;
}

export interface AIParsedFeedback {
  comments: FeedbackComment[];
  overallLevel: number;
  suggestion: string;
  translation?: string;
}

export enum EmotionState {
  Calm = 'calm',
  Celebrate = 'celebrate',
  Encourage = 'encourage',
  Curious = 'curious'
}

export enum NextAction {
  WaitForInput = 'wait_for_input',
  ShowReward = 'show_reward',
  AdvanceLevel = 'advance_level',
  RetryQuestion = 'retry_question'
}

export interface VocabularyWord {
  term: string;
  phonetic: string;
  definition: string;
  translation: string;
  definitionTranslation?: string;
  example: string;
}

export interface TutorResponse {
  dialogue_audio: string;
  ui_text: string;
  native_language_translation: string | null;
  emotion_state: EmotionState;
  next_action: NextAction;
  vocabulary?: VocabularyWord[];
}

export interface PronunciationFeedback {
  is_success: boolean;
  praise: string;
  syllable_breakdown?: string;
  advice?: string;
  ui_text: string;
}

export interface SpeakingFeedback {
  original_transcript: string;
  improved_version: string;
  explanation: string;
  native_explanation?: string;
  praise: string;
}
