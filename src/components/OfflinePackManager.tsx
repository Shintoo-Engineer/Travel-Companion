import React, { useState, useEffect } from 'react';
import { DestinationInfo } from '../types';
import { POPULAR_DESTINATIONS, OFFLINE_PACKS } from '../data/offlinePacks';
import {
  DownloadCloud,
  CheckCircle2,
  HardDrive,
  Trash2,
  ShieldCheck,
  Languages,
  AlertTriangle,
  PhoneCall,
  WifiOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface OfflinePackManagerProps {
  currentDestination: DestinationInfo;
  onSelectDestination: (dest: DestinationInfo) => void;
}

export const OfflinePackManager: React.FC<OfflinePackManagerProps> = ({
  currentDestination,
  onSelectDestination,
}) => {
  const [downloadedPacks, setDownloadedPacks] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('downloaded_offline_packs');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    // By default, Vietnam and Japan are pre-cached!
    return { vietnam: true, japan: true };
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPack = (destId: string) => {
    setDownloadingId(destId);
    setTimeout(() => {
      setDownloadedPacks((prev) => {
        const updated = { ...prev, [destId]: true };
        try {
          localStorage.setItem('downloaded_offline_packs', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
        return updated;
      });
      setDownloadingId(null);
    }, 800);
  };

  const handleRemovePack = (destId: string) => {
    setDownloadedPacks((prev) => {
      const updated = { ...prev, [destId]: false };
      try {
        localStorage.setItem('downloaded_offline_packs', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-3">
          <DownloadCloud className="w-3.5 h-3.5" />
          <span>No-Data / Airplane Mode Preparedness</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Offline Destination Packs
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Landing at a foreign airport with zero mobile data, no local SIM card, or traveling through mountains? Download offline destination packs once and have 100% access to emergency numbers, audio survival phrases, scam alerts, and currency rates anywhere on Earth.
        </p>
      </div>

      {/* Offline Guarantees Badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Official Hotlines</span>
            <span className="text-[11px] text-slate-400">Police, Ambulance & Embassy numbers</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Voice Phrasebook</span>
            <span className="text-[11px] text-slate-400">Audio playback via browser speech</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Scam Defense</span>
            <span className="text-[11px] text-slate-400">Airport taxi tricks & meter fraud</span>
          </div>
        </div>
      </div>

      {/* Available Packs List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-sky-400" />
          <span>Available Destination Packs</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {POPULAR_DESTINATIONS.map((dest) => {
            const isDownloaded = !!downloadedPacks[dest.id];
            const isCurrentlySelected = currentDestination.id === dest.id;
            const isDownloading = downloadingId === dest.id;

            return (
              <div
                key={dest.id}
                className={`bg-slate-950 border rounded-2xl p-4 flex items-center justify-between gap-3 transition ${
                  isCurrentlySelected ? 'border-sky-500/60 ring-1 ring-sky-500/40' : 'border-slate-800/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{dest.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{dest.name}</h4>
                      {isCurrentlySelected && (
                        <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold">
                          ACTIVE TRIP
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {dest.officialLanguage} • {dest.currencySymbol} • ~45 KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDownloaded ? (
                    <>
                      <button
                        onClick={() => onSelectDestination(dest)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => handleRemovePack(dest.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                        title="Remove offline cache"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownloadPack(dest.id)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <span>Downloading...</span>
                      ) : (
                        <>
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
