import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-2xl border border-amber-400/30 transition-all">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/80 animate-pulse">
        <WifiOff className="w-3.5 h-3.5 text-white" />
      </div>
      <div>
        <span className="block font-bold">Offline Mode Active</span>
        <span className="text-amber-100 text-[11px] font-normal flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-300 inline" />
          Offline packs, phrasebooks, SOS & wallet working
        </span>
      </div>
    </div>
  );
};
