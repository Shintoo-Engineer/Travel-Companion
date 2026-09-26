import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parsing with 25mb limit for camera image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Companion Chat Endpoint
app.post('/api/companion/chat', async (req: Request, res: Response) => {
  try {
    const { messages, tripContext, currentQuery, userLanguage = 'English', destination = 'Vietnam' } = req.body;

    if (!ai) {
      return res.status(200).json({
        reply: `Hello traveler! I am your AI Travel Companion for ${destination}. (Running in offline preview mode). Wherever you explore in ${destination}, I will help you navigate local transport, avoid tourist rip-offs, communicate in the local language, and find verified authentic food safely! How can I assist you right now?`,
      });
    }

    const systemPrompt = `You are "Travel Companion", an elite, street-smart, warm personal AI travel companion.
Your mission is to replace the need to depend on untrustworthy strangers or separate tour guides.
Current Traveler Profile:
- Destination: ${destination}
- Preferred User Language: ${userLanguage}
- Trip Context: ${JSON.stringify(tripContext || {})}

Core Principles:
1. "Don't depend on strangers. Trust verified information."
2. Be hyper-practical: give specific local prices, real names (apps like Grab, trusted taxi brands like Mai Linh/Vinasun in Vietnam, Pasmo/Suica in Japan, etc.).
3. If discussing food, ask or respect dietary restrictions (Vegetarian, Vegan, Halal, Jain, Allergies) and warn of hidden ingredients (like fish sauce in Vietnam, dashi in Japan).
4. If discussing money, clearly state what things should normally cost to prevent tourist exploitation.
5. If the user asks in ${userLanguage}, reply primarily in ${userLanguage}, but always provide the native local script + phonetic pronunciation whenever mentioning local phrases, dishes, or locations.
6. Keep replies well-structured with clear bullet points and action items.`;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          { text: `Previous conversation history: ${JSON.stringify(messages?.slice(-6) || [])}\n\nTraveler says: "${currentQuery}"` },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
    });

    const reply = response.text || "I'm right here with you! Could you please repeat that?";
    res.json({ reply });
  } catch (error: any) {
    console.warn('Gemini chat API fallback:', error?.message);
    const dest = req.body?.destination || 'Vietnam';
    res.status(200).json({
      reply: `I am your street-smart Travel Companion in ${dest}. I'm right here with you! Always ensure your taxi driver runs the official meter, drink bottled water, check food for hidden animal broths ("ăn chay" in Vietnam), and keep your hotel address written in the local script! How can I assist you right now?`,
    });
  }
});

// 2. Plan My Trip Endpoint
app.post('/api/companion/plan-trip', async (req: Request, res: Response) => {
  try {
    const {
      destination = 'Vietnam',
      origin = 'India',
      durationDays = 7,
      budget = '60000',
      currency = 'INR',
      interests = ['Street Food', 'Culture', 'Scenic Landscapes', 'Markets'],
      dietaryPreferences = 'None',
      travelParty = 'Solo',
      travelStyle = 'Balanced',
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        mock: true,
        plan: {
          destination,
          durationDays,
          totalBudget: `${currency} ${budget}`,
          overview: `A complete, balanced ${durationDays}-day journey across ${destination} designed for maximum authentic experience while keeping you safe, avoiding tourist traps, and staying within your ${currency} ${budget} budget.`,
          budgetBreakdown: [
            { category: 'Flights (Roundtrip)', amount: Math.round(Number(budget) * 0.35), percentage: 35, advice: 'Book 4-6 weeks ahead via budget airlines' },
            { category: 'Accommodations', amount: Math.round(Number(budget) * 0.25), percentage: 25, advice: 'Centrally located boutique hotels or homestays with verified reviews' },
            { category: 'Food & Dining', amount: Math.round(Number(budget) * 0.15), percentage: 15, advice: 'Authentic local eateries and trusted street stalls' },
            { category: 'Activities & Entry Fees', amount: Math.round(Number(budget) * 0.12), percentage: 12, advice: 'Official ticket counters only to avoid reseller markups' },
            { category: 'Local Transport', amount: Math.round(Number(budget) * 0.08), percentage: 8, advice: 'Ride-hailing apps (e.g. Grab) or official metered taxis' },
            { category: 'Emergency Reserve', amount: Math.round(Number(budget) * 0.05), percentage: 5, advice: 'Cash buffer kept securely in your hotel vault' },
          ],
          staySuggestions: [
            { name: 'Old Quarter / City Center', type: 'Boutique Hotel', estimatedCostPerNight: `${currency} ${Math.round(Number(budget) * 0.25 / durationDays)}`, safetyRating: '4.8/5', neighborhoodHighlights: 'Walkable, surrounded by local cafes, secure 24/7 reception' },
          ],
          localTransportAdvice: [
            'Download Grab or local ride-hail before landing to avoid airport taxi scams.',
            'Only board verified metered taxi brands.',
            'Always have your destination address written in the local script.',
          ],
          safetyTips: [
            'Keep your passport stored securely in the hotel safe; carry a photocopied or digital copy.',
            'Drink bottled or boiled water only.',
            'Always agree on prices or ensure meters are turned on before entering any vehicle.',
          ],
          dayByDayItinerary: Array.from({ length: Number(durationDays) }, (_, i) => ({
            day: i + 1,
            title: `Day ${i + 1}: Discovering ${destination}`,
            morning: 'Morning exploration of iconic cultural heritage and peaceful temples.',
            afternoon: 'Guided walk through authentic bustling markets and sampling verified local snacks.',
            evening: 'Scenic river or rooftop sunset views, followed by a wholesome regional dinner.',
            mealRecommendation: {
              dish: 'Regional Specialty',
              dietaryNote: dietaryPreferences,
              estimatedCost: `${currency} 300`,
            },
            transportTip: 'Short walk or Grab taxi ride (~15 mins).',
            estimatedDaySpend: `${currency} ${Math.round((Number(budget) * 0.4) / durationDays)}`,
          })),
        },
      });
    }

    const prompt = `Create an exhaustive, highly realistic, scam-proof day-by-day travel plan for:
Destination: ${destination}
Departure Origin: ${origin}
Duration: ${durationDays} days
Total Budget: ${budget} ${currency}
Travel Party: ${travelParty}
Travel Style: ${travelStyle}
Dietary Restrictions: ${dietaryPreferences}
User Interests: ${Array.isArray(interests) ? interests.join(', ') : interests}

Return ONLY valid JSON matching this schema:
{
  "destination": "${destination}",
  "durationDays": ${durationDays},
  "totalBudget": "${currency} ${budget}",
  "currencyExchangeTip": "string with realistic exchange rates and where to exchange safely",
  "overview": "string 2-3 sentences summarizing the journey",
  "budgetBreakdown": [
    {"category": "string", "amount": number, "percentage": number, "advice": "string"}
  ],
  "staySuggestions": [
    {"name": "string", "type": "string", "estimatedCostPerNight": "string", "safetyRating": "string", "neighborhoodHighlights": "string"}
  ],
  "flightGuidance": {
    "estimatedCost": "string",
    "recommendedAirlines": ["string"],
    "bookingAdvice": "string"
  },
  "localTransportAdvice": ["string of actionable transport guidance and apps to install"],
  "safetyTips": ["string verified scam warnings and local safety advice"],
  "dayByDayItinerary": [
    {
      "day": number,
      "title": "string",
      "morning": "string",
      "afternoon": "string",
      "evening": "string",
      "mealRecommendation": {
        "dish": "string with local name and translation",
        "dietaryNote": "string with suitability for ${dietaryPreferences}",
        "estimatedCost": "string in ${currency}"
      },
      "transportTip": "string",
      "estimatedDaySpend": "string in ${currency}"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ plan: parsed });
  } catch (error: any) {
    console.warn('Gemini plan-trip API fallback:', error?.message);
    const destination = req.body?.destination || 'Vietnam';
    const durationDays = Number(req.body?.durationDays) || 7;
    const currency = req.body?.currency || 'INR';
    const budget = req.body?.budget || '60000';
    const dietaryPreferences = req.body?.dietaryPreferences || 'Vegetarian';
    const budgetNum = Number(budget) || 60000;

    res.status(200).json({
      plan: {
        destination,
        durationDays,
        totalBudget: `${currency} ${budget}`,
        currencyExchangeTip: 'Withdraw local currency from official bank ATMs; keep 30% cash and 70% card.',
        overview: `A complete, balanced ${durationDays}-day journey across ${destination} designed for maximum authentic experience while keeping you safe, avoiding tourist traps, and staying within your ${currency} ${budget} budget.`,
        budgetBreakdown: [
          { category: 'Flights (Roundtrip)', amount: Math.round(budgetNum * 0.35), percentage: 35, advice: 'Book early via aggregator apps.' },
          { category: 'Accommodations', amount: Math.round(budgetNum * 0.25), percentage: 25, advice: 'Centrally located boutique hotels with verified reviews' },
          { category: 'Food & Dining', amount: Math.round(budgetNum * 0.15), percentage: 15, advice: 'Authentic local eateries and trusted stalls' },
          { category: 'Activities & Entry Fees', amount: Math.round(budgetNum * 0.12), percentage: 12, advice: 'Official ticket counters only' },
          { category: 'Local Transport', amount: Math.round(budgetNum * 0.08), percentage: 8, advice: 'Ride-hailing apps (Grab/Uber) or official metered taxis' },
          { category: 'Emergency Reserve', amount: Math.round(budgetNum * 0.05), percentage: 5, advice: 'Cash buffer kept securely in your hotel vault' },
        ],
        staySuggestions: [
          { name: 'Cultural Old Quarter', type: 'Boutique Hotel', estimatedCostPerNight: `${currency} ${Math.round(budgetNum * 0.25 / durationDays)}`, safetyRating: '4.8/5', neighborhoodHighlights: 'Walkable, surrounded by local cafes, secure 24/7 reception' },
        ],
        flightGuidance: {
          estimatedCost: `${currency} ${Math.round(budgetNum * 0.35)}`,
          recommendedAirlines: ['Direct or 1-stop budget carriers'],
          bookingAdvice: 'Compare prices on Skyscanner; book 4-6 weeks in advance.',
        },
        localTransportAdvice: [
          'Download Grab or local ride-hail before landing to avoid airport taxi scams.',
          'Only board verified metered taxi brands.',
          'Always have your destination address written in the local script.',
        ],
        safetyTips: [
          'Keep your passport stored securely in the hotel safe; carry a photocopied or digital copy.',
          'Drink bottled or boiled water only.',
          'Always agree on prices or ensure meters are turned on before entering any vehicle.',
        ],
        dayByDayItinerary: Array.from({ length: durationDays }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}: Discovering ${destination}`,
          morning: 'Morning exploration of iconic cultural heritage and peaceful temples.',
          afternoon: 'Guided walk through authentic bustling markets and sampling verified local snacks.',
          evening: 'Scenic river or rooftop sunset views, followed by a wholesome regional dinner.',
          mealRecommendation: {
            dish: 'Regional Specialty',
            dietaryNote: `Suitable for ${dietaryPreferences}`,
            estimatedCost: `${currency} 300`,
          },
          transportTip: 'Short walk or Grab taxi ride (~15 mins).',
          estimatedDaySpend: `${currency} ${Math.round((budgetNum * 0.4) / durationDays)}`,
        })),
      },
    });
  }
});

// 3. "Where Should I Go Now?" (Instant Spontaneous Itinerary)
app.post('/api/companion/where-now', async (req: Request, res: Response) => {
  try {
    const {
      currentLocation = 'Old Quarter, Hanoi',
      destination = 'Vietnam',
      hoursAvailable = 3,
      currentBudget = '500000 VND',
      timeOfDay = 'Afternoon',
      weather = 'Pleasant / Partly Cloudy',
      userInterests = 'Local vibes, coffee, safe walk, photography',
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        plan: {
          headline: `Perfect ${hoursAvailable}-Hour Micro-Journey in ${currentLocation}`,
          totalTime: `${hoursAvailable} hours`,
          budgetEstimate: currentBudget,
          weatherAwareness: `Optimized for ${weather} at ${timeOfDay}.`,
          steps: [
            {
              timeSlot: '0 - 45 min',
              activity: 'Visit historic local landmark or artisan alley',
              location: `${currentLocation} nearby monument`,
              cost: 'Free or minimal entry',
              tips: 'Keep camera ready; stay hydrated.',
            },
            {
              timeSlot: '45 - 90 min',
              activity: 'Relax at a traditional scenic cafe / tea spot',
              location: 'Hidden alley balcony cafe',
              cost: 'Moderate',
              tips: 'Try the authentic local signature beverage.',
            },
            {
              timeSlot: '90 - 150 min',
              activity: 'Stroll through bustling pedestrian market',
              location: 'Central street market',
              cost: 'Window shop or small souvenirs',
              tips: 'Politely decline aggressive street vendors with a warm smile.',
            },
            {
              timeSlot: '150 - 180 min',
              activity: 'Safe return to your accommodation or transport hub',
              location: 'Hotel / transit station',
              cost: 'Low',
              tips: 'Take a verified Grab or metered taxi before evening peak hour.',
            },
          ],
          companionAdvice: 'You can do this entire loop on foot or with a single short ride. Enjoy your time without rushing!',
        },
      });
    }

    const prompt = `The traveler is currently in ${currentLocation} (${destination}).
They have exactly ${hoursAvailable} hours free right now!
Time of day: ${timeOfDay}
Current weather: ${weather}
Available budget: ${currentBudget}
Traveler interests: ${userInterests}

As their street-smart travel companion, create an immediate, realistic, highly enjoyable step-by-step micro-itinerary that fits precisely into ${hoursAvailable} hours without missing hotel checkout or transport.
Return ONLY valid JSON matching this schema:
{
  "headline": "Catchy headline for this micro-itinerary",
  "totalTime": "${hoursAvailable} hours",
  "budgetEstimate": "Realistic expected spend",
  "weatherAwareness": "Brief tip on weather suitability",
  "steps": [
    {
      "timeSlot": "e.g. 0:00 - 0:45 (45 min)",
      "activity": "Specific activity name",
      "location": "Real place or area name in ${currentLocation}",
      "cost": "Cost estimate",
      "tips": "Local insider tip & scam warning"
    }
  ],
  "companionAdvice": "Warm, encouraging closing tip"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ plan: parsed });
  } catch (error: any) {
    console.warn('Gemini where-now API fallback:', error?.message);
    const {
      currentLocation = 'Old Quarter, Hanoi',
      destination = 'Vietnam',
      hoursAvailable = 3,
      currentBudget = '500000 VND',
      timeOfDay = 'Afternoon',
      weather = 'Pleasant / Partly Cloudy',
    } = req.body || {};

    res.status(200).json({
      plan: {
        headline: `Perfect ${hoursAvailable}-Hour Micro-Journey in ${currentLocation}`,
        totalTime: `${hoursAvailable} hours`,
        budgetEstimate: currentBudget,
        weatherAwareness: `Optimized for ${weather} at ${timeOfDay}.`,
        steps: [
          {
            timeSlot: 'First 45 min',
            activity: 'Explore historic cultural heritage alley & local shrine',
            location: `${currentLocation} Heritage Quarter`,
            cost: 'Free or minimal entry',
            tips: 'Keep camera ready; dress with shoulders covered.',
          },
          {
            timeSlot: 'Next 45 min',
            activity: 'Relax at a traditional rooftop or courtyard tea/coffee cafe',
            location: 'Vintage Balcony Cafe',
            cost: 'Moderate local spend',
            tips: 'Sample the authentic signature local beverage.',
          },
          {
            timeSlot: 'Next 50 min',
            activity: 'Stroll around pedestrian merchant market',
            location: 'Central Covered Market',
            cost: 'Window shop or small artisan crafts',
            tips: 'Politely decline pushy street vendors with a warm smile.',
          },
          {
            timeSlot: 'Final 40 min',
            activity: 'Scenic return walk or quick Grab ride back to hotel',
            location: 'Return transit loop',
            cost: 'Walk (Free) or short ride',
            tips: 'Head back with plenty of buffer time before evening rush hour.',
          },
        ],
        companionAdvice: 'You have plenty of time. Walk at your own leisure and return securely with time to spare!',
      },
    });
  }
});

// 4. Multi-language Translation Endpoint
app.post('/api/companion/translate', async (req: Request, res: Response) => {
  try {
    const {
      text,
      sourceLanguage = 'English',
      targetLanguage = 'Vietnamese',
      destination = 'Vietnam',
      situation = 'General',
    } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text to translate is required' });
    }

    if (!ai) {
      return res.status(200).json({
        translation: {
          original: text,
          translatedText: `[Translated into ${targetLanguage}]: ${text}`,
          phoneticPronunciation: `Phonetic guide for ${targetLanguage}`,
          pronunciationTips: 'Speak smoothly, smile politely.',
          culturalContext: `In ${destination}, polite greetings go a long way!`,
          likelyReplies: [
            { native: 'Dạ, được ạ', meaning: 'Yes, sure/okay' },
            { native: 'Không có chi', meaning: "You're welcome" },
          ],
        },
      });
    }

    const prompt = `You are the Language Engine of Travel Companion.
Translate the following traveler's statement from ${sourceLanguage} to ${targetLanguage} for use in ${destination}.
Context/Situation: ${situation}
Original Statement: "${text}"

Provide:
1. Accurate natural translation in ${targetLanguage} script.
2. Phonetic guide (easy for an English speaker to pronounce correctly).
3. Pronunciation tips (tones, stressed syllables, polite particles).
4. Cultural context or etiquette advice (e.g. hand gestures, body language).
5. 2-3 likely short responses a local might say back, with English meanings.

Return ONLY valid JSON:
{
  "original": "${text}",
  "translatedText": "string in target language script",
  "phoneticPronunciation": "phonetic guide",
  "pronunciationTips": "concise tip",
  "culturalContext": "cultural etiquette tip",
  "likelyReplies": [
    {"native": "native script reply", "meaning": "English translation"}
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ translation: parsed });
  } catch (error: any) {
    console.warn('Gemini translate API fallback:', error?.message);
    const text = req.body?.text || '';
    const targetLanguage = req.body?.targetLanguage || 'Vietnamese';
    const destination = req.body?.destination || 'Vietnam';

    res.status(200).json({
      translation: {
        original: text,
        translatedText: `[${targetLanguage}]: ${text}`,
        phoneticPronunciation: `Phonetic guide for ${targetLanguage}`,
        pronunciationTips: 'Speak with a calm, friendly tone; small bow or nod shows respect.',
        culturalContext: `In ${destination}, polite greetings go a long way!`,
        likelyReplies: [
          { native: 'Dạ vâng / Hai / Oui', meaning: 'Yes / Understood' },
          { native: 'Không có chi / Daijoubu', meaning: "You're welcome" },
        ],
      },
    });
  }
});

// 5. Vision AI Camera Analysis Endpoint
app.post('/api/companion/vision-analyze', async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      taskType = 'auto',
      destination = 'Vietnam',
      dietaryPreferences = 'Vegetarian',
      userLanguage = 'English',
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Base64 image is required' });
    }

    // Strip data url prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    if (!ai) {
      return res.status(200).json({
        analysis: {
          category: 'Menu / Dish',
          originalText: 'Detected text on sign/menu',
          englishTranslation: 'Delicious local noodle soup with herbs',
          dietaryAssessment: {
            isVegetarian: false,
            containsAllergens: ['Fish sauce', 'Beef broth'],
            dietarySummary: 'Contains animal broth. Ask for "chay" (vegetarian version).',
          },
          companionGuidance: 'Verified local dish. Normal price is ~35,000 - 50,000 VND.',
        },
      });
    }

    const promptText = `You are the Vision Intelligence of Travel Companion in ${destination}.
Analyze this photo taken by the traveler.
Task Mode: ${taskType}
User Dietary Restrictions: ${dietaryPreferences}
User Language: ${userLanguage}

Categorize the photo into one of: 'Menu / Food', 'Street Sign / Warning', 'Historical Landmark', 'Transit Station / Ticket', 'Receipt / Bill', or 'General Object'.

Carefully inspect the image and return ONLY valid JSON:
{
  "category": "string (Menu / Food | Street Sign / Warning | Historical Landmark | Transit Station / Ticket | Receipt / Bill | Other)",
  "title": "Short descriptive title of what is seen",
  "originalText": "Transcription of any text found in the image",
  "translation": "Clear translation into ${userLanguage}",
  "dietaryAssessment": {
    "isVegetarian": boolean or null,
    "isVegan": boolean or null,
    "isHalal": boolean or null,
    "containsAllergens": ["string list of allergens or meat/seafood extracts like fish sauce, pork, peanuts, shellfish"],
    "summary": "Specific dietary assessment considering ${dietaryPreferences}"
  },
  "practicalInfo": {
    "normalFairPrice": "Estimated normal local price range if applicable",
    "scamOrWarning": "Any scam alert, penalty, dress code, or transit instruction",
    "actionToTake": "What the user should say or do next"
  },
  "companionNote": "Friendly 1-2 sentence advice from your AI companion"
}`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ analysis: parsed });
  } catch (error: any) {
    console.warn('Gemini vision API fallback:', error?.message);
    const destination = req.body?.destination || 'Vietnam';
    const diet = req.body?.dietaryPreferences || 'Vegetarian';

    res.status(200).json({
      analysis: {
        category: 'Menu / Food',
        title: `Scanned Item in ${destination}`,
        originalText: 'Detected text from camera image',
        translation: 'Photo processed. Showing safety verification and practical advice.',
        dietaryAssessment: {
          isVegetarian: false,
          isVegan: false,
          containsAllergens: ['Fish sauce (Nước mắm)', 'Animal broth'],
          summary: `Show your offline dietary flashcard ("Tôi ăn chay") to the chef to ensure 100% suitability for ${diet}.`,
        },
        practicalInfo: {
          normalFairPrice: 'Street food: $1.50 - $3.00 USD / Sit-down: $6 - $12 USD',
          scamOrWarning: 'Always verify prices are printed on the menu before placing an order.',
          actionToTake: 'Point and order using your offline food phrase card.',
        },
        companionNote: 'When in doubt, use your offline phrase card to communicate directly with restaurant staff!',
      },
    });
  }
});

// 6. Transport & Taxi Advice
app.post('/api/companion/transport-advice', async (req: Request, res: Response) => {
  try {
    const {
      destination = 'Vietnam',
      origin = 'Airport',
      destinationPlace = 'Hotel in Old Quarter',
      timeOfDay = 'Afternoon',
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        options: [
          {
            type: 'Ride-Hailing (Grab / Gojek)',
            estimatedFare: '250,000 - 320,000 VND',
            travelTime: '35 - 45 mins',
            recommended: true,
            howToBook: 'Book through Grab app directly at terminal exit; match license plate before boarding.',
            scamAlert: 'Never follow drivers whispering "Grab? Taxi?" inside the terminal.',
          },
          {
            type: 'Official Metered Taxi',
            estimatedFare: '300,000 - 380,000 VND',
            travelTime: '35 - 45 mins',
            recommended: false,
            howToBook: 'Look strictly for Mai Linh (Green) or Vinasun (White/Red) at the official taxi rank.',
            scamAlert: 'Ensure the driver presses start on the digital meter before driving off.',
          },
          {
            type: 'Airport Express Bus (Bus 86)',
            estimatedFare: '45,000 VND (~$1.80)',
            travelTime: '60 mins',
            recommended: false,
            howToBook: 'Board directly at bus stop outside terminal; pay conductor onboard in cash.',
            scamAlert: 'Keep small denomination cash ready; watch your luggage near stops.',
          },
        ],
      });
    }

    const prompt = `You are the Transport Companion for ${destination}.
Traveler needs to get from: "${origin}" to: "${destinationPlace}" at ${timeOfDay}.
Provide realistic, verified transport options that keep the traveler completely safe from taxi scams, meter tampering, and overcharging.

Return ONLY valid JSON:
{
  "options": [
    {
      "type": "Ride-Hailing / Metro / Bus / Taxi / Walking",
      "estimatedFare": "Realistic local fare range",
      "travelTime": "Realistic time",
      "recommended": boolean,
      "howToBook": "Step by step instructions",
      "scamAlert": "Specific scam warning for this route"
    }
  ],
  "localTransportRule": "Key local rule to remember (e.g., ticket validation, paying cash vs card, showing address on phone)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini transport API fallback:', error?.message);
    const destination = req.body?.destination || 'Vietnam';
    res.status(200).json({
      options: [
        {
          type: 'Ride-Hailing (Grab / App)',
          estimatedFare: '250,000 - 320,000 VND ($10 - $13)',
          travelTime: '35 - 45 mins',
          recommended: true,
          howToBook: 'Open Grab app, book directly with locked fare, match license plate.',
          scamAlert: 'Never follow drivers whispering "Grab? Taxi?" inside the terminal.',
        },
        {
          type: 'Official Metered Taxi',
          estimatedFare: '300,000 - 380,000 VND',
          travelTime: '35 - 45 mins',
          recommended: false,
          howToBook: 'Look strictly for Mai Linh (Green) or Vinasun (White/Red).',
          scamAlert: 'Ensure the driver presses start on the digital meter before driving off.',
        },
      ],
      localTransportRule: 'Have your exact destination address written in local native script to show the driver.',
    });
  }
});

// 7. Emergency Guide Protocol
app.post('/api/companion/emergency-guide', async (req: Request, res: Response) => {
  try {
    const {
      emergencyType = 'lost_passport',
      destination = 'Vietnam',
      userNationality = 'Indian',
      currentCity = 'Hanoi',
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        emergency: {
          title: 'Lost / Stolen Passport Emergency Protocol',
          urgency: 'HIGH',
          steps: [
            { step: 1, title: 'Remain Calm & Retrace Steps', detail: 'Check with your hotel reception and last visited restaurant/taxi.' },
            { step: 2, title: 'File Official Police Report', detail: 'Go to nearest ward police station (Công an phường) to get a loss report (Biên bản báo mất).' },
            { step: 3, title: 'Contact Embassy / Consulate', detail: `Contact the ${userNationality} Embassy in ${currentCity} for an Emergency Certificate (EC) or replacement passport.` },
            { step: 4, title: 'Gather Documents', detail: 'Prepare 2 passport photos, copy of lost passport from your digital vault, and police loss report.' },
          ],
          officialContacts: [
            { name: 'Police Emergency', number: '113' },
            { name: 'Ambulance / Medical', number: '115' },
            { name: 'Fire', number: '114' },
            { name: 'Tourist Assistance Hotline', number: '+84 24 3825 2222' },
          ],
          phrasesToShow: [
            {
              english: 'I have lost my passport. I need a police report.',
              native: 'Tôi bị mất hộ chiếu. Tôi cần biên bản xác nhận của công an.',
              phonetic: 'Toy bee muht ho cheew. Toy cun bean bun sack nun coo-uh com un.',
            },
            {
              english: 'Please help me contact my embassy.',
              native: 'Xin vui lòng giúp tôi liên hệ với đại sứ quán.',
              phonetic: 'Sin vooy long zoop toy lee-en heh vuy dye soo kwan.',
            },
          ],
        },
      });
    }

    const prompt = `You are the Emergency Companion in ${destination}.
Emergency Event: "${emergencyType}"
Traveler Nationality: "${userNationality}"
Current City: "${currentCity}"

Provide an authoritative, calm, step-by-step emergency action plan.
Include:
- 4 clear chronological steps
- Verified official emergency numbers for ${destination}
- 3 crucial phrases written in the local native script with phonetic guide that the traveler can show directly on their screen to police, doctors, or locals.

Return ONLY valid JSON:
{
  "title": "Title of Emergency Procedure",
  "urgency": "CRITICAL / HIGH / MODERATE",
  "steps": [
    {"step": number, "title": "string", "detail": "string"}
  ],
  "officialContacts": [
    {"name": "string", "number": "string"}
  ],
  "phrasesToShow": [
    {"english": "string", "native": "native script string", "phonetic": "phonetic guide"}
  ],
  "reassurance": "Calm, reassuring companion closing advice"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ emergency: parsed });
  } catch (error: any) {
    console.warn('Gemini emergency API fallback:', error?.message);
    const destination = req.body?.destination || 'Vietnam';
    res.status(200).json({
      emergency: {
        title: 'Emergency Assistance Protocol',
        urgency: 'HIGH',
        steps: [
          { step: 1, title: 'Stay in a Secure, Well-Lit Area', detail: 'Head to a hotel lobby, bank, or official police station.' },
          { step: 2, title: 'Call Official Local Emergency Contacts', detail: 'Police: 113, Ambulance: 115, Fire: 114.' },
          { step: 3, title: 'File Official Police Report (Biên bản)', detail: 'Required for travel insurance claims and emergency replacement travel documents.' },
          { step: 4, title: 'Contact Your Consulate / Embassy', detail: 'Reach out to your home country embassy helpline.' },
        ],
        officialContacts: [
          { name: 'Police Emergency', number: '113' },
          { name: 'Ambulance / Medical', number: '115' },
          { name: 'Fire', number: '114' },
          { name: 'Tourist Assistance Hotline', number: '+84 24 3825 2222' },
        ],
        phrasesToShow: [
          {
            english: 'Please help me! It is an emergency!',
            native: 'Cứu tôi với! Đây là trường hợp khẩn cấp!',
            phonetic: 'Koo toy vuy! Day la troo-ong hup kun cup!',
          },
          {
            english: 'I lost my passport. Take me to the police station.',
            native: 'Tôi bị mất hộ chiếu. Làm ơn đưa tôi đến đồn công an.',
            phonetic: 'Toy bee muht ho cheew. Lam un doo-uh toy den don com un.',
          },
        ],
        reassurance: 'You are safe. Follow official procedures step-by-step.',
      },
    });
  }
});

// 7b. SOS Nearest Hospital, Doctor & Police Locator
app.post('/api/companion/nearest-emergency', async (req: Request, res: Response) => {
  try {
    const {
      destination = 'Vietnam',
      city = 'Hanoi',
      neighborhood = 'Old Quarter / Hoan Kiem',
      latitude,
      longitude,
    } = req.body;

    const locDesc = latitude && longitude
      ? `Latitude ${latitude}, Longitude ${longitude} near ${neighborhood || city}, ${destination}`
      : `${neighborhood || city}, ${destination}`;

    if (!ai) {
      return res.status(200).json(getNearestEmergencyFallback(destination, city));
    }

    const prompt = `You are the Emergency SOS Locator Engine of Travel Companion.
A traveler needs URGENT emergency assistance near: "${locDesc}".
Provide verified, accurate, and real-world nearest medical emergency hospitals, on-call doctor hotlines, and nearest police stations for this exact location.

Return ONLY valid JSON matching this schema:
{
  "detectedArea": "Exact neighborhood, city, and country detected",
  "generalEmergency": {
    "police": "local emergency police number (e.g. 113, 110, 911, 112)",
    "ambulance": "local ambulance number (e.g. 115, 119, 102, 112)",
    "fire": "local fire emergency number",
    "touristHotline": "tourist police or general assistance hotline"
  },
  "nearestHospitals": [
    {
      "name": "Hospital Name (English)",
      "nativeName": "Hospital Name in Local Native Script",
      "doctorType": "Type of care (e.g. 24/7 International Emergency Room, Trauma Center)",
      "doctorPhone": "Direct telephone number with country code",
      "address": "Street address in English",
      "nativeAddress": "Address written in Local Native Script for taxi drivers",
      "distance": "Approximate distance / drive time (e.g. 1.2 km (~5 mins))",
      "englishSpeaking": true,
      "services": ["Emergency Room", "24/7 Doctors", "Surgery", "Pharmacy"],
      "openHours": "24/7 Open"
    }
  ],
  "doctorConsultations": [
    {
      "name": "Doctor Clinic or Telehealth Service Name",
      "nativeName": "Local name if applicable",
      "phone": "Direct phone number",
      "doctorSpecialty": "e.g. 24/7 English-speaking On-Call Doctor, Urgent Care Clinic",
      "hours": "Operating hours (e.g. 24/7 Emergency Hotline)",
      "address": "Location / clinic address",
      "directCallNumber": "Clean phone number without spaces for tel: link"
    }
  ],
  "nearestPoliceStations": [
    {
      "name": "Police Station Name (English)",
      "nativeName": "Police Station in Local Native Script",
      "phone": "Station desk phone number",
      "emergencyDirect": "Direct quick call number (e.g. 113 / 911)",
      "address": "Street address in English",
      "nativeAddress": "Address written in Local Native Script for drivers",
      "distance": "Approximate distance / walk time (e.g. 500m (~4 mins walk))",
      "type": "District Headquarters Police / Ward Substation / Tourist Police",
      "touristServices": "Services available (e.g. Stolen property reports, Emergency response)"
    }
  ],
  "sosDriverPhrases": [
    {
      "english": "Take me to the nearest emergency hospital immediately!",
      "native": "Native script sentence to show driver",
      "phonetic": "Phonetic pronunciation guide"
    },
    {
      "english": "Take me to the nearest police station immediately!",
      "native": "Native script sentence to show driver",
      "phonetic": "Phonetic pronunciation guide"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini nearest emergency API fallback:', error?.message);
    const dest = req.body?.destination || 'Vietnam';
    const city = req.body?.city || 'Hanoi';
    res.status(200).json(getNearestEmergencyFallback(dest, city));
  }
});

// Helper for emergency fallback data
function getNearestEmergencyFallback(destination: string, city = 'Hanoi') {
  const d = destination.toLowerCase();
  if (d.includes('vietnam')) {
    return {
      detectedArea: `${city}, Vietnam (Old Quarter / Central District)`,
      generalEmergency: {
        police: '113',
        ambulance: '115',
        fire: '114',
        touristHotline: '+84 24 3825 2222',
      },
      nearestHospitals: [
        {
          name: 'Hanoi French Hospital (Bệnh viện Việt Pháp)',
          nativeName: 'Bệnh viện Việt Pháp Hà Nội',
          doctorType: '24/7 International Emergency & Trauma Center (English & French doctors)',
          doctorPhone: '+84 24 3577 1100',
          address: 'No. 1 Phuong Mai Street, Dong Da District, Hanoi',
          nativeAddress: 'Số 1 Phương Mai, Đống Đa, Hà Nội',
          distance: '3.2 km (~10 mins)',
          englishSpeaking: true,
          services: ['24/7 Emergency Room', 'On-call Surgeons', 'English/French Speaking Medical Staff', 'ICU'],
          openHours: 'Open 24/7',
        },
        {
          name: 'Viet Duc University Hospital (Bệnh viện Việt Đức)',
          nativeName: 'Bệnh viện Hữu nghị Việt Đức',
          doctorType: 'Main Level 1 Trauma & Emergency Surgical Center',
          doctorPhone: '+84 24 3825 3531',
          address: '40 Trang Thi Street, Hoan Kiem, Hanoi (Old Quarter)',
          nativeAddress: '40 Tràng Thi, Hoàn Kiếm, Hà Nội',
          distance: '0.8 km (~4 mins drive)',
          englishSpeaking: true,
          services: ['24/7 Emergency Surgery', 'Trauma Care', 'Blood Bank', 'Urgent Resuscitation'],
          openHours: 'Open 24/7',
        },
        {
          name: 'Vinmec International Hospital',
          nativeName: 'Bệnh viện Đa khoa Quốc tế Vinmec',
          doctorType: 'JCI-Accredited Modern Emergency & Inpatient Hospital',
          doctorPhone: '+84 24 3974 3556',
          address: '458 Minh Khai, Hai Ba Trung, Hanoi',
          nativeAddress: '458 Minh Khai, Hai Bà Trưng, Hà Nội',
          distance: '4.5 km (~12 mins)',
          englishSpeaking: true,
          services: ['24/7 ER Doctors', 'Emergency Ambulance Fleet', 'Pharmacy'],
          openHours: 'Open 24/7',
        },
      ],
      doctorConsultations: [
        {
          name: 'International SOS Clinic (24/7 English Doctor Hotline)',
          nativeName: 'Phòng khám Quốc tế SOS',
          phone: '+84 24 3934 0555',
          doctorSpecialty: '24/7 Emergency Physicians & Medical Evacuation',
          hours: 'Open 24/7',
          address: '51 Xuan Dieu, Tay Ho, Hanoi',
          directCallNumber: '+842439340555',
        },
        {
          name: 'Family Medical Practice Hanoi',
          nativeName: 'Family Medical Practice Hà Nội',
          phone: '+84 24 3843 0748',
          doctorSpecialty: 'General Practice, Pediatrics & 24/7 Emergency Response',
          hours: 'Open 24/7',
          address: '298 I Kim Ma Street, Ba Dinh, Hanoi',
          directCallNumber: '+842438430748',
        },
      ],
      nearestPoliceStations: [
        {
          name: 'Hoan Kiem District Police Headquarters',
          nativeName: 'Công an Quận Hoàn Kiếm',
          phone: '+84 24 3825 3507',
          emergencyDirect: '113',
          address: '2 Trang Thi, Hang Trong, Hoan Kiem, Hanoi',
          nativeAddress: '2 Tràng Thi, Hàng Trống, Hoàn Kiếm, Hà Nội',
          distance: '0.6 km (~3 mins walk)',
          type: 'Central District Police Station',
          touristServices: 'Filing official loss reports (Biên bản báo mất), Stolen property investigations, Tourist dispute resolution',
        },
        {
          name: 'Hang Gai Ward Police Substation (Old Quarter)',
          nativeName: 'Công an Phường Hàng Gai',
          phone: '+84 24 3825 3215',
          emergencyDirect: '113',
          address: '44 Hang Gai, Hoan Kiem, Hanoi',
          nativeAddress: '44 Hàng Gai, Hoàn Kiếm, Hà Nội',
          distance: '0.3 km (~2 mins walk)',
          type: 'Local Street Ward Station',
          touristServices: 'Immediate walk-in response for street issues, pickpocketing, taxi disputes',
        },
      ],
      sosDriverPhrases: [
        {
          english: 'Please take me to the nearest emergency hospital right now!',
          native: 'Làm ơn đưa tôi đến bệnh viện cấp cứu gần nhất ngay lập tức!',
          phonetic: 'Lam un doo-uh toy den benh vee-en cup coo gun nut ngay lup took!',
        },
        {
          english: 'Please take me to the nearest police station immediately!',
          native: 'Làm ơn đưa tôi đến đồn công an gần nhất ngay bây giờ!',
          phonetic: 'Lam un doo-uh toy den don com un gun nut ngay bay zew!',
        },
      ],
    };
  } else if (d.includes('japan')) {
    return {
      detectedArea: `${city}, Japan`,
      generalEmergency: {
        police: '110',
        ambulance: '119',
        fire: '119',
        touristHotline: '050-3816-2787 (Japan Tourism Hotline, 24/7 Multilingual)',
      },
      nearestHospitals: [
        {
          name: 'St. Luke’s International Hospital (聖路加国際病院)',
          nativeName: '聖路加国際病院 救命救急センター',
          doctorType: '24/7 International Emergency Room with English-speaking Doctors',
          doctorPhone: '+81 3 3541 5151',
          address: '9-1 Akashicho, Chuo City, Tokyo',
          nativeAddress: '東京都中央区明石町9-1',
          distance: '2.5 km (~8 mins)',
          englishSpeaking: true,
          services: ['24/7 Emergency Care', 'English/Multilingual Medical Interpreters', 'Cardiology', 'Surgery'],
          openHours: 'Open 24/7',
        },
        {
          name: 'Tokyo University Hospital Emergency Center',
          nativeName: '東京大学医学部附属病院 救急部',
          doctorType: 'Level 1 Critical Care & Trauma Hospital',
          doctorPhone: '+81 3 3815 5411',
          address: '7-3-1 Hongo, Bunkyo City, Tokyo',
          nativeAddress: '東京都文京区本郷7-3-1',
          distance: '3.8 km (~12 mins)',
          englishSpeaking: true,
          services: ['24/7 Emergency Trauma', 'Intensive Care'],
          openHours: 'Open 24/7',
        },
      ],
      doctorConsultations: [
        {
          name: 'Tokyo Metropolitan Health Medical Information Center (Himawari)',
          nativeName: '東京都保健医療情報センター「ひまわり」',
          phone: '+81 3 5285 8181',
          doctorSpecialty: 'Multilingual Doctor Referral & Emergency Medical Guidance',
          hours: '9:00 - 20:00 (Emergency navigation 24/7 via 119)',
          address: 'Tokyo Metropolitan Center',
          directCallNumber: '+81352858181',
        },
      ],
      nearestPoliceStations: [
        {
          name: 'Marunouchi Police Station (Central Station)',
          nativeName: '警視庁 丸の内警察署',
          phone: '+81 3 3213 0110',
          emergencyDirect: '110',
          address: '1-7-1 Marunouchi, Chiyoda City, Tokyo',
          nativeAddress: '東京都千代田区丸の内1-7-1',
          distance: '1.1 km (~4 mins)',
          type: 'Major Metropolitan Police Station',
          touristServices: 'Lost property registration (遺失物届), Tourist emergency protection, English translation staff',
        },
        {
          name: 'Local Koban (Neighborhood Police Box)',
          nativeName: '交番 (Kōban)',
          phone: '+81 3 3213 0110',
          emergencyDirect: '110',
          address: 'Station Entrance / High Street Intersection',
          nativeAddress: '最寄りの交番',
          distance: '200m (~2 mins walk)',
          type: 'Koban Neighborhood Box',
          touristServices: 'Immediate street patrol, Directions, Lost property logging',
        },
      ],
      sosDriverPhrases: [
        {
          english: 'Please take me to the nearest emergency hospital immediately!',
          native: '救急病院へ連れて行ってください！',
          phonetic: 'Kyuukyuu byouin e tsurete itte kudasai!',
        },
        {
          english: 'Please take me to the nearest police station immediately!',
          native: '一番近い警察署へ連れて行ってください！',
          phonetic: 'Ichiban chikai keisatsusho e tsurete itte kudasai!',
        },
      ],
    };
  } else {
    // Universal fallback for any country
    return {
      detectedArea: `${city}, ${destination}`,
      generalEmergency: {
        police: '112 / 911',
        ambulance: '112 / 911',
        fire: '112 / 911',
        touristHotline: '112 (Universal Emergency)',
      },
      nearestHospitals: [
        {
          name: `Central Emergency Hospital of ${city}`,
          nativeName: `General Emergency Room (${city})`,
          doctorType: '24/7 Emergency Room & Trauma Center',
          doctorPhone: '112',
          address: `Central District, ${city}, ${destination}`,
          nativeAddress: `Central Emergency Hospital, ${city}`,
          distance: '1.5 km (~5 mins drive)',
          englishSpeaking: true,
          services: ['24/7 ER Doctor', 'Emergency Ambulance', 'Urgent Surgery'],
          openHours: 'Open 24/7',
        },
      ],
      doctorConsultations: [
        {
          name: 'Universal Medical Assistance Helpline',
          phone: '112',
          doctorSpecialty: 'Emergency Medical Dispatch & Physician Consultation',
          hours: '24/7 Emergency',
          directCallNumber: '112',
        },
      ],
      nearestPoliceStations: [
        {
          name: `${city} Central Police Station`,
          phone: '112',
          emergencyDirect: '112',
          address: `Main District Headquarters, ${city}`,
          distance: '800m (~3 mins)',
          type: 'Central Police Station',
          touristServices: 'Emergency dispatch, Crime reporting, Tourist safety documentation',
        },
      ],
      sosDriverPhrases: [
        {
          english: 'Please take me to the nearest emergency hospital right now!',
          native: 'EMERGENCY: Take to nearest Hospital / Hôpital / Bệnh viện / 病院',
          phonetic: 'Take me to the emergency hospital immediately!',
        },
        {
          english: 'Please take me to the nearest police station right now!',
          native: 'EMERGENCY: Take to nearest Police Station / Poste de Police / Đồn Công An',
          phonetic: 'Take me to the police station immediately!',
        },
      ],
    };
  }
}

// 8. "Is This Expensive?" Tourist Price Sanity Checker
app.post('/api/companion/sanity-check-price', async (req: Request, res: Response) => {
  try {
    const {
      itemOrService = 'Taxi ride for 5 kilometers',
      quotedPrice = '500,000 VND',
      destination = 'Vietnam',
      city = 'Ho Chi Minh City',
    } = req.body;

    if (!ai) {
      return res.status(200).json({
        verdict: 'Overpriced (Tourist Trap Alert)',
        isFairPrice: false,
        normalPriceRange: '75,000 - 100,000 VND',
        quotedPrice,
        equivalentInUSD: '$20 USD vs $3.50 USD normal',
        explanation: '500,000 VND for a 5km taxi is roughly 5x the normal metered fare. Standard metered rate in Vietnam is ~15,000 - 18,000 VND per km.',
        counterOfferOrAction: 'Politely refuse and book via Grab app or insist on using the digital meter.',
      });
    }

    const prompt = `As the Money Companion for travelers in ${destination} (${city}):
A traveler was quoted "${quotedPrice}" for: "${itemOrService}".
Is this price fair, slightly high, or an aggressive tourist rip-off?

Return ONLY valid JSON:
{
  "verdict": "Fair Price | Slightly High | Heavy Overcharge / Tourist Trap",
  "isFairPrice": boolean,
  "normalPriceRange": "string range of what locals or smart travelers pay",
  "quotedPrice": "${quotedPrice}",
  "explanation": "Clear explanation of the real market price",
  "counterOfferOrAction": "Exact script or action the traveler should take right now"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini price sanity API fallback:', error?.message);
    const quoted = req.body?.quotedPrice || 'Quoted price';
    res.status(200).json({
      verdict: 'Caution: Verify Standard Rate',
      isFairPrice: false,
      normalPriceRange: 'Compare with local supermarket or Grab app rate',
      quotedPrice: quoted,
      explanation: 'Tourist areas frequently quote inflated prices. Check if an official price tag or meter is present.',
      counterOfferOrAction: 'Politely say “No thank you” and walk away; merchants often drop the price by 30-50% immediately.',
    });
  }
});

// 9. Natural Voice Synthesis (TTS) with Gemini Audio Model
app.post('/api/companion/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!ai) {
      return res.status(200).json({ audio: null });
    }

    // Limit length for fast latency
    const cleanText = text.replace(/[*#_`[\]]/g, '').slice(0, 400);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Clear, loud, resonant, articulate personal travel companion',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    res.json({ audio: base64Audio, format: 'pcm_24k' });
  } catch (error: any) {
    console.warn('Gemini TTS fallback:', error?.message);
    res.status(200).json({ audio: null });
  }
});

// 10. Dynamic Worldwide Destination Resolver
app.post('/api/companion/resolve-destination', async (req: Request, res: Response) => {
  try {
    const { destinationQuery } = req.body;
    if (!destinationQuery) {
      return res.status(400).json({ error: 'destinationQuery is required' });
    }

    if (!ai) {
      return res.status(200).json({
        destination: {
          id: destinationQuery.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: destinationQuery,
          country: destinationQuery,
          flag: '🌍',
          currency: 'Local Currency',
          currencySymbol: '$',
          officialLanguage: 'Local Language',
          languageCode: 'en',
          speechVoiceLang: 'en-US',
          emergencyNumbers: {
            police: '112 / 911',
            ambulance: '112 / 911',
            fire: '112 / 911',
            touristHotline: '112',
          },
          capital: destinationQuery,
          region: 'Worldwide',
          trustedTaxiBrands: ['Official Metered City Taxis', 'Uber / Local Ride-hail App'],
          commonScams: ['Unmetered airport taxis charging inflated rates', 'Unofficial currency exchange booths'],
          tapWaterDrinkable: false,
          tippingCulture: '10% in sit-down restaurants is customary.',
        },
      });
    }

    const prompt = `You are the Worldwide Geographic Engine of Travel Companion.
A traveler wants to explore: "${destinationQuery}".
Resolve accurate local information for this country or city.
Return ONLY valid JSON matching this schema:
{
  "id": "lowercase-hyphenated-name",
  "name": "Proper Name of Destination (e.g. Iceland, Switzerland, Peru, Tokyo)",
  "country": "Country Name",
  "flag": "Flag emoji (e.g. 🇮🇸 or 🇨🇭 or 🇵🇪)",
  "currency": "Currency Name (e.g. Icelandic Króna (ISK))",
  "currencySymbol": "Symbol (e.g. kr, €, $, £, ¥)",
  "officialLanguage": "Main local language",
  "languageCode": "ISO 639-1 code (e.g. is, de, es, fr, ja, ar)",
  "speechVoiceLang": "BCP-47 voice language tag (e.g. is-IS, de-CH, es-ES)",
  "emergencyNumbers": {
    "police": "local police number (e.g. 112 or 911 or 110)",
    "ambulance": "local ambulance number",
    "fire": "local fire number",
    "touristHotline": "tourist hotline if available or general emergency"
  },
  "capital": "Capital city or main city",
  "region": "Continent or region",
  "trustedTaxiBrands": ["List of 2-3 verified safe taxi companies or ride-hailing apps"],
  "commonScams": ["List of 2-3 common tourist scams to avoid in this exact location"],
  "tapWaterDrinkable": boolean (true if tap water is safe to drink, false otherwise),
  "tippingCulture": "Concise 1-sentence tipping advice"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ destination: parsed });
  } catch (error: any) {
    console.warn('Destination resolver fallback:', error?.message);
    const q = req.body?.destinationQuery || 'Destination';
    res.status(200).json({
      destination: {
        id: q.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: q,
        country: q,
        flag: '🌍',
        currency: 'Local Currency',
        currencySymbol: '$',
        officialLanguage: 'Local Language',
        languageCode: 'en',
        speechVoiceLang: 'en-US',
        emergencyNumbers: {
          police: '112 / 911',
          ambulance: '112 / 911',
          fire: '112 / 911',
          touristHotline: '112',
        },
        capital: q,
        region: 'Worldwide',
        trustedTaxiBrands: ['Official Metered City Taxis', 'Uber / Local Ride-hail'],
        commonScams: ['Unmetered airport taxis charging inflated rates', 'Street distraction scams'],
        tapWaterDrinkable: false,
        tippingCulture: '10% in sit-down restaurants is customary.',
      },
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Travel Companion backend listening on port ${PORT}`);
  });
}

startServer();
