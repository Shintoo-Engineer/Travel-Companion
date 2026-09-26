import React, { useState, useRef, useEffect } from 'react';
import { DestinationInfo, TravelVaultData } from '../types';
import { CompanionAPI } from '../services/api';
import { SpeechService } from '../services/speech';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
  Bot,
  User,
  Shield,
  MapPin,
  Utensils,
  Car,
  CircleDollarSign,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface CompanionChatProps {
  destination: DestinationInfo;
  vault: TravelVaultData;
  onNavigateTab: (tab: any) => void;
  onOpenVoiceCall?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const CompanionChat: React.FC<CompanionChatProps> = ({
  destination,
  vault,
  onNavigateTab,
  onOpenVoiceCall,
}) => {
  const isOnline = useOnlineStatus();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hello! I am your AI Travel Companion in **${destination.name}** ${destination.flag}.\n\nWherever you go in this world, you don't need to depend on strangers or separate tour guides. I will:\n- 🧭 Guide you through local neighborhoods\n- 🗣️ Translate voice & signs into ${destination.officialLanguage}\n- 🍜 Check food for ingredients, allergies & vegetarian safety\n- 🚕 Protect you from taxi meter scams & unmetered rides\n- 💰 Tell you if quoted prices are fair or tourist rip-offs\n- 🛡️ Handle any emergencies step-by-step\n\nHow can I help you right now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState('en-US');
  const [autoSpeak, setAutoSpeak] = useState(true);

  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevDestIdRef = useRef(destination.id);

  // When destination changes, introduce the new destination
  useEffect(() => {
    if (prevDestIdRef.current !== destination.id) {
      prevDestIdRef.current = destination.id;
      const newWelcome: ChatMessage = {
        id: `switch-${destination.id}-${Date.now()}`,
        role: 'assistant',
        content: `🌍 We are now in **${destination.name}** ${destination.flag}!\n\nI have adapted all your local tools:\n- Official Language: **${destination.officialLanguage}**\n- Currency: **${destination.currency} (${destination.currencySymbol})**\n- Emergency numbers: Police **${destination.emergencyNumbers.police}**, Medical **${destination.emergencyNumbers.ambulance}**\n- Verified Taxis: ${destination.trustedTaxiBrands.join(', ')}\n\nWhat would you like to explore here?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newWelcome]);
    }
  }, [destination]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: `🍜 Safe food in ${destination.capital}`, query: `Find verified vegetarian or vegan friendly local dishes in ${destination.capital} that don't use hidden meat broths.` },
    { label: `🚕 Taxi & Transit in ${destination.name}`, query: `How much should a taxi or ride cost from the airport to city center in ${destination.name}, and what scams should I avoid?` },
    { label: '⏰ I have 3 hours free', query: `I have 3 hours free right now in ${destination.capital}. What should I do without rushing?` },
    { label: `💰 Is 100 ${destination.currencySymbol} expensive?`, query: `Is 100 ${destination.currencySymbol} considered expensive in ${destination.name}? What should regular meals and taxis cost?` },
    { label: `🗣️ 3 phrases in ${destination.officialLanguage}`, query: `Teach me the 3 most polite and respectful phrases in ${destination.officialLanguage} with phonetic pronunciation.` },
    { label: `🛂 Emergency in ${destination.name}`, query: `Emergency: I lost my passport in ${destination.name}. What are my immediate step-by-step instructions?` },
  ];

  const handleSendMessage = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await CompanionAPI.chatWithCompanion({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        tripContext: {
          destination: destination.name,
          hotelName: vault.hotelName,
          hotelAddress: vault.hotelAddress,
          travelerDiet: vault.dietaryNotes,
          capital: destination.capital,
          currency: destination.currency,
        },
        currentQuery: text,
        userLanguage: 'English',
        destination: destination.name,
      });

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Auto-speak response if enabled for hands-free audio companion experience
      if (autoSpeak) {
        const plainText = response.reply.replace(/[*#_`[\]]/g, '').slice(0, 350);
        SpeechService.speak(plainText, 'en-US');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm with you in ${destination.name}! Remember to verify taxi meters, drink bottled water if tap is not potable, and keep emergency numbers (${destination.emergencyNumbers.police}) saved offline!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const recognizer = SpeechService.startListening(
      selectedVoiceLang,
      (transcript) => {
        setInputQuery(transcript);
        setIsListening(false);
      },
      (error) => {
        console.warn('Voice recognition error:', error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
    } else {
      setIsListening(false);
    }
  };

  const handleSpeakMessage = async (msgId: string, content: string) => {
    if (playingVoiceId === msgId) {
      SpeechService.stop();
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(msgId);
    // Strip markdown formatting for cleaner speech synthesis
    const plainText = content.replace(/[*#_`[\]]/g, '').trim();
    await SpeechService.speak(plainText, 'en-US');
    setPlayingVoiceId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto p-2 sm:p-4">
      {/* Top Companion Status Banner */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 mb-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                Personal AI Travel Companion
              </span>
              <span className="text-xs bg-slate-800 text-sky-400 px-2 py-0.5 rounded-full font-mono border border-slate-700">
                {destination.flag} {destination.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verified local guidance • Scam prevention • Instant multi-language
            </p>
          </div>
        </div>

        {/* Quick actions triggers: Auto-speak, Voice Call, Where Now */}
        <div className="flex items-center gap-1.5">
          {/* Auto-Speak toggle */}
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
              autoSpeak
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Auto-speak companion replies with loud voice"
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoSpeak ? 'Audio On' : 'Mute'}</span>
          </button>

          {/* Dedicated Live Voice Call Launcher */}
          {onOpenVoiceCall && (
            <button
              onClick={onOpenVoiceCall}
              className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl shadow-md transition cursor-pointer"
              title="Start Live Voice Conversation"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Call</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('wherenow')}
            className="hidden md:flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl border border-slate-700 transition"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Where Now?</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isPlaying = playingVoiceId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-md ${
                  isUser
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-sky-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-sm'
                    : 'bg-slate-900/95 border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                {/* Message Body with clean markdown formatting */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="font-bold text-white text-base mt-2 mb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('## ')) {
                      return <h3 key={idx} className="font-extrabold text-sky-300 text-lg mt-3 mb-1.5">{line.replace('## ', '')}</h3>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <div key={idx} className="flex items-start gap-2 my-1">
                          <span className="text-sky-400 font-bold shrink-0">•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      );
                    }
                    return <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-1'}>{line}</p>;
                  })}
                </div>

                {/* Emergency SOS quick jump badge if relevant */}
                {!isUser && (msg.content.toLowerCase().includes('police') || msg.content.toLowerCase().includes('hospital') || msg.content.toLowerCase().includes('emergency') || msg.content.toLowerCase().includes('doctor')) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-rose-300 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3 text-rose-400" />
                      <span>SOS Locator Available</span>
                    </span>
                    <button
                      onClick={() => onNavigateTab('emergency')}
                      className="text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow"
                    >
                      <span>Open Nearest Hospital & Police</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

                {/* Footer bar with timestamp and Speech Playback */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/40 text-[11px] text-slate-400">
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => handleSpeakMessage(msg.id, msg.content)}
                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition p-1 rounded hover:bg-slate-800/80 cursor-pointer"
                      title={isPlaying ? 'Stop voice playback' : 'Listen with natural voice'}
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-rose-400">Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Speak aloud</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-300 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-slate-400">Companion is verifying local information...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-sky-400" /> Quick Ask:
        </span>
        {quickPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.query)}
            disabled={isLoading}
            className="shrink-0 text-xs bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="mt-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-md">
        {isListening && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-300 animate-pulse">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Listening... Speak in your language (English, Tamil, Hindi, Vietnamese, etc.)
            </span>
            <button
              onClick={() => setIsListening(false)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Language select */}
          <select
            value={selectedVoiceLang}
            onChange={(e) => setSelectedVoiceLang(e.target.value)}
            className="hidden sm:block bg-slate-800 border border-slate-700 text-[11px] text-slate-300 rounded-xl px-2 py-2 focus:outline-none"
            title="Voice input language"
          >
            <option value="en-US">EN (English)</option>
            <option value="ta-IN">TA (Tamil)</option>
            <option value="hi-IN">HI (Hindi)</option>
            <option value="vi-VN">VI (Vietnamese)</option>
            <option value="ja-JP">JA (Japanese)</option>
            <option value="fr-FR">FR (French)</option>
            <option value="es-ES">ES (Spanish)</option>
            <option value="de-DE">DE (German)</option>
          </select>

          {/* Microphone button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
            }`}
            title="Click to speak (Voice input)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={`Ask your companion anything in ${destination.name}...`}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white p-2.5 rounded-xl transition shadow-md shadow-sky-950 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
