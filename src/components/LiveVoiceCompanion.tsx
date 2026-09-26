import React, { useState, useEffect, useRef } from 'react';
import { DestinationInfo, TravelVaultData } from '../types';
import { CompanionAPI } from '../services/api';
import { SpeechService } from '../services/speech';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  PhoneCall,
  PhoneOff,
  Sparkles,
  Radio,
  Sliders,
  RotateCcw,
  Languages,
  Send,
  HelpCircle,
  Activity,
  Globe2,
} from 'lucide-react';

interface LiveVoiceCompanionProps {
  destination: DestinationInfo;
  vault: TravelVaultData;
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_VOICE_LANGS = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', langName: 'English' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳', langName: 'English' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)', flag: '🇮🇳', langName: 'Tamil' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)', flag: '🇮🇳', langName: 'Hindi' },
  { code: 'vi-VN', name: 'Vietnamese (Tiếng Việt)', flag: '🇻🇳', langName: 'Vietnamese' },
  { code: 'ja-JP', name: 'Japanese (日本語)', flag: '🇯🇵', langName: 'Japanese' },
  { code: 'fr-FR', name: 'French (Français)', flag: '🇫🇷', langName: 'French' },
  { code: 'es-ES', name: 'Spanish (Español)', flag: '🇪🇸', langName: 'Spanish' },
  { code: 'de-DE', name: 'German (Deutsch)', flag: '🇩🇪', langName: 'German' },
  { code: 'it-IT', name: 'Italian (Italiano)', flag: '🇮🇹', langName: 'Italian' },
  { code: 'ko-KR', name: 'Korean (한국어)', flag: '🇰🇷', langName: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (中文)', flag: '🇨🇳', langName: 'Chinese' },
  { code: 'ar-SA', name: 'Arabic (العربية)', flag: '🇸🇦', langName: 'Arabic' },
  { code: 'th-TH', name: 'Thai (ไทย)', flag: '🇹🇭', langName: 'Thai' },
];

export const LiveVoiceCompanion: React.FC<LiveVoiceCompanionProps> = ({
  destination,
  vault,
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [lastUserTranscript, setLastUserTranscript] = useState('');
  const [lastCompanionReply, setLastCompanionReply] = useState(
    `Hello! I am your voice travel companion for ${destination.name}. Tap the mic to talk with me anytime in any language!`
  );
  const [autoConversation, setAutoConversation] = useState(true);
  const [isLoudBoost, setIsLoudBoost] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<'normal' | 'slow'>('normal');
  const [selectedUserLang, setSelectedUserLang] = useState('en-US');
  const [textFallbackInput, setTextFallbackInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const activeLangObj = SUPPORTED_VOICE_LANGS.find((l) => l.code === selectedUserLang) || SUPPORTED_VOICE_LANGS[0];

  useEffect(() => {
    SpeechService.setLoudBoost(isLoudBoost);
  }, [isLoudBoost]);

  useEffect(() => {
    if (!isOpen) {
      SpeechService.stop();
      recognitionRef.current?.stop();
      setStatus('idle');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessUserQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLastUserTranscript(queryText);
    setStatus('thinking');
    setErrorMessage(null);

    try {
      const res = await CompanionAPI.chatWithCompanion({
        messages: [],
        tripContext: {
          destination: destination.name,
          hotelName: vault.hotelName,
          hotelAddress: vault.hotelAddress,
          dietary: vault.dietaryNotes,
          currency: destination.currency,
          officialLanguage: destination.officialLanguage,
        },
        currentQuery: queryText,
        userLanguage: activeLangObj.langName,
        destination: destination.name,
      });

      const reply = res.reply;
      setLastCompanionReply(reply);
      setStatus('speaking');

      // Clean speech text from markdown asterisks and hash marks
      const plainText = reply.replace(/[*#_`[\]]/g, '').slice(0, 350);

      // Speak in user's language or target language with high audibility
      await SpeechService.speak(
        plainText,
        selectedUserLang,
        voiceSpeed === 'slow',
        'Kore'
      );

      if (autoConversation) {
        // Auto continue listening for conversational walkie-talkie experience
        setTimeout(() => {
          handleStartListening();
        }, 600);
      } else {
        setStatus('idle');
      }
    } catch (e: any) {
      console.warn('Voice chat error:', e);
      setStatus('idle');
      setErrorMessage('Could not process speech. Tap mic to retry.');
    }
  };

  const handleStartListening = () => {
    SpeechService.stop();
    setStatus('listening');
    setErrorMessage(null);

    const recognizer = SpeechService.startListening(
      selectedUserLang,
      (transcript) => {
        handleProcessUserQuery(transcript);
      },
      (err) => {
        console.warn('Voice error:', err);
        setErrorMessage(err);
        setStatus('idle');
      },
      () => {
        if (status === 'listening') {
          setStatus('idle');
        }
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
    } else {
      setStatus('idle');
    }
  };

  const handleStopAll = () => {
    SpeechService.stop();
    recognitionRef.current?.stop();
    setStatus('idle');
  };

  const repeatLastAudio = async () => {
    if (!lastCompanionReply) return;
    setStatus('speaking');
    const plainText = lastCompanionReply.replace(/[*#_`[\]]/g, '').slice(0, 350);
    await SpeechService.speak(plainText, selectedUserLang, voiceSpeed === 'slow', 'Kore');
    setStatus('idle');
  };

  const voiceSamplePrompts = [
    `Where can I eat vegetarian food in ${destination.capital}?`,
    `How much should a taxi cost from airport in ${destination.name}?`,
    `Say to local: "Please take me to ${vault.hotelName || 'my hotel'}"`,
    `Is 200,000 ${destination.currencySymbol} considered expensive here?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-7 flex flex-col items-center justify-between min-h-[620px] text-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Top Header bar */}
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 z-10 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{destination.flag}</span>
            <div className="text-left">
              <span className="text-sm font-extrabold text-white block">
                Live Voice Call Companion
              </span>
              <span className="text-[11px] text-sky-400 font-mono">
                {destination.name} • 100% Audible
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi-language Voice Selector */}
            <div className="relative">
              <select
                value={selectedUserLang}
                onChange={(e) => {
                  setSelectedUserLang(e.target.value);
                  handleStopAll();
                }}
                className="bg-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
                title="Select your spoken voice language"
              >
                {SUPPORTED_VOICE_LANGS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Loudness Booster Toggle */}
            <button
              onClick={() => setIsLoudBoost(!isLoudBoost)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isLoudBoost
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="150% volume boost for noisy streets & transit"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isLoudBoost ? '150% Boost' : '100%'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Middle Voice Wave Graphic & Central Button */}
        <div className="my-auto flex flex-col items-center justify-center py-4 z-10 w-full">
          <div className="relative flex items-center justify-center">
            {/* Outer animated ripple rings */}
            {status === 'listening' && (
              <>
                <div className="absolute w-44 h-44 rounded-full border-2 border-rose-500/50 animate-ping pointer-events-none" />
                <div className="absolute w-60 h-60 rounded-full border border-rose-500/25 animate-pulse pointer-events-none" />
              </>
            )}

            {status === 'speaking' && (
              <>
                <div className="absolute w-44 h-44 rounded-full border-2 border-sky-400/60 animate-ping pointer-events-none" />
                <div className="absolute w-60 h-60 rounded-full border border-sky-400/30 animate-pulse pointer-events-none" />
              </>
            )}

            {/* Central Master Microphone Orb */}
            <button
              onClick={status === 'listening' ? handleStopAll : handleStartListening}
              className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
                status === 'listening'
                  ? 'bg-rose-600 text-white shadow-rose-900/70 ring-4 ring-rose-500/50'
                  : status === 'speaking'
                  ? 'bg-sky-500 text-white shadow-sky-950 ring-4 ring-sky-400/50 animate-pulse'
                  : status === 'thinking'
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-400/40'
                  : 'bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 text-white shadow-sky-950'
              }`}
            >
              {status === 'listening' ? (
                <Mic className="w-12 h-12 animate-bounce" />
              ) : status === 'speaking' ? (
                <Volume2 className="w-12 h-12" />
              ) : status === 'thinking' ? (
                <Activity className="w-12 h-12 animate-spin" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </button>
          </div>

          {/* Status Label */}
          <div className="mt-5">
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                status === 'listening'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : status === 'speaking'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : status === 'thinking'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {status === 'listening'
                ? `Listening in ${activeLangObj.name}...`
                : status === 'thinking'
                ? 'Travel Companion is Thinking...'
                : status === 'speaking'
                ? 'Speaking Aloud (High Audibility)...'
                : 'Tap Orb to Speak Aloud'}
            </span>
          </div>

          {/* Quick Voice Prompt Chips */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-3 max-w-md">
            {voiceSamplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleProcessUserQuery(p)}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                &ldquo;{p}&rdquo;
              </button>
            ))}
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 mt-2 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Live Subtitle Transcript Area */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-2 text-left z-10 max-h-36 overflow-y-auto">
          {lastUserTranscript && (
            <p className="text-xs text-slate-400 mb-1.5 flex items-start gap-1.5">
              <span className="font-bold text-sky-400 shrink-0">You ({activeLangObj.langName}):</span>
              <span>&ldquo;{lastUserTranscript}&rdquo;</span>
            </p>
          )}
          <p className="text-sm font-semibold text-slate-100 leading-relaxed flex items-start gap-1.5">
            <span className="font-bold text-emerald-400 shrink-0">Companion:</span>
            <span>{lastCompanionReply}</span>
          </p>
        </div>

        {/* Text Fallback Input for Noisy Transit */}
        <div className="w-full flex items-center gap-2 z-10 my-1">
          <input
            type="text"
            value={textFallbackInput}
            onChange={(e) => setTextFallbackInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textFallbackInput.trim()) {
                handleProcessUserQuery(textFallbackInput);
                setTextFallbackInput('');
              }
            }}
            placeholder={`Or type in ${activeLangObj.langName} if surrounding is noisy...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={() => {
              if (textFallbackInput.trim()) {
                handleProcessUserQuery(textFallbackInput);
                setTextFallbackInput('');
              }
            }}
            className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>

        {/* Bottom Audio Toolbar */}
        <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 z-10">
          {/* Hands-free Auto Conversation */}
          <button
            onClick={() => setAutoConversation(!autoConversation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              autoConversation
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
            title="Automatically keeps listening after replying"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Hands-Free Loop</span>
          </button>

          {/* Repeat Audio Button */}
          <button
            onClick={repeatLastAudio}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Repeat aloud"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Repeat Audio</span>
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setVoiceSpeed(voiceSpeed === 'normal' ? 'slow' : 'normal')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-mono cursor-pointer"
            title="Toggle normal pace or slow learning pace"
          >
            {voiceSpeed === 'normal' ? '1.0x Pace' : '0.8x Slow'}
          </button>
        </div>
      </div>
    </div>
  );
};
