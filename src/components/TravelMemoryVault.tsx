import React, { useState, useEffect } from 'react';
import { DestinationInfo, TravelVaultData } from '../types';
import {
  FolderHeart,
  Save,
  CheckCircle2,
  Shield,
  Hotel,
  Plane,
  Phone,
  User,
  Heart,
  FileText,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';

interface TravelMemoryVaultProps {
  destination: DestinationInfo;
  vaultData: TravelVaultData;
  onUpdateVault: (data: TravelVaultData) => void;
}

export const TravelMemoryVault: React.FC<TravelMemoryVaultProps> = ({
  destination,
  vaultData,
  onUpdateVault,
}) => {
  const [formData, setFormData] = useState<TravelVaultData>(vaultData);
  const [isSaved, setIsSaved] = useState(false);

  // Visited places tracker
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`visited_places_${destination.id}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return destination.id === 'vietnam'
      ? ['Hoan Kiem Lake', 'St. Joseph Cathedral', 'Dong Xuan Night Market']
      : ['Central Historical Monument', 'Old Market'];
  });

  const [newPlaceInput, setNewPlaceInput] = useState('');

  // Trip Memory Journal Summary
  const [tripSummary, setTripSummary] = useState<string>(
    `Trip: ${destination.name} (Day 3)\nStaying at ${vaultData.hotelName || 'Old Quarter Boutique'}.\nDietary: ${vaultData.dietaryNotes || 'Vegetarian'}.\nVisited: ${visitedPlaces.join(', ')}.\nEmergency contact: ${vaultData.emergencyContactName || 'Family'} (${vaultData.emergencyContactPhone || 'Not set'}).`
  );

  useEffect(() => {
    try {
      localStorage.setItem(`visited_places_${destination.id}`, JSON.stringify(visitedPlaces));
    } catch (e) {
      // ignore
    }
  }, [visitedPlaces, destination.id]);

  const handleSaveVault = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVault(formData);
    try {
      localStorage.setItem(`travel_vault_data`, JSON.stringify(formData));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      console.warn('Storage error:', e);
    }
  };

  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceInput.trim()) return;
    setVisitedPlaces((prev) => [...prev, newPlaceInput.trim()]);
    setNewPlaceInput('');
  };

  const handleRemovePlace = (index: number) => {
    setVisitedPlaces((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-3">
          <FolderHeart className="w-3.5 h-3.5" />
          <span>Trip Memory & Offline Safe</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Personal Travel Memory & Vault
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Your travel companion remembers everything about your journey so you never have to repeat your preferences, hotel addresses, or emergency numbers. Stored securely on your device for instant offline access.
        </p>
      </div>

      {/* Grid: Vault Editor + Memory Journal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safe Document Vault */}
        <form
          onSubmit={handleSaveVault}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Offline Travel Document Vault</span>
            </h3>
            {isSaved && (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Traveler Full Name:</span>
              </label>
              <input
                type="text"
                value={formData.travelerName}
                onChange={(e) => setFormData({ ...formData, travelerName: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Passport Number:</span>
              </label>
              <input
                type="text"
                value={formData.passportNumber}
                onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                placeholder="e.g. Z1234567"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Hotel className="w-3.5 h-3.5 text-sky-400" />
                  <span>Hotel Name:</span>
                </label>
                <input
                  type="text"
                  value={formData.hotelName}
                  onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  placeholder="e.g. Old Quarter Palace"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">
                  Room #:
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. 402"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Hotel Full Address (Show to Taxi Drivers):
              </label>
              <input
                type="text"
                value={formData.hotelAddress}
                onChange={(e) => setFormData({ ...formData, hotelAddress: e.target.value })}
                placeholder="e.g. 15 Hang Gai, Hoan Kiem, Hanoi"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-rose-400" />
                  <span>Emergency Contact Name:</span>
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="e.g. Mom / Brother"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">
                  Phone (+code):
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Dietary & Medical Allergies:
              </label>
              <input
                type="text"
                value={formData.dietaryNotes}
                onChange={(e) => setFormData({ ...formData, dietaryNotes: e.target.value })}
                placeholder="e.g. Pure Vegetarian, Peanut allergy"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Offline Memory Vault</span>
            </button>
          </div>
        </form>

        {/* Visited Places Log & Memory Summary */}
        <div className="space-y-4">
          {/* Places Visited Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Visited Places on This Trip</span>
            </h3>

            {/* Add new place */}
            <form onSubmit={handleAddPlace} className="flex gap-2">
              <input
                type="text"
                value={newPlaceInput}
                onChange={(e) => setNewPlaceInput(e.target.value)}
                placeholder="Add place visited today..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-3 py-1.5 rounded-xl text-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Places List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {visitedPlaces.map((place, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-200 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{place}</span>
                  </span>
                  <button
                    onClick={() => handleRemovePlace(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Companion Memory Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Companion Context Brief</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">AUTOSYNCED</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono whitespace-pre-wrap">
              {tripSummary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
