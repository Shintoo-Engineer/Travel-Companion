import React, { useState, useRef } from 'react';
import { DestinationInfo, PhraseItem } from '../types';
import { OFFLINE_PACKS } from '../data/offlinePacks';
import { CompanionAPI } from '../services/api';
import { SpeechService } from '../services/speech';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  ArrowRightLeft,
  Sparkles,
  BookOpen,
  Send,
  Check,
  Copy,
  MessageSquare,
  AlertCircle,
  Ear,
  Play,
} from 'lucide-react';

interface LanguageCompanionViewProps {
  destination: DestinationInfo;
}

export const LanguageCompanionView: React.FC<LanguageCompanionViewProps> = ({
  destination,
}) => {
  const [activeMode, setActiveMode] = useState<'conversation' | 'translator' | 'phrasebook'>('conversation');

  // Conversation Mode State
  const [userLang, setUserLang] = useState('en-US'); // e.g. en-US, ta-IN, hi-IN, fr-FR
  const [userLangName, setUserLangName] = useState('English');
  const targetVoiceLang = destination.speechVoiceLang; // e.g. vi-VN, ja-JP
  const targetLangName = destination.officialLanguage;

  const [conversationHistory, setConversationHistory] = useState<Array<{
    speaker: 'traveler' | 'local';
    originalText: string;
    translatedText: string;
    phonetic?: string;
  }>>([
    {
      speaker: 'local',
      originalText: destination.id === 'vietnam' ? 'Bạn muốn đi đâu?' : 'どこへ行きたいですか？',
      translatedText: 'Where would you like to go?',
      phonetic: destination.id === 'vietnam' ? 'Bun moon dee dow?' : 'Doko e ikitai desu ka?',
    },
    {
      speaker: 'traveler',
      originalText: 'I want to go to the Old Quarter Central Hotel, please.',
      translatedText: destination.id === 'vietnam' ? 'Làm ơn cho tôi đến Khách sạn Trung tâm Phố Cổ.' : 'オールドクォーターセントラルホテルまでお願いします。',
      phonetic: destination.id === 'vietnam' ? 'Lam un chaw toy den Kack sun Troong tum Fo Co.' : 'Oorudo kwoutaa sentoraru hoteru made onegaishimasu.',
    },
  ]);

  const [isListeningTraveler, setIsListeningTraveler] = useState(false);
  const [isListeningLocal, setIsListeningLocal] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Text Translator State
  const [inputText, setInputText] = useState('');
  const [translatedResult, setTranslatedResult] = useState<any>(null);
  const [situationTag, setSituationTag] = useState('General');

  // Phrasebook State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const pack = OFFLINE_PACKS[destination.id] || OFFLINE_PACKS['vietnam'];
  const survivalPhrases = pack.survivalPhrases || [];

  const [speakingPhraseId, setSpeakingPhraseId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSpeak = async (id: string, text: string, lang: string, slow = false) => {
    setSpeakingPhraseId(id);
    await SpeechService.speak(text, lang, slow);
    setSpeakingPhraseId(null);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Start Voice for Traveler
  const startTravelerSpeech = () => {
    if (isListeningTraveler) {
      SpeechService.stop();
      setIsListeningTraveler(false);
      return;
    }

    setIsListeningTraveler(true);
    SpeechService.startListening(
      userLang,
      async (transcript) => {
        setIsListeningTraveler(false);
        setIsTranslating(true);
        try {
          const res = await CompanionAPI.translateText({
            text: transcript,
            sourceLanguage: userLangName,
            targetLanguage: targetLangName,
            destination: destination.name,
          });

          const trans = res.translation;
          setConversationHistory((prev) => [
            ...prev,
            {
              speaker: 'traveler',
              originalText: transcript,
              translatedText: trans.translatedText,
              phonetic: trans.phoneticPronunciation,
            },
          ]);

          // Automatically speak translated phrase in local voice so local understands!
          await SpeechService.speak(trans.translatedText, targetVoiceLang);
        } catch (e) {
          console.error(e);
        } finally {
          setIsTranslating(false);
        }
      },
      (err) => {
        console.warn(err);
        setIsListeningTraveler(false);
      },
      () => setIsListeningTraveler(false)
    );
  };

  // Start Voice for Local Person
  const startLocalSpeech = () => {
    if (isListeningLocal) {
      SpeechService.stop();
      setIsListeningLocal(false);
      return;
    }

    setIsListeningLocal(true);
    SpeechService.startListening(
      targetVoiceLang,
      async (transcript) => {
        setIsListeningLocal(false);
        setIsTranslating(true);
        try {
          const res = await CompanionAPI.translateText({
            text: transcript,
            sourceLanguage: targetLangName,
            targetLanguage: userLangName,
            destination: destination.name,
          });

          const trans = res.translation;
          setConversationHistory((prev) => [
            ...prev,
            {
              speaker: 'local',
              originalText: transcript,
              translatedText: trans.translatedText,
              phonetic: trans.phoneticPronunciation,
            },
          ]);

          // Automatically speak back in user language to traveler!
          await SpeechService.speak(trans.translatedText, userLang);
        } catch (e) {
          console.error(e);
        } finally {
          setIsTranslating(false);
        }
      },
      (err) => {
        console.warn(err);
        setIsListeningLocal(false);
      },
      () => setIsListeningLocal(false)
    );
  };

  // Text translation submit
  const handleTranslateManualText = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    try {
      const res = await CompanionAPI.translateText({
        text: inputText,
        sourceLanguage: userLangName,
        targetLanguage: targetLangName,
        destination: destination.name,
        situation: situationTag,
      });
      setTranslatedResult(res.translation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const categories = ['All', 'Emergency', 'Taxi & Transit', 'Food & Dietary', 'Courtesy', 'Hotel & Stay'];
  const filteredPhrases = selectedCategory === 'All'
    ? survivalPhrases
    : survivalPhrases.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{destination.flag}</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Language & Voice Companion
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Two-way voice translator & offline phrasebook ({userLangName} ⇄ {destination.officialLanguage})
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveMode('conversation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeMode === 'conversation'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎤 Live Conversation
          </button>
          <button
            onClick={() => setActiveMode('translator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeMode === 'translator'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💬 Text Translator
          </button>
          <button
            onClick={() => setActiveMode('phrasebook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeMode === 'phrasebook'
                ? 'bg-sky-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📚 Offline Phrasebook
          </button>
        </div>
      </div>

      {/* MODE 1: DUAL LIVE CONVERSATION */}
      {activeMode === 'conversation' && (
        <div className="space-y-4">
          {/* Language selector settings */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Your Tongue:</span>
              <select
                value={userLang}
                onChange={(e) => {
                  setUserLang(e.target.value);
                  const map: Record<string, string> = {
                    'en-US': 'English',
                    'ta-IN': 'Tamil',
                    'hi-IN': 'Hindi',
                    'fr-FR': 'French',
                    'es-ES': 'Spanish',
                    'de-DE': 'German',
                  };
                  setUserLangName(map[e.target.value] || 'English');
                }}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 font-bold"
              >
                <option value="en-US">English (US/Global)</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
                <option value="fr-FR">French (Français)</option>
                <option value="es-ES">Spanish (Español)</option>
                <option value="de-DE">German (Deutsch)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <ArrowRightLeft className="w-4 h-4" />
              <span>{destination.flag} {destination.officialLanguage}</span>
            </div>
          </div>

          {/* Conversation Transcript Window */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 min-h-[320px] max-h-[460px] overflow-y-auto space-y-3 shadow-inner">
            {conversationHistory.map((item, idx) => {
              const isTraveler = item.speaker === 'traveler';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isTraveler ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                    {isTraveler ? `You (${userLangName})` : `Local (${destination.officialLanguage})`}
                  </span>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                      isTraveler
                        ? 'bg-sky-600 text-white rounded-tr-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-xs opacity-80 mb-1">{item.originalText}</p>
                    <p className="text-base font-bold tracking-wide">{item.translatedText}</p>
                    {item.phonetic && (
                      <p className="text-xs font-mono text-sky-200 mt-1 italic">
                        🗣️ &ldquo;{item.phonetic}&rdquo;
                      </p>
                    )}

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <button
                        onClick={() =>
                          handleSpeak(
                            `conv-${idx}`,
                            item.translatedText,
                            isTraveler ? targetVoiceLang : userLang
                          )
                        }
                        className="flex items-center gap-1 opacity-90 hover:opacity-100 underline text-[11px] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Repeat Audio</span>
                      </button>

                      {isTraveler && (
                        <button
                          onClick={() =>
                            handleSpeak(
                              `conv-${idx}-slow`,
                              item.translatedText,
                              targetVoiceLang,
                              true
                            )
                          }
                          className="flex items-center gap-1 opacity-80 hover:opacity-100 text-[11px] cursor-pointer"
                        >
                          <span>🐢 0.8x Slow</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTranslating && (
              <div className="flex items-center justify-center p-3 text-xs text-sky-400 bg-sky-500/10 rounded-xl animate-pulse">
                Translating & synthesizing voice...
              </div>
            )}
          </div>

          {/* Dual Action Microphone Console */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Traveler Mic Button */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tap & Speak in {userLangName}
              </span>
              <button
                onClick={startTravelerSpeech}
                disabled={isTranslating || isListeningLocal}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition shadow-lg cursor-pointer ${
                  isListeningTraveler
                    ? 'bg-rose-600 animate-pulse shadow-rose-900/50'
                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-950'
                }`}
              >
                {isListeningTraveler ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isListeningTraveler ? 'Listening to You...' : `I Speak (${userLangName})`}</span>
              </button>
              <p className="text-[11px] text-slate-500 mt-2">
                Speaks translated {destination.officialLanguage} aloud automatically.
              </p>
            </div>

            {/* Local Person Mic Button */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow-lg">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Hand Phone to Local ({destination.officialLanguage})
              </span>
              <button
                onClick={startLocalSpeech}
                disabled={isTranslating || isListeningTraveler}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition shadow-lg cursor-pointer ${
                  isListeningLocal
                    ? 'bg-rose-600 animate-pulse shadow-rose-900/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                }`}
              >
                {isListeningLocal ? <MicOff className="w-5 h-5" /> : <Ear className="w-5 h-5" />}
                <span>{isListeningLocal ? `Listening to Local...` : `Local Speaks (${destination.officialLanguage})`}</span>
              </button>
              <p className="text-[11px] text-slate-500 mt-2">
                Speaks translated {userLangName} aloud to you automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: TEXT TRANSLATOR WITH CULTURAL ETIQUETTE & PREDICTED REPLIES */}
      {activeMode === 'translator' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Situation Context:</span>
              <div className="flex gap-1.5 overflow-x-auto">
                {['General', 'Taxi Ride', 'Food Ordering', 'Bargaining', 'Hotel', 'Emergency'].map((sit) => (
                  <button
                    key={sit}
                    onClick={() => setSituationTag(sit)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      situationTag === sit
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sit}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type anything in ${userLangName} (e.g. "Please turn on the meter, I only pay metered rate")...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500"
            />

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleTranslateManualText}
                disabled={!inputText.trim() || isTranslating}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Translate with Phonetics</span>
              </button>
            </div>
          </div>

          {/* Translation Result Card */}
          {translatedResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                  Target: {destination.officialLanguage}
                </span>
                <div className="mt-1 flex items-start justify-between gap-4">
                  <p className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                    {translatedResult.translatedText}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSpeak('txt-main', translatedResult.translatedText, targetVoiceLang)}
                      className="p-2 rounded-xl bg-sky-500 text-white hover:bg-sky-400 shadow-md cursor-pointer"
                      title="Speak full speed"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSpeak('txt-slow', translatedResult.translatedText, targetVoiceLang, true)}
                      className="p-2 rounded-xl bg-slate-800 text-sky-300 hover:bg-slate-700 border border-slate-700 cursor-pointer text-xs font-bold"
                      title="Speak slow learner pace"
                    >
                      🐢 0.8x
                    </button>
                  </div>
                </div>

                {translatedResult.phoneticPronunciation && (
                  <p className="mt-2 text-sm text-sky-200 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    🗣️ How to pronounce: <span className="font-bold">&ldquo;{translatedResult.phoneticPronunciation}&rdquo;</span>
                  </p>
                )}
              </div>

              {translatedResult.pronunciationTips && (
                <div className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <span className="font-bold text-sky-300">Tone Tip: </span>
                  {translatedResult.pronunciationTips}
                </div>
              )}

              {translatedResult.culturalContext && (
                <div className="text-xs text-slate-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                  <span className="font-bold text-amber-300">Cultural Etiquette: </span>
                  {translatedResult.culturalContext}
                </div>
              )}

              {/* Likely Replies */}
              {translatedResult.likelyReplies && translatedResult.likelyReplies.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Likely Responses You May Hear Back:
                  </span>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {translatedResult.likelyReplies.map((reply: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-100">{reply.native}</p>
                          <p className="text-[11px] text-slate-400">{reply.meaning}</p>
                        </div>
                        <button
                          onClick={() => handleSpeak(`reply-${idx}`, reply.native, targetVoiceLang)}
                          className="p-1.5 text-slate-400 hover:text-sky-300"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: OFFLINE SURVIVAL PHRASEBOOK */}
      {activeMode === 'phrasebook' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Phrases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPhrases.map((phrase) => {
              const isSpeaking = speakingPhraseId === phrase.id;
              const isCopied = copiedId === phrase.id;

              return (
                <div
                  key={phrase.id}
                  className={`bg-slate-900/90 border rounded-2xl p-4 shadow-md transition flex flex-col justify-between ${
                    phrase.urgent
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {phrase.category}
                      </span>
                      {phrase.dietaryTag && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                          {phrase.dietaryTag}
                        </span>
                      )}
                      {phrase.urgent && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold border border-rose-500/30">
                          URGENT
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 font-medium">{phrase.english}</p>
                    <p className="text-lg font-bold text-white mt-1 tracking-wide">
                      {phrase.native}
                    </p>
                    <p className="text-xs font-mono text-sky-300 mt-1">
                      🗣️ &ldquo;{phrase.phonetic}&rdquo;
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSpeak(phrase.id, phrase.native, phrase.audioLang)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isSpeaking
                            ? 'bg-rose-500 text-white'
                            : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40'
                        }`}
                        title="Speak aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak</span>
                      </button>

                      <button
                        onClick={() => handleSpeak(`${phrase.id}-slow`, phrase.native, phrase.audioLang, true)}
                        className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 cursor-pointer"
                        title="Slow pronunciation"
                      >
                        0.8x
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopy(phrase.id, phrase.native)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Copy phrase"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
