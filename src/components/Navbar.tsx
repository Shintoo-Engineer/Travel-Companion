import React, { useState, useMemo } from 'react';
import { POPULAR_DESTINATIONS, resolveWorldwideDestination } from '../data/offlinePacks';
import { DestinationInfo } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { CompanionAPI } from '../services/api';
import {
  Compass,
  MessageSquareHeart,
  MapPin,
  Clock,
  Languages,
  UtensilsCrossed,
  Camera,
  Car,
  Wallet,
  ShieldAlert,
  DownloadCloud,
  FolderHeart,
  ChevronDown,
  Wifi,
  WifiOff,
  Menu,
  X,
  Search,
  Globe2,
  Mic,
  Sparkles,
} from 'lucide-react';

export type NavTab =
  | 'chat'
  | 'planner'
  | 'wherenow'
  | 'language'
  | 'food'
  | 'vision'
  | 'transport'
  | 'money'
  | 'emergency'
  | 'offline'
  | 'vault';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedDestination: DestinationInfo;
  onSelectDestination: (dest: DestinationInfo) => void;
  onOpenVoiceCall?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedDestination,
  onSelectDestination,
  onOpenVoiceCall,
}) => {
  const isOnline = useOnlineStatus();
  const [isDestMenuOpen, setIsDestMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [destSearchQuery, setDestSearchQuery] = useState('');

  const filteredDestinations = useMemo(() => {
    if (!destSearchQuery.trim()) return POPULAR_DESTINATIONS;
    const q = destSearchQuery.toLowerCase();
    return POPULAR_DESTINATIONS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.capital.toLowerCase().includes(q) ||
        (d.region && d.region.toLowerCase().includes(q))
    );
  }, [destSearchQuery]);

  const handleCustomSearchSelect = async (query: string) => {
    if (!query.trim()) return;
    setIsDestMenuOpen(false);
    setDestSearchQuery('');
    
    // Immediate fallback response
    const localResolved = resolveWorldwideDestination(query);
    onSelectDestination(localResolved);

    // If online, enrich with full worldwide geographic details from Gemini
    if (isOnline) {
      try {
        const enriched = await CompanionAPI.resolveDestination(query);
        if (enriched && enriched.name) {
          onSelectDestination(enriched);
        }
      } catch (e) {
        // keep localResolved
      }
    }
  };

  const navItems = [
    { id: 'chat' as NavTab, label: 'Ask Companion', icon: MessageSquareHeart, highlight: true },
    { id: 'planner' as NavTab, label: 'Plan My Trip', icon: MapPin },
    { id: 'wherenow' as NavTab, label: 'Where Now?', icon: Clock },
    { id: 'language' as NavTab, label: 'Voice & Language', icon: Languages },
    { id: 'food' as NavTab, label: 'Food Intelligence', icon: UtensilsCrossed },
    { id: 'vision' as NavTab, label: 'Camera Vision', icon: Camera },
    { id: 'transport' as NavTab, label: 'Transport', icon: Car },
    { id: 'money' as NavTab, label: 'Money & Wallet', icon: Wallet },
    { id: 'emergency' as NavTab, label: 'Safety & SOS', icon: ShieldAlert, alert: true },
    { id: 'offline' as NavTab, label: 'Offline Packs', icon: DownloadCloud },
    { id: 'vault' as NavTab, label: 'Trip Vault', icon: FolderHeart },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSelectTab('chat')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition">
              <Compass className="h-6 w-6 text-white" />
              <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white">
                  Travel Companion
                </span>
                <span className="hidden sm:inline-block rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                  GLOBAL 🌍
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                “Go Anywhere. Never Travel Alone.”
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right controls: Destination Selector, Voice Call, Online status, PWA, SOS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* World Destination Dropdown & Search */}
          <div className="relative">
            <button
              onClick={() => setIsDestMenuOpen(!isDestMenuOpen)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition shadow-inner cursor-pointer"
            >
              <span className="text-base">{selectedDestination.flag}</span>
              <span className="font-bold">{selectedDestination.name}</span>
              <span className="text-[11px] text-slate-400 hidden lg:inline">
                ({selectedDestination.currencySymbol})
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDestMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
                    <Globe2 className="w-4 h-4" />
                    <span>Go Anywhere in the World</span>
                  </div>
                  <button
                    onClick={() => setIsDestMenuOpen(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar for ANY Destination */}
                <div className="relative my-2.5">
                  <input
                    type="text"
                    value={destSearchQuery}
                    onChange={(e) => setDestSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && destSearchQuery.trim()) {
                        handleCustomSearchSelect(destSearchQuery);
                      }
                    }}
                    placeholder="Search any country or city (e.g. Rome, Bali, Tokyo, Iceland)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pl-8 text-xs text-white focus:outline-none focus:border-sky-500 placeholder-slate-500"
                    autoFocus
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {/* Custom Destination Option if not exact match */}
                {destSearchQuery.trim() && (
                  <button
                    onClick={() => handleCustomSearchSelect(destSearchQuery)}
                    className="w-full flex items-center justify-between bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl p-2.5 text-xs text-sky-300 font-bold mb-2 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>Explore &ldquo;{destSearchQuery}&rdquo; Worldwide</span>
                    </div>
                    <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded font-mono">
                      LOAD
                    </span>
                  </button>
                )}

                {/* Popular Pre-cached Destinations Grid */}
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 py-1">
                    Worldwide Destinations:
                  </span>
                  {filteredDestinations.map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => {
                        onSelectDestination(dest);
                        setIsDestMenuOpen(false);
                        setDestSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition cursor-pointer ${
                        selectedDestination.id === dest.id
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{dest.flag}</span>
                        <div>
                          <p className="font-bold text-slate-100">{dest.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {dest.capital} • {dest.officialLanguage}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {dest.currencySymbol}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Live Voice Call Companion Button */}
          {onOpenVoiceCall && (
            <button
              onClick={onOpenVoiceCall}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-sky-950 transition cursor-pointer group"
              title="Open Live Voice Conversation Companion"
            >
              <div className="relative">
                <Mic className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="hidden sm:inline">Voice Call</span>
            </button>
          )}

          {/* Online/Offline indicator chip */}
          <div
            className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
            title={isOnline ? 'Online with cloud AI features' : 'Offline with local packs active'}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-amber-400" />
            )}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Quick SOS Trigger */}
          <button
            onClick={() => onSelectTab('emergency')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-rose-900/60 ring-2 ring-rose-500/50 transition cursor-pointer animate-pulse"
            title="Emergency SOS: Nearest Hospitals, Doctors & Police"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Horizontal Navigation Pill Bar */}
      <div className="hidden md:block border-t border-slate-800/60 bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? item.alert
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                      : 'bg-sky-500 text-white shadow-md shadow-sky-950'
                    : item.highlight
                    ? 'bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.alert ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-3 space-y-1 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? item.alert
                        ? 'bg-rose-600 text-white'
                        : 'bg-sky-500 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

