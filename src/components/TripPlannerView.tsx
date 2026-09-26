import React, { useState } from 'react';
import { DestinationInfo, TripPlan, TravelVaultData } from '../types';
import { CompanionAPI } from '../services/api';
import {
  Compass,
  Calendar,
  Wallet,
  Plane,
  Building,
  Utensils,
  Car,
  ShieldCheck,
  Sparkles,
  Download,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  BookmarkCheck,
} from 'lucide-react';

interface TripPlannerViewProps {
  destination: DestinationInfo;
  vault: TravelVaultData;
  onSaveToVault?: (plan: TripPlan) => void;
}

export const TripPlannerView: React.FC<TripPlannerViewProps> = ({
  destination,
  vault,
  onSaveToVault,
}) => {
  const [origin, setOrigin] = useState('India');
  const [durationDays, setDurationDays] = useState(7);
  const [budget, setBudget] = useState('60000');
  const [currency, setCurrency] = useState('INR');
  const [travelStyle, setTravelStyle] = useState('Balanced Explorer');
  const [travelParty, setTravelParty] = useState('Solo Traveler');
  const [dietaryPrefs, setDietaryPrefs] = useState('Vegetarian');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Street Food',
    'Cultural Temples',
    'Scenic Nature',
    'Local Markets',
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<TripPlan | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  const availableInterests = [
    'Street Food',
    'Cultural Temples',
    'Scenic Nature',
    'Local Markets',
    'Architecture',
    'Nightlife & Cafes',
    'Historical Museums',
    'Relaxation & Spa',
  ];

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setSavedSuccess(false);

    try {
      const response = await CompanionAPI.planTrip({
        destination: destination.name,
        origin,
        durationDays,
        budget,
        currency,
        interests: selectedInterests,
        dietaryPreferences: dietaryPrefs,
        travelParty,
        travelStyle,
      });

      setGeneratedPlan(response.plan);
      setExpandedDay(1);
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlanLocally = () => {
    if (!generatedPlan) return;
    try {
      localStorage.setItem(`saved_trip_${destination.id}`, JSON.stringify(generatedPlan));
      setSavedSuccess(true);
      if (onSaveToVault) {
        onSaveToVault(generatedPlan);
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>AI Dynamic Trip Architect</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Plan My Trip to {destination.name} {destination.flag}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Specify your budget and duration (e.g., <strong className="text-sky-300">₹60,000 for 7 days</strong>). Our street-smart travel companion crafts a complete, scam-proof itinerary with flights, verified neighborhoods, transport rules, and food tailored to your diet.
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Trip Parameters & Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Origin Country */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Departing From
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. India, USA, UK"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Duration</span>
              <span className="text-sky-400 font-bold">{durationDays} Days</span>
            </label>
            <input
              type="range"
              min="3"
              max="21"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg mt-2"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Total Budget
            </label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="VND">VND (₫)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="THB">THB (฿)</option>
              </select>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="60000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Dietary Preference
            </label>
            <select
              value={dietaryPrefs}
              onChange={(e) => setDietaryPrefs(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Vegetarian">Pure Vegetarian</option>
              <option value="Vegan">Vegan (Strictly Plant-Based)</option>
              <option value="Halal">Halal</option>
              <option value="Jain-friendly">Jain-friendly (No root vegetables)</option>
              <option value="No Beef / No Pork">No Beef / No Pork</option>
              <option value="Nut / Shellfish Allergy">Nut & Shellfish Allergy</option>
              <option value="No Restrictions">No Restrictions</option>
            </select>
          </div>
        </div>

        {/* Interests Pills */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Trip Focus & Interests:
          </label>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleToggleInterest(interest)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-sky-950 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Designing Your Custom Journey...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Scam-Proof Itinerary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Itinerary Display */}
      {generatedPlan && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Overview & Save Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Generated Itinerary
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                  {generatedPlan.durationDays} Days in {generatedPlan.destination} — {generatedPlan.totalBudget}
                </h2>
              </div>

              <button
                onClick={handleSavePlanLocally}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved for Offline Use!</span>
                  </>
                ) : (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Save to Offline Vault</span>
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              {generatedPlan.overview}
            </p>

            {generatedPlan.currencyExchangeTip && (
              <div className="mt-3 flex items-start gap-2 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-200">
                <Wallet className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{generatedPlan.currencyExchangeTip}</span>
              </div>
            )}
          </div>

          {/* Budget Allocation Breakdown */}
          {generatedPlan.budgetBreakdown && generatedPlan.budgetBreakdown.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Smart Budget Allocation ({generatedPlan.totalBudget})</span>
              </h3>

              <div className="space-y-3">
                {generatedPlan.budgetBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.category}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {currency} {item.amount.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    {item.advice && (
                      <p className="text-[11px] text-slate-400 italic">{item.advice}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stay & Flight Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stay Suggestions */}
            {generatedPlan.staySuggestions && generatedPlan.staySuggestions.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span>Verified Safe Accommodations</span>
                </h3>
                <div className="space-y-3">
                  {generatedPlan.staySuggestions.map((stay, idx) => (
                    <div key={idx} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-sm">{stay.name}</span>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-semibold border border-emerald-500/20">
                          Safety: {stay.safetyRating}
                        </span>
                      </div>
                      <p className="text-xs text-sky-300 font-mono">
                        {stay.type} • Est. {stay.estimatedCostPerNight}/night
                      </p>
                      <p className="text-xs text-slate-400">{stay.neighborhoodHighlights}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transport & Safety Briefing */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Car className="w-4 h-4 text-sky-400" />
                  <span>Local Transport Rules</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {generatedPlan.localTransportAdvice?.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-sky-400 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h3 className="text-sm font-bold text-rose-300 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Scam Avoidance Protocol</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {generatedPlan.safetyTips?.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Day-by-Day Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Day-by-Day Journey Timeline</span>
            </h3>

            <div className="space-y-3">
              {generatedPlan.dayByDayItinerary?.map((dayPlan) => {
                const isExpanded = expandedDay === dayPlan.day;
                return (
                  <div
                    key={dayPlan.day}
                    className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 transition"
                  >
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : dayPlan.day)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-500/30">
                          D{dayPlan.day}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100">{dayPlan.title}</h4>
                          <span className="text-[11px] text-slate-400">
                            Est. spend: {dayPlan.estimatedDaySpend}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-slate-800/60 space-y-3 text-xs leading-relaxed">
                        {/* Morning */}
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold text-[10px] shrink-0 border border-amber-500/20">
                            Morning
                          </span>
                          <p className="text-slate-300">{dayPlan.morning}</p>
                        </div>

                        {/* Afternoon */}
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-bold text-[10px] shrink-0 border border-sky-500/20">
                            Afternoon
                          </span>
                          <p className="text-slate-300">{dayPlan.afternoon}</p>
                        </div>

                        {/* Evening */}
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold text-[10px] shrink-0 border border-indigo-500/20">
                            Evening
                          </span>
                          <p className="text-slate-300">{dayPlan.evening}</p>
                        </div>

                        {/* Food Recommendation */}
                        {dayPlan.mealRecommendation && (
                          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex items-start gap-2.5 mt-2">
                            <Utensils className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-100">
                                Food Pick: {dayPlan.mealRecommendation.dish}
                              </span>
                              <span className="text-emerald-300 ml-2 font-mono">
                                (~{dayPlan.mealRecommendation.estimatedCost})
                              </span>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {dayPlan.mealRecommendation.dietaryNote}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Transport Tip */}
                        {dayPlan.transportTip && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                            <Car className="w-3.5 h-3.5 text-sky-400" />
                            <span>Transit Tip: {dayPlan.transportTip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
