import React, { useState, useRef } from 'react';
import { DestinationInfo } from '../types';
import { CompanionAPI } from '../services/api';
import { SpeechService } from '../services/speech';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Landmark,
  Train,
  Receipt,
  Utensils,
  Volume2,
  Image as ImageIcon,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface CameraIntelligenceViewProps {
  destination: DestinationInfo;
}

export const CameraIntelligenceView: React.FC<CameraIntelligenceViewProps> = ({
  destination,
}) => {
  const [selectedTask, setSelectedTask] = useState<'auto' | 'sign' | 'menu' | 'landmark' | 'transit' | 'receipt'>('auto');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ready-to-test Demo Pre-loads
  const testDemos = [
    {
      label: '🪧 Street Warning Sign',
      type: 'sign',
      url: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&auto=format&fit=crop&q=80',
      description: 'Vietnamese street notice with restrictions',
      mockResult: {
        category: 'Street Sign / Warning',
        title: 'Pedestrian Zone & Motorcycle Restriction Notice',
        originalText: 'CẤM XE MÁY ĐI VÀO PHỐ ĐI BỘ TỪ 19:00 ĐẾN 24:00 THỨ SÁU ĐẾN CHỦ NHẬT',
        translation: 'Motorcycles prohibited from entering pedestrian walking street from 19:00 to 24:00 (Friday to Sunday).',
        dietaryAssessment: null,
        practicalInfo: {
          scamOrWarning: 'Penalty fine for motorbikes entering during pedestrian hours is 300,000 - 500,000 VND.',
          actionToTake: 'Enjoy walking safely! No vehicles are permitted during this window.',
        },
        companionNote: 'This area becomes a vibrant night walking street around the lake with street performers and local snacks.',
      },
    },
    {
      label: '🍜 Restaurant Menu',
      type: 'menu',
      url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
      description: 'Hanoi street food specialty menu',
      mockResult: {
        category: 'Menu / Food',
        title: 'Phở & Bún Traditional Specialty List',
        originalText: 'Phở Bò Tái Nạm (50k), Bún Chả Nướng Than Hoa (45k), Bánh Tôm Hồ Tây (60k)',
        translation: 'Beef Rare Pho (50,000 VND), Charcoal Grilled Pork Noodles (45,000 VND), West Lake Fried Shrimp Cakes (60,000 VND)',
        dietaryAssessment: {
          isVegetarian: false,
          isVegan: false,
          containsAllergens: ['Fish sauce', 'Shellfish / Shrimp', 'Pork', 'Beef'],
          summary: 'All three dishes contain meat or fish sauce. Ask for vegetarian alternative: "Quán có món chay không?"',
        },
        practicalInfo: {
          normalFairPrice: '45,000 - 60,000 VND (~$1.80 - $2.40)',
          scamOrWarning: 'Prices are printed clearly; fair local benchmark rate.',
          actionToTake: 'Point and say "Cho tôi một phần" (One portion for me please).',
        },
        companionNote: 'Extremely popular with local university students and office workers; high turnover means very fresh.',
      },
    },
    {
      label: '🏛️ Historic Landmark',
      type: 'landmark',
      url: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&auto=format&fit=crop&q=80',
      description: 'Ancient temple / pagoda monument',
      mockResult: {
        category: 'Historical Landmark',
        title: 'Temple of Literature (Văn Miếu - Quốc Tử Giám)',
        originalText: 'VĂN MIẾU QUỐC TỬ GIÁM - TRƯỜNG ĐẠI HỌC ĐẦU TIÊN CỦA VIỆT NAM (1070)',
        translation: 'Temple of Literature - First National University of Vietnam, established in 1070 AD.',
        dietaryAssessment: null,
        practicalInfo: {
          normalFairPrice: 'Official Ticket: 30,000 VND (~$1.20) at official front desk.',
          scamOrWarning: 'Ignore unofficial ticket touts outside the main gate gates offering "priority line skips".',
          actionToTake: 'Ensure shoulders and knees are covered to enter the inner sanctum.',
        },
        companionNote: 'Look for the 82 stone turtle stelae engraved with names of ancient imperial examination scholars.',
      },
    },
    {
      label: '🚉 Train Station Platform',
      type: 'transit',
      url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80',
      description: 'Transit schedule board',
      mockResult: {
        category: 'Transit Station / Ticket',
        title: 'Platform Departure Electronic Board',
        originalText: 'TÀU SE1: HÀ NỘI -> SÀI GÒN - KHỞI HÀNH 19:30 - CỬA SỐ 3 (PLATFORM 3)',
        translation: 'Train SE1: Hanoi to Saigon (Ho Chi Minh City) - Departure 19:30 - Gate/Platform 3.',
        dietaryAssessment: null,
        practicalInfo: {
          normalFairPrice: 'Check car number on ticket: Soft Sleeper (Toa nằm mềm).',
          scamOrWarning: 'Do not hand your luggage to unofficial porters without agreeing on fee upfront.',
          actionToTake: 'Board via Gate 3 when boarding chime sounds 20 minutes prior.',
        },
        companionNote: 'Air-conditioned express train; free hot drinking water is available at the end of each passenger carriage.',
      },
    },
  ];

  const handleSelectDemo = (demo: any) => {
    setImagePreview(demo.url);
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisResult(demo.mockResult);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      runVisionAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  // Start live webcam stream
  const startCamera = async () => {
    setIsLiveCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setIsLiveCameraActive(false);
      alert('Camera access could not be started. You can still upload photos or test with demo images!');
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Stop camera tracks
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setIsLiveCameraActive(false);

    setImagePreview(dataUrl);
    runVisionAnalysis(dataUrl);
  };

  const runVisionAnalysis = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const res = await CompanionAPI.analyzeVisionPhoto({
        imageBase64: base64,
        mimeType: 'image/jpeg',
        taskType: selectedTask,
        destination: destination.name,
        dietaryPreferences: 'Vegetarian',
        userLanguage: 'English',
      });
      setAnalysisResult(res.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakText = (text: string) => {
    SpeechService.speak(text, 'en-US');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold mb-3">
          <Camera className="w-3.5 h-3.5" />
          <span>Multimodal Travel Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Camera Intelligence: {destination.name}
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Your camera turns into real-time travel intelligence. Point it at incomprehensible street signs, restaurant menus, train station departure boards, landmarks, or receipts to decode instructions, fair costs, and hidden risks instantly.
        </p>
      </div>

      {/* Demo Quick Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          ⚡ One-Click Scenarios (Test Live Multimodal AI):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {testDemos.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectDemo(demo)}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
            >
              <span className="font-bold text-xs text-white block">{demo.label}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{demo.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Capture & Upload Console */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Target Focus:</span>
            <select
              value={selectedTask}
              onChange={(e: any) => setSelectedTask(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none"
            >
              <option value="auto">Auto-Detect Object</option>
              <option value="sign">Street Sign / Regulatory Warning</option>
              <option value="menu">Restaurant Menu / Dish</option>
              <option value="landmark">Landmark / Monument</option>
              <option value="transit">Train / Subway Board</option>
              <option value="receipt">Bill / Price Receipt</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {!isLiveCameraActive ? (
              <button
                onClick={startCamera}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Open Live Camera</span>
              </button>
            ) : (
              <button
                onClick={captureCameraPhoto}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md animate-pulse transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Snap & Analyze</span>
              </button>
            )}

            <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Live Camera Viewport */}
        {isLiveCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 max-h-[380px] flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-2 border-dashed border-sky-400/50 m-6 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="bg-black/60 px-3 py-1 rounded-full text-xs text-white">
                Frame sign, menu or landmark here
              </span>
            </div>
          </div>
        )}

        {/* Analyzing Spinner */}
        {isAnalyzing && (
          <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-white">Gemini Vision is inspecting photo...</p>
            <p className="text-xs text-slate-400 mt-1">
              Translating text, evaluating local context, checking fair prices.
            </p>
          </div>
        )}

        {/* Analysis Result Card */}
        {analysisResult && !isAnalyzing && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Analyzed target"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-700 shrink-0"
                  />
                )}
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    {analysisResult.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                    {analysisResult.title}
                  </h3>
                  <button
                    onClick={() => speakText(analysisResult.translation || analysisResult.companionNote)}
                    className="mt-1 flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen to Explanation</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Original Text & Translation */}
            {analysisResult.originalText && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Detected Local Script:
                  </span>
                  <p className="text-slate-200 font-mono select-all">
                    {analysisResult.originalText}
                  </p>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    English Translation & Meaning:
                  </span>
                  <p className="text-slate-100 font-medium leading-relaxed">
                    {analysisResult.translation}
                  </p>
                </div>
              </div>
            )}

            {/* Dietary Assessment if food */}
            {analysisResult.dietaryAssessment && (
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Dietary & Allergen Verification:
                </span>
                <p className="text-slate-200">{analysisResult.dietaryAssessment.summary}</p>
                {analysisResult.dietaryAssessment.containsAllergens?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysisResult.dietaryAssessment.containsAllergens.map((alg: string, i: number) => (
                      <span key={i} className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                        ⚠️ {alg}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Practical Advice Grid */}
            {analysisResult.practicalInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {analysisResult.practicalInfo.normalFairPrice && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                      Fair Benchmark Price:
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {analysisResult.practicalInfo.normalFairPrice}
                    </span>
                  </div>
                )}

                {analysisResult.practicalInfo.scamOrWarning && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-300">
                    <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Scam or Rule Warning:
                    </span>
                    <p className="text-slate-200">{analysisResult.practicalInfo.scamOrWarning}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action to take */}
            {analysisResult.practicalInfo?.actionToTake && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 text-xs text-sky-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">Next Action:</span>
                  <p>{analysisResult.practicalInfo.actionToTake}</p>
                </div>
              </div>
            )}

            {/* Companion Closing Note */}
            {analysisResult.companionNote && (
              <p className="text-xs text-slate-400 italic pt-1">
                💬 Companion note: {analysisResult.companionNote}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
