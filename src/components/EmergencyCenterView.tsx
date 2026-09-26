import React, { useState, useEffect } from 'react';
import { DestinationInfo, TravelVaultData, NearestEmergencyResult, HospitalInfo, DoctorHotlineInfo, PoliceStationInfo } from '../types';
import { OFFLINE_PACKS } from '../data/offlinePacks';
import { CompanionAPI } from '../services/api';
import { SpeechService } from '../services/speech';
import {
  ShieldAlert,
  PhoneCall,
  Volume2,
  FileText,
  AlertTriangle,
  Hospital,
  Stethoscope,
  Building2,
  Navigation,
  MapPin,
  CheckCircle2,
  X,
  Maximize2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  LocateFixed,
  Car,
  Compass,
  Clock,
  Check,
  Search,
} from 'lucide-react';

interface EmergencyCenterViewProps {
  destination: DestinationInfo;
  vault: TravelVaultData;
}

export const EmergencyCenterView: React.FC<EmergencyCenterViewProps> = ({
  destination,
  vault,
}) => {
  const pack = OFFLINE_PACKS[destination.id] || OFFLINE_PACKS['vietnam'];

  // Geolocation & Emergency Locator State
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>(
    vault.hotelAddress ? `${vault.hotelAddress}` : `${destination.capital} Central District`
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locatorFilter, setLocatorFilter] = useState<'all' | 'hospitals' | 'doctors' | 'police'>('all');
  const [emergencyData, setEmergencyData] = useState<NearestEmergencyResult | null>(null);
  const [isLoadingEmergency, setIsLoadingEmergency] = useState<boolean>(false);

  // Driver presentation modal
  const [driverModalItem, setDriverModalItem] = useState<{
    title: string;
    nativeTitle?: string;
    address: string;
    nativeAddress?: string;
    emergencyPhrase: string;
    nativePhrase: string;
    phoneticPhrase: string;
    phone: string;
  } | null>(null);

  // Protocols & Situations State
  const emergencyScenarios = [
    { id: 'lost_passport', title: '🛂 Lost or Stolen Passport', urgency: 'CRITICAL', icon: '🛂' },
    { id: 'medical', title: '🏥 Urgent Medical / Injury', urgency: 'HIGH', icon: '🏥' },
    { id: 'police_theft', title: '🚔 Theft, Robbery or Assault', urgency: 'HIGH', icon: '🚔' },
    { id: 'lost_phone', title: '📱 Lost Phone, SIM or Bank Cards', urgency: 'MODERATE', icon: '📱' },
    { id: 'scam_dispute', title: '🚕 Taxi Overcharge / Extortion', urgency: 'MODERATE', icon: '🚕' },
  ];

  const [selectedScenario, setSelectedScenario] = useState<string>('medical');
  const [activeGuide, setActiveGuide] = useState<any>({
    title: 'Urgent Medical & Injury Protocol',
    urgency: 'HIGH',
    steps: [
      { step: 1, title: 'Call Emergency Medical Dispatch Immediately', detail: `Call ${pack.emergencyContacts.find(c => c.name.toLowerCase().includes('ambulance') || c.name.toLowerCase().includes('medical'))?.number || '115'} or the verified nearest 24/7 hospital ER.` },
      { step: 2, title: 'Locate Nearest Hospital with English Doctors', detail: 'Check the live locator cards below to see hospital distances, on-call doctor phone numbers, and emergency surgical units.' },
      { step: 3, title: 'Show Hospital Address to Driver in Local Script', detail: 'Tap "Show Taxi Driver" below to display the hospital address in full-screen local script so your driver gets you there directly.' },
      { step: 4, title: 'Notify Your Insurance 24/7 Hotline', detail: `Keep your policy number (${vault.insurancePolicyNumber || 'stored in Trip Vault'}) ready for emergency hospital admissions.` },
    ],
    officialContacts: pack.emergencyContacts,
    phrasesToShow: pack.survivalPhrases.filter((p) => p.category === 'Emergency'),
    reassurance: 'You are safe. Professional emergency medical care is accessible near your location.',
  });

  const [fullscreenPhrase, setFullscreenPhrase] = useState<any | null>(null);

  // Fetch nearest emergency services on load or location update
  const fetchNearestServices = async (lat?: number, lng?: number, neighborhoodOverride?: string) => {
    setIsLoadingEmergency(true);
    try {
      const result = await CompanionAPI.getNearestEmergencyServices({
        destination: destination.name,
        city: destination.capital,
        neighborhood: neighborhoodOverride || locationName,
        latitude: lat,
        longitude: lng,
      });
      setEmergencyData(result);
    } catch (e) {
      console.warn('Error fetching emergency services:', e);
    } finally {
      setIsLoadingEmergency(false);
    }
  };

  useEffect(() => {
    fetchNearestServices(gpsLocation?.lat, gpsLocation?.lng);
  }, [destination]);

  // Request browser GPS position
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsLocation({ lat: latitude, lng: longitude });
        const autoLocDesc = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) - Near ${destination.capital}`;
        setLocationName(autoLocDesc);
        setIsLocating(false);
        fetchNearestServices(latitude, longitude, autoLocDesc);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setIsLocating(false);
        // Fallback to destination capital neighborhood
        fetchNearestServices(undefined, undefined, `${destination.capital} Central`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectScenario = async (scId: string) => {
    setSelectedScenario(scId);
    try {
      const res = await CompanionAPI.getEmergencyGuide({
        emergencyType: scId,
        destination: destination.name,
        userNationality: 'Foreign Traveler',
        currentCity: destination.capital,
      });
      setActiveGuide(res.emergency);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeakPhrase = (text: string, lang = destination.speechVoiceLang) => {
    SpeechService.speak(text, lang, false);
  };

  const openGoogleMapsDirections = (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Red Alert Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-600/50 rounded-3xl p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>SOS EMERGENCY COMMAND CENTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Nearest Emergency Services & Doctor Numbers</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Find verified nearest hospitals, on-call doctor hotlines, and local police stations near your exact location in <strong className="text-white">{destination.name} {destination.flag}</strong>.
            </p>
          </div>

          {/* Quick GPS Geolocation Trigger */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <button
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-rose-950/60 transition cursor-pointer active:scale-95 disabled:opacity-70"
            >
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting GPS...' : '📍 Locate Nearest to Me Now'}</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              {gpsLocation ? `GPS: ${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : `Location: ${locationName}`}
            </span>
          </div>
        </div>

        {/* Location Search Bar to Change Neighborhood */}
        <div className="mt-4 pt-3 border-t border-rose-900/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchNearestServices(undefined, undefined, locationName);
                }
              }}
              placeholder={`Type your current neighborhood/hotel (e.g. Old Quarter Hanoi, Shinjuku Tokyo, District 1)...`}
              className="w-full bg-slate-950/90 border border-rose-900/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            onClick={() => fetchNearestServices(undefined, undefined, locationName)}
            disabled={isLoadingEmergency}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Area</span>
          </button>
        </div>
      </div>

      {/* Instant 1-Tap Emergency Hotlines Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-rose-400" />
            <span>National 1-Tap Quick Dial ({destination.name})</span>
          </h3>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20 font-bold">
            24/7 VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Police */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Police Emergency
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5 block">
                {emergencyData?.generalEmergency?.police || pack.emergencyContacts[0]?.number || '112'}
              </span>
            </div>
            <a
              href={`tel:${(emergencyData?.generalEmergency?.police || pack.emergencyContacts[0]?.number || '112').replace(/\s+/g, '')}`}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-center text-xs flex items-center justify-center gap-1 shadow transition cursor-pointer"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call Police</span>
            </a>
          </div>

          {/* Ambulance / Medical */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Ambulance & Doctor
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                {emergencyData?.generalEmergency?.ambulance || pack.emergencyContacts[1]?.number || '115'}
              </span>
            </div>
            <a
              href={`tel:${(emergencyData?.generalEmergency?.ambulance || pack.emergencyContacts[1]?.number || '115').replace(/\s+/g, '')}`}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-center text-xs flex items-center justify-center gap-1 shadow transition cursor-pointer"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call Ambulance</span>
            </a>
          </div>

          {/* Fire */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Fire & Rescue
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block">
                {emergencyData?.generalEmergency?.fire || '114'}
              </span>
            </div>
            <a
              href={`tel:${(emergencyData?.generalEmergency?.fire || '114').replace(/\s+/g, '')}`}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-center text-xs flex items-center justify-center gap-1 shadow transition cursor-pointer"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call Fire</span>
            </a>
          </div>

          {/* Tourist Police */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tourist Hotline
              </span>
              <span className="text-sm sm:text-base font-extrabold text-sky-400 font-mono mt-1 block truncate">
                {emergencyData?.generalEmergency?.touristHotline || pack.emergencyContacts[3]?.number || '112'}
              </span>
            </div>
            <a
              href={`tel:${(emergencyData?.generalEmergency?.touristHotline || pack.emergencyContacts[3]?.number || '112').replace(/[^0-9+]/g, '')}`}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-center text-xs flex items-center justify-center gap-1 shadow transition cursor-pointer"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call Hotline</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Nearest Services */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setLocatorFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              locatorFilter === 'all'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setLocatorFilter('hospitals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              locatorFilter === 'hospitals'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hospital className="w-3.5 h-3.5" />
            <span>Hospitals & ER ({emergencyData?.nearestHospitals?.length || 0})</span>
          </button>
          <button
            onClick={() => setLocatorFilter('doctors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              locatorFilter === 'doctors'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Hotlines ({emergencyData?.doctorConsultations?.length || 0})</span>
          </button>
          <button
            onClick={() => setLocatorFilter('police')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              locatorFilter === 'police'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Police Stations ({emergencyData?.nearestPoliceStations?.length || 0})</span>
          </button>
        </div>

        {emergencyData?.detectedArea && (
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Area: {emergencyData.detectedArea}</span>
          </span>
        )}
      </div>

      {isLoadingEmergency && (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl animate-pulse">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-2" />
          <p className="text-sm font-bold text-white">Locating nearest hospitals, doctors, and police stations...</p>
        </div>
      )}

      {/* NEAREST HOSPITALS SECTION */}
      {(!isLoadingEmergency && (locatorFilter === 'all' || locatorFilter === 'hospitals')) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Hospital className="w-5 h-5 text-rose-500" />
              <span>Nearest Emergency Hospitals & Trauma Centers</span>
            </h3>
            <span className="text-xs text-slate-400">24/7 ER Doctors on Duty</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyData?.nearestHospitals?.map((hospital, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-extrabold text-white">{hospital.name}</h4>
                      {hospital.nativeName && (
                        <p className="text-xs text-sky-400 font-semibold mt-0.5">
                          {hospital.nativeName}
                        </p>
                      )}
                    </div>
                    <span className="bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 font-mono">
                      📍 {hospital.distance}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>{hospital.doctorType || '24/7 Emergency Room & Trauma Center'}</span>
                  </p>

                  {/* Doctor Phone Highlight */}
                  <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                        Direct Doctor / ER Phone:
                      </span>
                      <span className="text-base font-black text-rose-400 font-mono">
                        {hospital.doctorPhone}
                      </span>
                    </div>
                    <a
                      href={`tel:${hospital.doctorPhone.replace(/[^0-9+]/g, '')}`}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow transition cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call ER Doctor</span>
                    </a>
                  </div>

                  {/* Address */}
                  <div className="mt-2.5 text-xs text-slate-400">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{hospital.address}</span>
                    </p>
                    {hospital.nativeAddress && (
                      <p className="text-[11px] text-slate-300 italic pl-5 mt-0.5">
                        Native: {hospital.nativeAddress}
                      </p>
                    )}
                  </div>

                  {/* Services pills */}
                  {hospital.services && hospital.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {hospital.services.map((svc, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 font-medium"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openGoogleMapsDirections(hospital.nativeAddress || hospital.address)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-sky-400" />
                    <span>Get Directions</span>
                  </button>

                  <button
                    onClick={() =>
                      setDriverModalItem({
                        title: hospital.name,
                        nativeTitle: hospital.nativeName,
                        address: hospital.address,
                        nativeAddress: hospital.nativeAddress,
                        emergencyPhrase: 'Please take me to this emergency hospital immediately!',
                        nativePhrase: destination.id === 'vietnam' ? 'Làm ơn đưa tôi đến bệnh viện cấp cứu này ngay lập tức!' : 'この救急病院へ連れて行ってください！',
                        phoneticPhrase: destination.id === 'vietnam' ? 'Lam un doo-uh toy den benh vee-en cup coo nay ngay lup took!' : 'Kono kyuukyuu byouin e tsurete itte kudasai!',
                        phone: hospital.doctorPhone,
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Show Taxi Driver</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 24/7 DOCTOR HOTLINES SECTION */}
      {(!isLoadingEmergency && (locatorFilter === 'all' || locatorFilter === 'doctors')) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              <span>24/7 On-Call Doctor Hotlines & Medical Clinics</span>
            </h3>
            <span className="text-xs text-slate-400">English Speaking Physicians</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyData?.doctorConsultations?.map((doc, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-extrabold text-white">{doc.name}</h4>
                      {doc.nativeName && (
                        <p className="text-xs text-emerald-400 font-semibold mt-0.5">{doc.nativeName}</p>
                      )}
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {doc.hours}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    🩺 Specialty: {doc.doctorSpecialty}
                  </p>

                  {doc.address && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{doc.address}</span>
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    {doc.phone}
                  </span>
                  <a
                    href={`tel:${doc.directCallNumber || doc.phone.replace(/[^0-9+]/g, '')}`}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Doctor Now</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEAREST POLICE STATIONS SECTION */}
      {(!isLoadingEmergency && (locatorFilter === 'all' || locatorFilter === 'police')) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Nearest Police Stations & Ward Substations</span>
            </h3>
            <span className="text-xs text-slate-400">Loss Reports, Theft & Disputes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyData?.nearestPoliceStations?.map((station, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-extrabold text-white">{station.name}</h4>
                      {station.nativeName && (
                        <p className="text-xs text-indigo-300 font-semibold mt-0.5">{station.nativeName}</p>
                      )}
                    </div>
                    <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono shrink-0">
                      📍 {station.distance}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    🛡️ Station Type: {station.type}
                  </p>

                  <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                        Station Desk Phone:
                      </span>
                      <span className="text-base font-black text-indigo-400 font-mono">
                        {station.phone}
                      </span>
                    </div>
                    <a
                      href={`tel:${station.phone.replace(/[^0-9+]/g, '')}`}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow transition cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Station</span>
                    </a>
                  </div>

                  <div className="mt-2.5 text-xs text-slate-400">
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{station.address}</span>
                    </p>
                    {station.nativeAddress && (
                      <p className="text-[11px] text-slate-300 italic pl-5 mt-0.5">
                        Native: {station.nativeAddress}
                      </p>
                    )}
                  </div>

                  {station.touristServices && (
                    <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800 mt-2.5">
                      <span className="font-bold text-sky-400">Services:</span> {station.touristServices}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openGoogleMapsDirections(station.nativeAddress || station.address)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-sky-400" />
                    <span>Get Directions</span>
                  </button>

                  <button
                    onClick={() =>
                      setDriverModalItem({
                        title: station.name,
                        nativeTitle: station.nativeName,
                        address: station.address,
                        nativeAddress: station.nativeAddress,
                        emergencyPhrase: 'Please take me to this police station immediately!',
                        nativePhrase: destination.id === 'vietnam' ? 'Làm ơn đưa tôi đến đồn công an này ngay bây giờ!' : 'この警察署へ連れて行ってください！',
                        phoneticPhrase: destination.id === 'vietnam' ? 'Lam un doo-uh toy den don com un nay ngay bay zew!' : 'Kono keisatsusho e tsurete itte kudasai!',
                        phone: station.phone,
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Show Taxi Driver</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Scenario Protocol Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white">
            Official Situation Protocols & Step-by-Step Guides
          </h3>
          <span className="text-xs text-slate-400">Choose situation below</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {emergencyScenarios.map((sc) => {
            const isSelected = selectedScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-600/20 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <span className="text-2xl mb-1">{sc.icon}</span>
                <span className="font-bold text-xs line-clamp-2">{sc.title}</span>
                <span className="text-[10px] text-rose-400 font-mono mt-2 font-semibold">
                  {sc.urgency}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Guide Steps */}
        {activeGuide && (
          <div className="pt-3 border-t border-slate-800 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                  Action Steps
                </span>
                <h4 className="text-lg font-extrabold text-white">{activeGuide.title}</h4>
              </div>
              {activeGuide.reassurance && (
                <p className="text-xs text-slate-400 italic max-w-md">
                  &ldquo;{activeGuide.reassurance}&rdquo;
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeGuide.steps?.map((st: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-500/30 mt-0.5">
                    {st.step || idx + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{st.title}</h5>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{st.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Crucial Emergency Phrases to Show Screen */}
            <div className="pt-3 border-t border-slate-800">
              <h5 className="text-xs font-extrabold text-white mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Crucial Emergency Phrases (Show directly to Police or Doctor):</span>
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeGuide.phrasesToShow?.map((phrase: any, i: number) => (
                  <div
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs text-slate-400">{phrase.english}</span>
                      <p className="text-sm sm:text-base font-extrabold text-white mt-1">
                        {phrase.native}
                      </p>
                      <p className="text-xs font-mono text-sky-300 mt-1 italic">
                        🗣️ {phrase.phonetic}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between">
                      <button
                        onClick={() => handleSpeakPhrase(phrase.native)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold transition cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak Aloud</span>
                      </button>

                      <button
                        onClick={() => setFullscreenPhrase(phrase)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Show Big Screen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN DRIVER PRESENTATION MODAL */}
      {driverModalItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-150 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="text-sm font-extrabold text-rose-500 tracking-wider uppercase flex items-center gap-2">
              <Car className="w-5 h-5 text-rose-400" />
              <span>SHOW THIS TO TAXI DRIVER / POLICE</span>
            </span>
            <button
              onClick={() => setDriverModalItem(null)}
              className="p-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="my-auto text-center space-y-6 max-w-4xl mx-auto py-6">
            <span className="text-base sm:text-lg text-slate-400 font-semibold block uppercase tracking-wider">
              {driverModalItem.emergencyPhrase}
            </span>

            {/* Giant Native Phrase */}
            <p className="text-3xl sm:text-5xl font-black text-rose-400 leading-tight select-all">
              {driverModalItem.nativePhrase}
            </p>

            <p className="text-lg sm:text-2xl font-mono text-sky-300 italic">
              &ldquo;{driverModalItem.phoneticPhrase}&rdquo;
            </p>

            {/* Giant Destination Address Box */}
            <div className="bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-6 sm:p-8 text-left shadow-2xl">
              <span className="text-xs text-sky-400 font-bold uppercase tracking-wider block mb-1">
                Destination Address (ĐỊA CHỈ ĐẾN / 行き先):
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                {driverModalItem.nativeTitle || driverModalItem.title}
              </h2>
              <p className="text-xl sm:text-3xl font-black text-amber-300 mt-2 select-all">
                {driverModalItem.nativeAddress || driverModalItem.address}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-3 font-mono">
                Direct Emergency Phone: <span className="text-white font-bold">{driverModalItem.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSpeakPhrase(driverModalItem.nativePhrase)}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm shadow-xl cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              <span>Speak Phrase Aloud</span>
            </button>

            <button
              onClick={() => openGoogleMapsDirections(driverModalItem.nativeAddress || driverModalItem.address)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm border border-slate-700 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Open in Google Maps</span>
            </button>

            <a
              href={`tel:${driverModalItem.phone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Now</span>
            </a>

            <button
              onClick={() => setDriverModalItem(null)}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHRASE MODAL */}
      {fullscreenPhrase && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="text-sm font-bold text-rose-400 tracking-wider uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              EMERGENCY ASSISTANCE CARD
            </span>
            <button
              onClick={() => setFullscreenPhrase(null)}
              className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="my-auto text-center space-y-6 max-w-3xl mx-auto">
            <span className="text-lg text-slate-400 font-semibold block">
              {fullscreenPhrase.english}
            </span>

            <p className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-wide select-all">
              {fullscreenPhrase.native}
            </p>

            <p className="text-xl sm:text-2xl font-mono text-sky-400 italic">
              &ldquo;{fullscreenPhrase.phonetic}&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleSpeakPhrase(fullscreenPhrase.native)}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              <span>Speak Aloud</span>
            </button>
            <button
              onClick={() => setFullscreenPhrase(null)}
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-base border border-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
