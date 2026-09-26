import { TripPlan, MicroItinerary, VisionAnalysisResult } from '../types';
import { OFFLINE_PACKS, POPULAR_DESTINATIONS } from '../data/offlinePacks';

export const CompanionAPI = {
  // Conversational companion chat
  async chatWithCompanion(params: {
    messages: Array<{ role: string; content: string }>;
    tripContext: any;
    currentQuery: string;
    userLanguage: string;
    destination: string;
  }): Promise<{ reply: string }> {
    try {
      const res = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.warn('Chat offline fallback triggered:', err);
      const pack = OFFLINE_PACKS[params.destination.toLowerCase()] || OFFLINE_PACKS['vietnam'];
      return {
        reply: `[Offline Companion Mode active for ${pack.countryName}]:\nI am with you! While offline, you can access your saved phrasebooks, official emergency numbers (${pack.emergencyContacts.map(c => `${c.name}: ${c.number}`).join(', ')}), currency conversion, and safety scam alerts. Connect to Wi-Fi to unlock full generative vision and dynamic routing!`,
      };
    }
  },

  // Plan my trip
  async planTrip(params: {
    destination: string;
    origin: string;
    durationDays: number;
    budget: string;
    currency: string;
    interests: string[];
    dietaryPreferences: string;
    travelParty: string;
    travelStyle: string;
  }): Promise<{ plan: TripPlan }> {
    try {
      const res = await fetch('/api/companion/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.warn('Plan trip offline fallback:', err);
      // Generate clean offline plan
      const dest = params.destination;
      const budgetNum = Number(params.budget) || 60000;
      return {
        plan: {
          destination: dest,
          durationDays: params.durationDays,
          totalBudget: `${params.currency} ${params.budget}`,
          currencyExchangeTip: `Withdraw local currency at official bank ATMs (avoid private kiosks at tourist alleys). Keep about 30% cash and 70% card.`,
          overview: `Comprehensive offline travel itinerary for ${params.durationDays} days in ${dest}. Designed to keep you independent, well-fed with ${params.dietaryPreferences} options, and protected from overpriced tourist traps.`,
          budgetBreakdown: [
            { category: 'Flights (Roundtrip)', amount: Math.round(budgetNum * 0.35), percentage: 35, advice: 'Book early via aggregator apps.' },
            { category: 'Accommodations', amount: Math.round(budgetNum * 0.28), percentage: 28, advice: 'Stay in central, well-lit districts with high safety ratings.' },
            { category: 'Food & Dining', amount: Math.round(budgetNum * 0.18), percentage: 18, advice: 'Authentic local eateries and food streets.' },
            { category: 'Local Transport', amount: Math.round(budgetNum * 0.08), percentage: 8, advice: 'Public transit cards or official app-hailed rides.' },
            { category: 'Activities & Entry Fees', amount: Math.round(budgetNum * 0.06), percentage: 6, advice: 'Official counter tickets only.' },
            { category: 'Safety Reserve', amount: Math.round(budgetNum * 0.05), percentage: 5, advice: 'Reserve for unexpected transit changes.' },
          ],
          staySuggestions: [
            {
              name: 'City Cultural Quarter',
              type: 'Boutique Hotel / Homestay',
              estimatedCostPerNight: `${params.currency} ${Math.round((budgetNum * 0.28) / params.durationDays)}`,
              safetyRating: '4.8/5 (High)',
              neighborhoodHighlights: 'Walking distance to major cafes and transit, 24/7 front desk security',
            },
          ],
          localTransportAdvice: [
            'Avoid unmetered taxis outside train stations or airports.',
            'Always inspect that the digital fare meter is active before moving.',
            'Download offline transit maps on Google Maps or Citymapper.',
          ],
          safetyTips: [
            'Never leave your backpack unzipped in crowded markets.',
            'Keep your passport in the hotel safety locker; carry a printed and photo copy.',
          ],
          dayByDayItinerary: Array.from({ length: params.durationDays }, (_, idx) => ({
            day: idx + 1,
            title: `Day ${idx + 1}: Immersive Heritage & Local Flavour`,
            morning: 'Explore historic morning walking circuit, peaceful temples, and vibrant street life before midday heat.',
            afternoon: 'Discover local artisan workshops, botanical gardens, and authentic tea houses.',
            evening: 'Scenic twilight stroll by the river or skyline viewpoint, followed by dinner at a trusted neighborhood eatery.',
            mealRecommendation: {
              dish: 'Authentic Signature Regional Specialty',
              dietaryNote: `Suitable for ${params.dietaryPreferences} preference.`,
              estimatedCost: `${params.currency} 350`,
            },
            transportTip: 'Walkable or short ride via official app (~15-20 min).',
            estimatedDaySpend: `${params.currency} ${Math.round((budgetNum * 0.35) / params.durationDays)}`,
          })),
        },
      };
    }
  },

  // Where should I go now?
  async whereShouldIGoNow(params: {
    currentLocation: string;
    destination: string;
    hoursAvailable: number;
    currentBudget: string;
    timeOfDay: string;
    weather: string;
    userInterests: string;
  }): Promise<{ plan: MicroItinerary }> {
    try {
      const res = await fetch('/api/companion/where-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.warn('Where-now offline fallback:', err);
      const hours = params.hoursAvailable;
      return {
        plan: {
          headline: `${hours}-Hour Spontaneous Route around ${params.currentLocation}`,
          totalTime: `${hours} hours`,
          budgetEstimate: params.currentBudget || 'Moderate',
          weatherAwareness: `Tailored for ${params.weather} (${params.timeOfDay}).`,
          steps: [
            {
              timeSlot: 'First 45 min',
              activity: 'Cultural walk & landmark exploration',
              location: `Historic district near ${params.currentLocation}`,
              cost: 'Free / Low',
              tips: 'Snap photos early; take in the architecture.',
            },
            {
              timeSlot: 'Next 60 min',
              activity: 'Relax at a traditional local specialty cafe',
              location: 'Cozy side-alley cafe with rooftop or garden',
              cost: 'Moderate',
              tips: 'Sip on the regional specialty brew while resting your feet.',
            },
            {
              timeSlot: 'Final 45-60 min',
              activity: 'Bustling local pedestrian market & return loop',
              location: 'Central merchant streets',
              cost: 'Flexible',
              tips: 'Great spot for small handcrafted souvenirs; politely decline pushy touts.',
            },
          ],
          companionAdvice: `You have plenty of time. Walk at your own leisure and return securely with time to spare!`,
        },
      };
    }
  },

  // Multi-language translation
  async translateText(params: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    destination: string;
    situation?: string;
  }) {
    try {
      const res = await fetch('/api/companion/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.warn('Translate offline fallback:', err);
      return {
        translation: {
          original: params.text,
          translatedText: `[Translation for ${params.targetLanguage}]: ${params.text}`,
          phoneticPronunciation: 'Use the offline survival phrasebook for verified offline phonetics!',
          pronunciationTips: 'Speak with clear, friendly tone.',
          culturalContext: 'A gentle nod and smile will be warmly received.',
          likelyReplies: [
            { native: 'Dạ vâng / Hai / Oui', meaning: 'Yes / Understood' },
            { native: 'Không sao / Daijoubu / De rien', meaning: 'No problem / Welcome' },
          ],
        },
      };
    }
  },

  // Vision AI photo analyzer
  async analyzeVisionPhoto(params: {
    imageBase64: string;
    mimeType: string;
    taskType: string;
    destination: string;
    dietaryPreferences: string;
    userLanguage: string;
  }): Promise<{ analysis: VisionAnalysisResult }> {
    try {
      const res = await fetch('/api/companion/vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.warn('Vision photo offline fallback:', err);
      return {
        analysis: {
          category: 'Menu / Food',
          title: 'Photo Analysis (Offline Mode)',
          originalText: 'Detected text from camera',
          translation: 'Photo captured. Connect to data network for full multimodal breakdown.',
          dietaryAssessment: {
            isVegetarian: null,
            containsAllergens: ['Check phrasebook for allergy card to show staff directly'],
            summary: `Always show your offline emergency dietary card in local script to the chef or waiter to be 100% safe.`,
          },
          practicalInfo: {
            normalFairPrice: 'Street food: $1.50 - $3.00 USD / Sit-down: $6 - $12 USD',
            scamOrWarning: 'Ensure pricing is posted clearly on the menu before ordering.',
            actionToTake: 'Show the phrase "Tôi ăn chay / No meat" to the server.',
          },
          companionNote: 'When in doubt, point to the dish or ask the waiter using your offline voice phrase card!',
        },
      };
    }
  },

  // Transport options
  async getTransportAdvice(params: {
    destination: string;
    origin: string;
    destinationPlace: string;
    timeOfDay: string;
  }) {
    try {
      const res = await fetch('/api/companion/transport-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.warn('Transport advice offline fallback:', err);
      const pack = OFFLINE_PACKS[params.destination.toLowerCase()] || OFFLINE_PACKS['vietnam'];
      const destInfo = POPULAR_DESTINATIONS.find(d => d.id === params.destination.toLowerCase() || d.name.toLowerCase() === params.destination.toLowerCase()) || POPULAR_DESTINATIONS[0];
      return {
        options: [
          {
            type: 'Ride-Hailing App (Grab / Uber)',
            estimatedFare: 'Fair upfront pricing locked in app',
            travelTime: '25 - 40 mins',
            recommended: true,
            howToBook: `Use ${pack.trustedApps[0] || 'Ride-hailing app'}. Match plate before boarding.`,
            scamAlert: 'Never follow drivers asking for cash off-app.',
          },
          {
            type: 'Official Metered Taxi',
            estimatedFare: 'Metered rate (~15k - 20k per km)',
            travelTime: '25 - 40 mins',
            recommended: false,
            howToBook: `Look for ${destInfo.trustedTaxiBrands.join(' or ')}.`,
            scamAlert: 'Always verify meter turns on and stays on standard flag rate.',
          },
        ],
        localTransportRule: 'Have your exact destination address written in local native script to show the driver.',
      };
    }
  },

  // Price sanity check
  async checkPriceSanity(params: {
    itemOrService: string;
    quotedPrice: string;
    destination: string;
    city: string;
  }) {
    try {
      const res = await fetch('/api/companion/sanity-check-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      return {
        verdict: 'Review Price Carefully',
        isFairPrice: false,
        normalPriceRange: 'Compare with local supermarket or Grab app rate',
        quotedPrice: params.quotedPrice,
        explanation: 'Check whether a meter or official price tag is displayed.',
        counterOfferOrAction: 'Politely say "No thank you" and walk away; vendors will often drop price immediately if inflated.',
      };
    }
  },

  // Emergency protocol guide
  async getEmergencyGuide(params: {
    emergencyType: string;
    destination: string;
    userNationality: string;
    currentCity: string;
  }) {
    try {
      const res = await fetch('/api/companion/emergency-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      const pack = OFFLINE_PACKS[params.destination.toLowerCase()] || OFFLINE_PACKS['vietnam'];
      return {
        emergency: {
          title: `Emergency Protocol: ${params.emergencyType.replace(/_/g, ' ').toUpperCase()}`,
          urgency: 'HIGH',
          steps: [
            { step: 1, title: 'Stay in a Secure, Well-Lit Area', detail: 'Do not panic. Head to a hotel lobby, bank, or police station.' },
            { step: 2, title: 'Call Official Local Emergency Contacts', detail: `Police: ${pack.emergencyContacts[0]?.number}, Medical: ${pack.emergencyContacts[1]?.number}` },
            { step: 3, title: 'File Official Police Report (Biên bản)', detail: 'Essential for travel insurance claims and emergency passport documents.' },
            { step: 4, title: 'Contact Your Consulate / Embassy', detail: `Reach your ${params.userNationality} embassy helpline.` },
          ],
          officialContacts: pack.emergencyContacts,
          phrasesToShow: pack.survivalPhrases.filter(p => p.category === 'Emergency'),
          reassurance: 'You are safe. Follow official procedures step-by-step.',
        },
      };
    }
  },

  // Worldwide destination resolver for any country or city
  async resolveDestination(destinationQuery: string) {
    try {
      const res = await fetch('/api/companion/resolve-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationQuery }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      return data.destination;
    } catch (err) {
      console.warn('Destination resolver network fallback:', err);
      return null;
    }
  },

  // Locate nearest hospitals, doctors, and police stations near GPS or neighborhood
  async getNearestEmergencyServices(params: {
    destination: string;
    city?: string;
    neighborhood?: string;
    latitude?: number;
    longitude?: number;
  }) {
    try {
      const res = await fetch('/api/companion/nearest-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.warn('Nearest emergency services offline fallback:', err);
      const pack = OFFLINE_PACKS[params.destination.toLowerCase()] || OFFLINE_PACKS['vietnam'];
      return {
        detectedArea: `${params.neighborhood || params.city || 'Central District'}, ${params.destination}`,
        generalEmergency: {
          police: pack.emergencyContacts.find(c => c.name.toLowerCase().includes('police'))?.number || '112 / 911',
          ambulance: pack.emergencyContacts.find(c => c.name.toLowerCase().includes('ambulance') || c.name.toLowerCase().includes('medical'))?.number || '112 / 911',
          fire: pack.emergencyContacts.find(c => c.name.toLowerCase().includes('fire'))?.number || '112',
          touristHotline: pack.emergencyContacts.find(c => c.name.toLowerCase().includes('tourist'))?.number || '112',
        },
        nearestHospitals: [
          {
            name: `${params.city || params.destination} Central Emergency Hospital`,
            nativeName: 'Bệnh viện Cấp cứu / Emergency General Hospital',
            doctorType: '24/7 Emergency Room & Trauma Center',
            doctorPhone: pack.emergencyContacts.find(c => c.name.toLowerCase().includes('ambulance'))?.number || '115',
            address: `Main Medical District, ${params.city || params.destination}`,
            nativeAddress: 'Bệnh viện Cấp Cứu / 救急病院',
            distance: '1.2 km (~4 mins)',
            englishSpeaking: true,
            services: ['24/7 ER Doctors', 'Trauma Unit', 'Emergency Ambulance', 'Urgent Surgery'],
            openHours: '24/7 Open',
          },
        ],
        doctorConsultations: [
          {
            name: 'International SOS 24/7 Doctor Helpline',
            phone: '+84 24 3934 0555',
            doctorSpecialty: '24/7 English-speaking Emergency Physician & Consultation',
            hours: '24/7 Emergency',
            address: 'International Clinic Center',
            directCallNumber: '+842439340555',
          },
        ],
        nearestPoliceStations: [
          {
            name: `${params.city || params.destination} Central Police Headquarters`,
            phone: pack.emergencyContacts.find(c => c.name.toLowerCase().includes('police'))?.number || '113',
            emergencyDirect: pack.emergencyContacts.find(c => c.name.toLowerCase().includes('police'))?.number || '113',
            address: `Ward 1 Police Headquarters, ${params.city || params.destination}`,
            nativeAddress: 'Công an Phường / 警察署',
            distance: '600m (~3 mins walk)',
            type: 'Headquarters & Tourist Protection Desk',
            touristServices: 'Loss report filing, Theft reporting, Emergency police dispatch',
          },
        ],
        sosDriverPhrases: [
          {
            english: 'Take me to the nearest emergency hospital immediately!',
            native: 'Làm ơn đưa tôi đến bệnh viện cấp cứu gần nhất ngay lập tức!',
            phonetic: 'Lam un doo-uh toy den benh vee-en cup coo gun nut ngay lup took!',
          },
          {
            english: 'Take me to the nearest police station immediately!',
            native: 'Làm ơn đưa tôi đến đồn công an gần nhất ngay bây giờ!',
            phonetic: 'Lam un doo-uh toy den don com un gun nut ngay bay zew!',
          },
        ],
      };
    }
  },
};
