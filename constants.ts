
import { Mission, Subject } from './types';

export const COLORS = {
  primary: '#0D9488', // Teal 600
  secondary: '#F59E0B', // Amber 500
  science: '#0EA5E9', // Sky 500
  math: '#8B5CF6', // Violet 500
  reading: '#F43F5E', // Rose 500
  social: '#10B981', // Emerald 500
  'social studies': '#10B981', // Emerald 500
  history: '#F97316', // Orange 500
  art: '#EC4899', // Pink 500
};

export const CHARACTERS = [
  { 
    id: 'guide1', 
    name: 'Alex', 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex&mouth=smile01', 
    subject: 'Science',
    personality: 'Curious and energetic! Alex loves exploring the world and asking "Why?".'
  },
  { 
    id: 'guide2', 
    name: 'Lina', 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lina', 
    subject: 'Math',
    personality: 'Patient and logical. Lina thinks numbers are like puzzles waiting to be solved.'
  },
  { 
    id: 'guide3', 
    name: 'Yumi', 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Yumi', 
    subject: 'Reading',
    personality: 'Creative and imaginative. Yumi believes every book is a portal to a new adventure.'
  },
  { 
    id: 'guide4', 
    name: 'Kojo', 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kojo', 
    subject: 'Social Studies',
    personality: 'Kind and community-focused. Kojo loves learning about different cultures and history.'
  },
  { 
    id: 'guide5', 
    name: 'Zoe', 
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Zoe', 
    subject: 'Art',
    personality: 'Bold and expressive. Zoe sees colors and patterns everywhere in the world.'
  },
];

export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'The Water Cycle',
    subject: Subject.Science,
    description: 'Help Alex understand how rain is made!',
    characterId: 'guide1',
    xp: 100,
    skill: 'Vocabulary',
    content: {
      prompt: 'Explain how water goes from the ocean to the sky.',
      vocabulary: [
        { term: 'evaporation', phonetic: '/ɪˌvæpəˈreɪʃən/', definition: 'Water turning into vapor', translation: 'evaporación', example: 'The sun causes evaporation.' },
        { term: 'condensation', phonetic: '/ˌkɒndɛnˈseɪʃən/', definition: 'Vapor turning into water', translation: 'condensación', example: 'Clouds are formed by condensation.' },
        { term: 'precipitation', phonetic: '/prɪˌsɪpɪˈteɪʃən/', definition: 'Rain, snow, or hail', translation: 'precipitación', example: 'Rain is a form of precipitation.' }
      ],
      visualHint: 'https://picsum.photos/seed/rain-clouds/400/400'
    }
  },
  {
    id: 'm2',
    title: 'Fraction Fair',
    subject: Subject.Math,
    description: 'Lina is sharing a pizza. Can you help her with fractions?',
    characterId: 'guide2',
    xp: 150,
    skill: 'Logic',
    content: {
      prompt: 'If Lina has 8 slices of pizza and gives 2 to Alex, what fraction is left?',
      vocabulary: [
        { term: 'numerator', phonetic: '/ˈnjuːməreɪtə/', definition: 'The top number in a fraction', translation: 'numerador', example: 'In 1/2, 1 is the numerator.' },
        { term: 'denominator', phonetic: '/dɪˈnɒmɪneɪtə/', definition: 'The bottom number in a fraction', translation: 'denominador', example: 'In 1/2, 2 is the denominator.' },
        { term: 'equivalent', phonetic: '/ɪˈkwɪvələnt/', definition: 'Equal in value', translation: 'equivalente', example: '2/4 is equivalent to 1/2.' }
      ],
      visualHint: 'https://picsum.photos/seed/pizza-slice/400/400'
    }
  },
  {
    id: 'm3',
    title: 'Character Detective',
    subject: Subject.Reading,
    description: 'Yumi is reading a story. Who is the main character?',
    characterId: 'guide3',
    xp: 120,
    skill: 'Analysis',
    content: {
      prompt: 'Describe the main character of your favorite book.',
      vocabulary: [
        { term: 'protagonist', phonetic: '/prəˈtæɡənɪst/', definition: 'The main character', translation: 'protagonista', example: 'Harry Potter is the protagonist.' },
        { term: 'antagonist', phonetic: '/ænˈtæɡənɪst/', definition: 'The character who opposes the main character', translation: 'antagonista', example: 'Voldemort is the antagonist.' },
        { term: 'motivation', phonetic: '/ˌməʊtɪˈveɪʃən/', definition: 'The reason for a character\'s actions', translation: 'motivación', example: 'His motivation was to save his friends.' }
      ],
      visualHint: 'https://picsum.photos/seed/detective-magnifier/400/400'
    }
  }
];
