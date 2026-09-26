import React, { useState } from 'react';
import { DestinationInfo, MicroItinerary } from '../types';
import { CompanionAPI } from '../services/api';
import {
  Clock,
  MapPin,
  Sparkles,
  CloudSun,
  Wallet,
  Footprints,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Coffee,
  ShoppingBag,
  Camera,
  RefreshCw,
} from 'lucide-react';

interface WhereNowViewProps {
  destination: DestinationInfo;
}

export const WhereNowView: React.FC<WhereNowViewProps> = ({ destination }) => {
  const [hours, setHours] = useState(3);
  const [currentLocation, setCurrentLocation] = useState(
    destination.id === 'vietnam' ? 'Old Quarter, Hanoi' : `${destination.capital} Center`
  );
  const [availableBudget, setAvailableBudget] = useState(
    destination.id === 'vietnam' ? '300,000 VND' : 'Moderate'
  );
  const [timeOfDay, setTimeOfDay] = useState('Afternoon (2:00 PM)');
  const [weather, setWeather] = useState('Pleasant & Sunny');
  const [selectedVibe, setSelectedVibe] = useState('Hidden Cafes & Local Culture');

  const [isLoading, setIsLoading] = useState(false);
  const [microPlan, setMicroPlan] = useState<MicroItinerary | null>({
    headline: `Perfect 3-Hour Loop in ${destination.capital}`,
    totalTime: '3 hours',
    budgetEstimate: `~${availableBudget}`,
    weatherAwareness: 'Pleasant weather; ideal for walking with shaded cafe stops.',
    steps: [
      {
        timeSlot: '00:00 - 00:45 (45 min)',
        activity: 'Explore hidden artisan alleys and peaceful local shrine',
        location: `${currentLocation} Heritage Alley`,
        cost: 'Free entry',
        tips: 'Dress respectfully (knees covered); remove sunglasses inside shrine.',
      },
      {
        timeSlot: '00:45 - 01:30 (45 min)',
        activity: 'Rooftop Egg Coffee or Green Tea Tasting',
        location: 'Vintage Balcony Cafe overlooking street life',
        cost: '35,000 - 55,000 VND',
        tips: 'Take a seat near the balcony railing for panoramic photo opportunities.',
      },
      {
        timeSlot: '01:30 - 02:20 (50 min)',
        activity: 'Stroll around pedestrian merchant market',
        location: 'Traditional Covered Market',
        cost: 'Window shopping or fresh seasonal fruit',
        tips: 'Say “Không, cảm ơn” with a smile to decline aggressive street vendors.',
      },
      {
        timeSlot: '02:20 - 03:00 (40 min)',
        activity: 'Scenic return walk or quick Grab ride back to hotel',
        location: 'Return transit loop',
        cost: 'Walk (Free) or Grab (~25,000 VND)',
        tips: 'Get back comfortably before peak rush hour traffic kicks in.',
      },
    ],
    companionAdvice:
      'This 3-hour micro loop is completely walkable, safe, and avoids major tourist congestion.',
  });

  const vibes = [
    { label: '☕ Hidden Cafes & Culture', value: 'Hidden Cafes & Local Culture' },
    { label: '🍜 Street Food & Snacking', value: 'Street Food & Snacking' },
    { label: '🏛️ Historic Temples & Shrines', value: 'Historic Temples & Shrines' },
    { label: '🛍️ Local Markets & Souvenirs', value: 'Local Markets & Souvenirs' },
    { label: '📸 Scenic Walks & Photography', value: 'Scenic Walks & Photography' },
  ];

  const handleGenerateImmediatePlan = async () => {
    setIsLoading(true);
    try {
      const response = await CompanionAPI.whereShouldIGoNow({
        currentLocation,
        destination: destination.name,
        hoursAvailable: hours,
        currentBudget: availableBudget,
        timeOfDay,
        weather,
        userInterests: selectedVibe,
      });
      setMicroPlan(response.plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Real-Time Contextual Companion</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          “Where Should I Go Now?”
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Unexpected gap in your schedule? Tell your companion where you are and how many hours you have free. Get an immediate, realistic mini-itinerary that brings you back safely on time without stress.
        </p>
      </div>

      {/* Input Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Time slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400">Time Available:</label>
              <span className="text-sky-400 font-extrabold text-xs">{hours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1 hr</span>
              <span>3 hrs</span>
              <span>6 hrs</span>
            </div>
          </div>

          {/* Current Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Current Spot / Neighborhood:
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. Near Hoan Kiem Lake"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pl-8 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
              />
              <MapPin className="w-3.5 h-3.5 text-sky-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Time & Weather */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Current Time & Weather:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening / Sunset">Evening</option>
                <option value="Night">Night</option>
              </select>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none"
              >
                <option value="Pleasant & Sunny">Sunny</option>
                <option value="Rainy / Overcast">Rainy</option>
                <option value="Hot Midday">Hot</option>
                <option value="Cool Evening">Cool</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Available Pocket Budget:
            </label>
            <input
              type="text"
              value={availableBudget}
              onChange={(e) => setAvailableBudget(e.target.value)}
              placeholder="e.g. 200,000 VND or $15"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Vibe Chips */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Desired Vibe right now:
          </label>
          <div className="flex flex-wrap gap-2">
            {vibes.map((v) => (
              <button
                key={v.value}
                onClick={() => setSelectedVibe(v.value)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  selectedVibe === v.value
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateImmediatePlan}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calculating {hours}-Hour Micro-Route...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tell Me What To Do</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Plan Result */}
      {microPlan && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Micro-Itinerary Plan
              </span>
              <h3 className="text-xl font-extrabold text-white mt-0.5">{microPlan.headline}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 font-mono">
                ⏱️ {microPlan.totalTime}
              </span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                💰 {microPlan.budgetEstimate}
              </span>
            </div>
          </div>

          {microPlan.weatherAwareness && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-200 flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{microPlan.weatherAwareness}</span>
            </div>
          )}

          {/* Stepped Timeline */}
          <div className="relative pl-6 space-y-4 border-l-2 border-slate-800 ml-2">
            {microPlan.steps?.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-sky-500 border-4 border-slate-950" />

                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-1.5 shadow-sm group-hover:border-sky-500/40 transition">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-400 font-mono">{step.timeSlot}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{step.cost}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{step.activity}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{step.location}</span>
                  </p>

                  {step.tips && (
                    <div className="pt-1.5 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
                      💡 Companion tip: {step.tips}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Companion closing reassurance */}
          {microPlan.companionAdvice && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-100 block mb-0.5">Companion Guarantee:</span>
                <p>{microPlan.companionAdvice}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
