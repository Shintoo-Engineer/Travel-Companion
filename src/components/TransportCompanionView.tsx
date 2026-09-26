import React, { useState } from 'react';
import { DestinationInfo } from '../types';
import { CompanionAPI } from '../services/api';
import {
  Car,
  Bus,
  Footprints,
  Train,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Navigation,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface TransportCompanionViewProps {
  destination: DestinationInfo;
}

export const TransportCompanionView: React.FC<TransportCompanionViewProps> = ({
  destination,
}) => {
  const [origin, setOrigin] = useState(
    destination.id === 'vietnam' ? 'Noi Bai Airport (Hanoi)' : 'Main International Airport'
  );
  const [destinationPlace, setDestinationPlace] = useState(
    destination.id === 'vietnam' ? 'Hotel in Old Quarter' : 'Central Station / City Center'
  );
  const [timeOfDay, setTimeOfDay] = useState('Afternoon (Non-peak)');
  const [isLoading, setIsLoading] = useState(false);

  const [transportOptions, setTransportOptions] = useState<any[]>([
    {
      type: 'Ride-Hailing (Grab / App)',
      estimatedFare: destination.id === 'vietnam' ? '250,000 - 320,000 VND ($10 - $13)' : 'Standard upfront rate',
      travelTime: '35 - 45 mins',
      recommended: true,
      howToBook: 'Open Grab app, select pickup pillar (e.g. Pillar 9). Check driver license plate before boarding.',
      scamAlert: 'Never follow men shouting "Taxi? Grab?" inside the terminal building; they will overcharge 3x.',
    },
    {
      type: 'Official Metered Taxi (Mai Linh / Vinasun)',
      estimatedFare: destination.id === 'vietnam' ? '300,000 - 380,000 VND' : 'Metered rate with airport surcharge',
      travelTime: '35 - 45 mins',
      recommended: false,
      howToBook: 'Walk directly to the official taxi rank outside. Only board Green (Mai Linh) or White/Red (Vinasun) vehicles.',
      scamAlert: 'Ensure the driver flips the meter flag on immediately. If meter moves unrealistically fast, tell them to stop.',
    },
    {
      type: 'Express Airport Bus (Bus 86)',
      estimatedFare: destination.id === 'vietnam' ? '45,000 VND (~$1.80)' : 'Budget transit fare',
      travelTime: '55 - 65 mins',
      recommended: false,
      howToBook: 'Bus stop is directly across terminal exit. Pay conductor in small cash onboard; stops near Old Quarter.',
      scamAlert: 'Keep your small backpack on your lap, avoid placing wallets in loose outer pockets.',
    },
  ]);

  const [localRule, setLocalRule] = useState<string>(
    'Always have your exact hotel address and phone number written in local native script to show the driver.'
  );

  const handleFetchAdvice = async () => {
    setIsLoading(true);
    try {
      const res = await CompanionAPI.getTransportAdvice({
        destination: destination.name,
        origin,
        destinationPlace,
        timeOfDay,
      });

      if (res.options) {
        setTransportOptions(res.options);
      }
      if (res.localTransportRule) {
        setLocalRule(res.localTransportRule);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-3">
          <Car className="w-3.5 h-3.5" />
          <span>Local Mobility & Anti-Scam Transit</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Transport Companion for {destination.name} {destination.flag}
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Navigate foreign transit systems like a savvy local. We explain fair fare ranges, verified ride-hailing apps, and the exact scams that target unsuspecting travelers at airports, stations, and street corners.
        </p>
      </div>

      {/* Route Query Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Pickup / Starting Point:
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Destination Place:
            </label>
            <input
              type="text"
              value={destinationPlace}
              onChange={(e) => setDestinationPlace(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Travel Time:
            </label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="Morning Peak (7am - 9am)">Morning Peak (7am - 9am)</option>
              <option value="Afternoon (Non-peak)">Afternoon (Non-peak)</option>
              <option value="Evening Rush (5pm - 7pm)">Evening Rush (5pm - 7pm)</option>
              <option value="Late Night (After 10pm)">Late Night (After 10pm)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleFetchAdvice}
            disabled={isLoading}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking Route Rates...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Transport Options</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Golden Rule Banner */}
      {localRule && (
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-2xl p-4 text-xs text-sky-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">Golden Rule for {destination.name}:</span>
            <p>{localRule}</p>
          </div>
        </div>
      )}

      {/* Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {transportOptions.map((opt, idx) => (
          <div
            key={idx}
            className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${
              opt.recommended
                ? 'border-sky-500/50 bg-sky-950/20'
                : 'border-slate-800'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{opt.type}</span>
                {opt.recommended && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    RECOMMENDED
                  </span>
                )}
              </div>

              <div>
                <span className="text-xl font-extrabold text-sky-300 font-mono block">
                  {opt.estimatedFare}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Navigation className="w-3 h-3" /> ~{opt.travelTime}
                </span>
              </div>

              {/* How to use */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs">
                <span className="font-bold text-slate-300 block mb-1">How to use:</span>
                <p className="text-slate-400 leading-relaxed">{opt.howToBook}</p>
              </div>

              {/* Scam Alert */}
              {opt.scamAlert && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-xs text-rose-300">
                  <span className="font-bold flex items-center gap-1 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Watch out:
                  </span>
                  <p className="text-[11px] text-slate-300">{opt.scamAlert}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trusted Taxi Brands & Apps Cheat Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-400" />
          <span>Verified Local Apps & Trusted Brands for {destination.name}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block font-semibold mb-1">Official Taxi Brands:</span>
            <ul className="space-y-1">
              {destination.trustedTaxiBrands.map((brand, i) => (
                <li key={i} className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{brand}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block font-semibold mb-1">Common Transit Scams to Dodge:</span>
            <ul className="space-y-1">
              {destination.commonScams.slice(0, 2).map((scam, i) => (
                <li key={i} className="text-slate-300 text-[11px] flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold shrink-0">•</span>
                  <span>{scam}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
