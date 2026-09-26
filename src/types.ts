export type DestinationCode = string;

export interface DestinationInfo {
  id: DestinationCode;
  name: string;
  country: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  officialLanguage: string;
  languageCode: string;
  speechVoiceLang: string;
  emergencyNumbers: {
    police: string;
    ambulance: string;
    fire: string;
    touristHotline?: string;
  };
  capital: string;
  region?: string;
  trustedTaxiBrands: string[];
  commonScams: string[];
  tapWaterDrinkable: boolean;
  tippingCulture: string;
}

export interface PhraseItem {
  id: string;
  category: 'Emergency' | 'Taxi & Transit' | 'Food & Dietary' | 'Courtesy' | 'Hotel & Stay';
  english: string;
  native: string;
  phonetic: string;
  audioLang: string;
  dietaryTag?: string;
  urgent?: boolean;
}

export interface OfflineDestinationPack {
  destinationId: DestinationCode;
  countryName: string;
  flag: string;
  currency: string;
  currencyCode: string;
  exchangeRateToUSD: number;
  exchangeRateToINR: number;
  emergencyContacts: Array<{ name: string; number: string; note: string }>;
  survivalPhrases: PhraseItem[];
  scamsToAvoid: Array<{ name: string; description: string; howToAvoid: string }>;
  localEtiquette: string[];
  trustedApps: string[];
  safeFoodTips: string[];
  downloadedAt?: string;
}

export interface TripPlan {
  destination: string;
  durationDays: number;
  totalBudget: string;
  currencyExchangeTip?: string;
  overview: string;
  budgetBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    advice: string;
  }>;
  staySuggestions: Array<{
    name: string;
    type: string;
    estimatedCostPerNight: string;
    safetyRating: string;
    neighborhoodHighlights: string;
  }>;
  flightGuidance?: {
    estimatedCost: string;
    recommendedAirlines: string[];
    bookingAdvice: string;
  };
  localTransportAdvice: string[];
  safetyTips: string[];
  dayByDayItinerary: Array<{
    day: number;
    title: string;
    morning: string;
    afternoon: string;
    evening: string;
    mealRecommendation: {
      dish: string;
      dietaryNote: string;
      estimatedCost: string;
    };
    transportTip: string;
    estimatedDaySpend: string;
  }>;
}

export interface MicroItineraryStep {
  timeSlot: string;
  activity: string;
  location: string;
  cost: string;
  tips: string;
}

export interface MicroItinerary {
  headline: string;
  totalTime: string;
  budgetEstimate: string;
  weatherAwareness: string;
  steps: MicroItineraryStep[];
  companionAdvice: string;
}

export interface VisionAnalysisResult {
  category: string;
  title: string;
  originalText?: string;
  translation?: string;
  dietaryAssessment?: {
    isVegetarian?: boolean | null;
    isVegan?: boolean | null;
    isHalal?: boolean | null;
    containsAllergens?: string[];
    summary?: string;
  };
  practicalInfo?: {
    normalFairPrice?: string;
    scamOrWarning?: string;
    actionToTake?: string;
  };
  companionNote: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  currency: string;
  homeAmount: number;
  homeCurrency: string;
  category: 'Food' | 'Transport' | 'Stay' | 'Activities' | 'Shopping' | 'Emergency' | 'Other';
  date: string;
  location?: string;
}

export interface TravelVaultData {
  travelerName: string;
  passportNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  hotelName: string;
  hotelAddress: string;
  roomNumber: string;
  flightDetails: string;
  insurancePolicyNumber: string;
  dietaryNotes: string;
}

export interface HospitalInfo {
  name: string;
  nativeName?: string;
  doctorType?: string;
  doctorPhone: string;
  address: string;
  nativeAddress?: string;
  distance: string;
  englishSpeaking: boolean;
  services: string[];
  openHours: string;
}

export interface DoctorHotlineInfo {
  name: string;
  nativeName?: string;
  phone: string;
  doctorSpecialty: string;
  hours: string;
  address?: string;
  directCallNumber: string;
}

export interface PoliceStationInfo {
  name: string;
  nativeName?: string;
  phone: string;
  emergencyDirect: string;
  address: string;
  nativeAddress?: string;
  distance: string;
  type: string;
  touristServices?: string;
}

export interface NearestEmergencyResult {
  detectedArea: string;
  generalEmergency: {
    police: string;
    ambulance: string;
    fire: string;
    touristHotline?: string;
  };
  nearestHospitals: HospitalInfo[];
  doctorConsultations: DoctorHotlineInfo[];
  nearestPoliceStations: PoliceStationInfo[];
  sosDriverPhrases: Array<{
    english: string;
    native: string;
    phonetic: string;
  }>;
}
