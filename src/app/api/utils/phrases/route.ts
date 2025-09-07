import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Travel phrases request schema
const PhrasesRequestSchema = z.object({
  language: z.string().min(1, "Language is required"),
  category: z.enum(['basic', 'food', 'transportation', 'emergency', 'shopping', 'directions']).optional()
});

// Common travel phrases database
const TRAVEL_PHRASES: { [key: string]: { [key: string]: { [key: string]: string } } } = {
  'Spanish': {
    'basic': {
      'Hello': 'Hola',
      'Goodbye': 'Adiós',
      'Please': 'Por favor',
      'Thank you': 'Gracias',
      'You\'re welcome': 'De nada',
      'Excuse me': 'Disculpe',
      'Sorry': 'Lo siento',
      'Yes': 'Sí',
      'No': 'No',
      'I don\'t understand': 'No entiendo',
      'Do you speak English?': '¿Habla inglés?',
      'My name is...': 'Me llamo...',
      'Nice to meet you': 'Mucho gusto'
    },
    'food': {
      'I\'m hungry': 'Tengo hambre',
      'I\'m thirsty': 'Tengo sed',
      'The bill, please': 'La cuenta, por favor',
      'Delicious': 'Delicioso',
      'I\'m allergic to...': 'Soy alérgico a...',
      'Vegetarian': 'Vegetariano',
      'Water': 'Agua',
      'Coffee': 'Café',
      'Beer': 'Cerveza',
      'Wine': 'Vino',
      'Restaurant': 'Restaurante',
      'Menu': 'Menú'
    },
    'transportation': {
      'Where is the bus stop?': '¿Dónde está la parada de autobús?',
      'How much is the ticket?': '¿Cuánto cuesta el billete?',
      'I need a taxi': 'Necesito un taxi',
      'To the airport': 'Al aeropuerto',
      'To the hotel': 'Al hotel',
      'Train station': 'Estación de tren',
      'Subway': 'Metro',
      'Bus': 'Autobús',
      'Car': 'Coche'
    },
    'emergency': {
      'Help': 'Ayuda',
      'Emergency': 'Emergencia',
      'Police': 'Policía',
      'Hospital': 'Hospital',
      'Doctor': 'Médico',
      'I\'m sick': 'Estoy enfermo',
      'It hurts here': 'Me duele aquí',
      'Call an ambulance': 'Llame una ambulancia'
    }
  },
  'French': {
    'basic': {
      'Hello': 'Bonjour',
      'Goodbye': 'Au revoir',
      'Please': 'S\'il vous plaît',
      'Thank you': 'Merci',
      'You\'re welcome': 'De rien',
      'Excuse me': 'Excusez-moi',
      'Sorry': 'Désolé',
      'Yes': 'Oui',
      'No': 'Non',
      'I don\'t understand': 'Je ne comprends pas',
      'Do you speak English?': 'Parlez-vous anglais?',
      'My name is...': 'Je m\'appelle...',
      'Nice to meet you': 'Enchanté'
    },
    'food': {
      'I\'m hungry': 'J\'ai faim',
      'I\'m thirsty': 'J\'ai soif',
      'The bill, please': 'L\'addition, s\'il vous plaît',
      'Delicious': 'Délicieux',
      'I\'m allergic to...': 'Je suis allergique à...',
      'Vegetarian': 'Végétarien',
      'Water': 'Eau',
      'Coffee': 'Café',
      'Beer': 'Bière',
      'Wine': 'Vin',
      'Restaurant': 'Restaurant',
      'Menu': 'Menu'
    }
  },
  'German': {
    'basic': {
      'Hello': 'Hallo',
      'Goodbye': 'Auf Wiedersehen',
      'Please': 'Bitte',
      'Thank you': 'Danke',
      'You\'re welcome': 'Bitte schön',
      'Excuse me': 'Entschuldigung',
      'Sorry': 'Entschuldigung',
      'Yes': 'Ja',
      'No': 'Nein',
      'I don\'t understand': 'Ich verstehe nicht',
      'Do you speak English?': 'Sprechen Sie Englisch?',
      'My name is...': 'Ich heiße...',
      'Nice to meet you': 'Freut mich'
    }
  },
  'Italian': {
    'basic': {
      'Hello': 'Ciao',
      'Goodbye': 'Arrivederci',
      'Please': 'Per favore',
      'Thank you': 'Grazie',
      'You\'re welcome': 'Prego',
      'Excuse me': 'Scusi',
      'Sorry': 'Mi dispiace',
      'Yes': 'Sì',
      'No': 'No',
      'I don\'t understand': 'Non capisco',
      'Do you speak English?': 'Parla inglese?',
      'My name is...': 'Mi chiamo...',
      'Nice to meet you': 'Piacere'
    }
  },
  'Portuguese': {
    'basic': {
      'Hello': 'Olá',
      'Goodbye': 'Adeus',
      'Please': 'Por favor',
      'Thank you': 'Obrigado',
      'You\'re welcome': 'De nada',
      'Excuse me': 'Desculpe',
      'Sorry': 'Desculpe',
      'Yes': 'Sim',
      'No': 'Não',
      'I don\'t understand': 'Não entendo',
      'Do you speak English?': 'Fala inglês?',
      'My name is...': 'Me chamo...',
      'Nice to meet you': 'Prazer'
    }
  },
  'Japanese': {
    'basic': {
      'Hello': 'こんにちは (Konnichiwa)',
      'Goodbye': 'さようなら (Sayonara)',
      'Please': 'お願いします (Onegaishimasu)',
      'Thank you': 'ありがとう (Arigatou)',
      'You\'re welcome': 'どういたしまして (Dou itashimashite)',
      'Excuse me': 'すみません (Sumimasen)',
      'Sorry': 'ごめんなさい (Gomen nasai)',
      'Yes': 'はい (Hai)',
      'No': 'いいえ (Iie)',
      'I don\'t understand': 'わかりません (Wakarimasen)',
      'Do you speak English?': '英語を話しますか？(Eigo wo hanashimasu ka?)',
      'My name is...': '私の名前は...です (Watashi no namae wa... desu)',
      'Nice to meet you': 'はじめまして (Hajimemashite)'
    }
  },
  'Chinese': {
    'basic': {
      'Hello': '你好 (Nǐ hǎo)',
      'Goodbye': '再见 (Zài jiàn)',
      'Please': '请 (Qǐng)',
      'Thank you': '谢谢 (Xiè xiè)',
      'You\'re welcome': '不客气 (Bù kè qì)',
      'Excuse me': '对不起 (Duì bù qǐ)',
      'Sorry': '抱歉 (Bào qiàn)',
      'Yes': '是 (Shì)',
      'No': '不 (Bù)',
      'I don\'t understand': '我不明白 (Wǒ bù míng bái)',
      'Do you speak English?': '你会说英语吗？(Nǐ huì shuō yīng yǔ ma?)',
      'My name is...': '我的名字是... (Wǒ de míng zì shì...)',
      'Nice to meet you': '很高兴认识你 (Hěn gāo xìng rèn shí nǐ)'
    }
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language');
    const category = searchParams.get('category') as any;
    
    if (!language) {
      return NextResponse.json({ ok: false, error: 'Language parameter is required' }, { status: 400 });
    }

    const validatedData = PhrasesRequestSchema.parse({ language, category });
    
    const languageData = TRAVEL_PHRASES[validatedData.language];
    if (!languageData) {
      return NextResponse.json({ 
        ok: false, 
        error: `Language '${validatedData.language}' not supported` 
      }, { status: 400 });
    }

    let phrases;
    if (validatedData.category && languageData[validatedData.category]) {
      phrases = languageData[validatedData.category];
    } else {
      // Return all categories if no specific category requested
      phrases = languageData;
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        language: validatedData.language,
        category: validatedData.category || 'all',
        phrases,
        totalPhrases: Object.keys(phrases).length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Phrases API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch phrases' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = PhrasesRequestSchema.parse(body);
    
    const languageData = TRAVEL_PHRASES[validatedData.language];
    if (!languageData) {
      return NextResponse.json({ 
        ok: false, 
        error: `Language '${validatedData.language}' not supported` 
      }, { status: 400 });
    }

    let phrases;
    if (validatedData.category && languageData[validatedData.category]) {
      phrases = languageData[validatedData.category];
    } else {
      phrases = languageData;
    }

    return NextResponse.json({ 
      ok: true, 
      data: {
        language: validatedData.language,
        category: validatedData.category || 'all',
        phrases,
        totalPhrases: Object.keys(phrases).length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Phrases API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid input data', 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch phrases' 
    }, { status: 500 });
  }
}

// Get available languages
export async function PUT(req: NextRequest) {
  try {
    const availableLanguages = Object.keys(TRAVEL_PHRASES).map(lang => ({
      language: lang,
      categories: Object.keys(TRAVEL_PHRASES[lang]),
      totalPhrases: Object.values(TRAVEL_PHRASES[lang]).reduce((acc, cat) => acc + Object.keys(cat).length, 0)
    }));

    return NextResponse.json({ 
      ok: true, 
      data: {
        availableLanguages,
        totalLanguages: availableLanguages.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Languages API error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to fetch available languages' 
    }, { status: 500 });
  }
} 