import React, { useState } from 'react';
import { DestinationInfo } from '../types';
import { CompanionAPI } from '../services/api';
import { SpeechService } from '../services/speech';
import {
  UtensilsCrossed,
  ShieldCheck,
  AlertTriangle,
  Camera,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Volume2,
  Upload,
  Info,
  ChevronRight,
  Flame,
  Search,
} from 'lucide-react';

interface FoodCompanionViewProps {
  destination: DestinationInfo;
}

export const FoodCompanionView: React.FC<FoodCompanionViewProps> = ({
  destination,
}) => {
  const [selectedDiet, setSelectedDiet] = useState<'Vegetarian' | 'Vegan' | 'Halal' | 'Jain-friendly' | 'Allergens'>('Vegetarian');
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null);
  const [isAnalyzingMenu, setIsAnalyzingMenu] = useState(false);
  const [menuAnalysis, setMenuAnalysis] = useState<any>(null);

  // Pre-compiled verified safe dishes by country
  const safeDishesByCountry: Record<string, Array<{
    name: string;
    native: string;
    phonetic: string;
    category: string;
    safeFor: string[];
    dangerIngredients: string[];
    howToOrderSpecial: string;
    fairPrice: string;
    spiceLevel: string;
  }>> = {
    vietnam: [
      {
        name: 'Phở Chay (Vegetarian Pho)',
        native: 'Phở Chay',
        phonetic: 'Fuh Chye',
        category: 'Noodle Soup',
        safeFor: ['Vegetarian', 'Vegan', 'Halal'],
        dangerIngredients: ['Ensure regular fish sauce is replaced with mushroom soy sauce ("nước tương chay")'],
        howToOrderSpecial: '“Làm ơn cho tôi một tô phở chay, không dùng nước mắm.” (No fish sauce)',
        fairPrice: '35,000 - 50,000 VND ($1.50 - $2.00)',
        spiceLevel: 'Mild (add fresh chili on side)',
      },
      {
        name: 'Bánh Mì Chay (Tofu Baguette)',
        native: 'Bánh Mì Chay',
        phonetic: 'Bun Mee Chye',
        category: 'Street Sandwich',
        safeFor: ['Vegetarian', 'Vegan', 'Halal'],
        dangerIngredients: ['Watch out for pork liver pâté and mayo (contains egg)'],
        howToOrderSpecial: '“Bánh mì chay, không pate, không sốt trứng.” (No pate, no mayo)',
        fairPrice: '20,000 - 30,000 VND ($0.80 - $1.20)',
        spiceLevel: 'Mild / Adjustable',
      },
      {
        name: 'Gỏi Cuốn Chay (Fresh Veg Spring Rolls)',
        native: 'Gỏi Cuốn Chay',
        phonetic: 'Goy Kwoon Chye',
        category: 'Appetizer / Snack',
        safeFor: ['Vegetarian', 'Vegan', 'Halal', 'Jain-friendly'],
        dangerIngredients: ['Dipping sauce must be peanut sauce ("tương đậu phộng") instead of fish sauce'],
        howToOrderSpecial: '“Chấm tương đậu phộng, không nước mắm.”',
        fairPrice: '30,000 - 45,000 VND (plate of 3-4)',
        spiceLevel: 'Zero spice',
      },
      {
        name: 'Rau Muống Xào Tỏi (Stir-fried Morning Glory)',
        native: 'Rau Muống Xào Tỏi',
        phonetic: 'Zow Moong Sow Toy',
        category: 'Side Greens',
        safeFor: ['Vegetarian', 'Vegan', 'Halal'],
        dangerIngredients: ['Often cooked with oyster sauce ("dầu hào") or fish sauce unless specified'],
        howToOrderSpecial: '“Xào chay bằng muối và dầu thực vật.” (Stir fry with salt and vegetable oil only)',
        fairPrice: '40,000 - 60,000 VND',
        spiceLevel: 'Mild / Savory garlic',
      },
      {
        name: 'Đậu Hũ Sốt Cà Chua (Tofu in Tomato Sauce)',
        native: 'Đậu Hũ Sốt Cà Chua',
        phonetic: 'Dow Hoo Sote Ca Choowa',
        category: 'Main Dish with Rice',
        safeFor: ['Vegetarian', 'Vegan', 'Halal', 'Jain-friendly'],
        dangerIngredients: ['Verify no pork mince mixed inside tofu pockets'],
        howToOrderSpecial: '“Đậu phụ chay hoàn toàn, không nhồi thịt.”',
        fairPrice: '40,000 - 65,000 VND',
        spiceLevel: 'Mild / Sweet & tangy',
      },
    ],
    japan: [
      {
        name: 'Shojin Ryori (Buddhist Temple Cuisine)',
        native: '精進料理',
        phonetic: 'Shou-jin Ryo-ri',
        category: 'Traditional Multi-course',
        safeFor: ['Vegetarian', 'Vegan', 'Jain-friendly', 'Halal'],
        dangerIngredients: ['None - strictly 100% plant-based by Buddhist monks'],
        howToOrderSpecial: 'Reserve at Buddhist temples or specialized Ryori restaurants',
        fairPrice: '¥3,000 - ¥6,000',
        spiceLevel: 'Zero spice / Delicate umami',
      },
      {
        name: 'Kitsune Udon (Check for Kelp Broth)',
        native: 'きつねうどん',
        phonetic: 'Kee-tsoo-neh Oo-don',
        category: 'Hot Noodles with Sweet Tofu',
        safeFor: ['Vegetarian (with kelp dashi)'],
        dangerIngredients: ['Standard dashi broth is made from bonito fish flakes! Must ask for Kombu (kelp) dashi.'],
        howToOrderSpecial: '“出汁は昆布のみで作られていますか？” (Is broth made from kelp only?)',
        fairPrice: '¥600 - ¥900',
        spiceLevel: 'Mild',
      },
      {
        name: 'Vegetable Tempura (Yasai Tempura)',
        native: '野菜の天ぷら',
        phonetic: 'Yah-sah-ee Ten-poo-rah',
        category: 'Crispy Vegetables',
        safeFor: ['Vegetarian', 'Halal'],
        dangerIngredients: ['Tempura batter sometimes contains egg; dipping sauce contains fish dashi (use table salt instead!)'],
        howToOrderSpecial: '“お塩でいただきます。出汁つゆは不要です。” (I will use salt, no dashi dipping sauce needed)',
        fairPrice: '¥800 - ¥1,400',
        spiceLevel: 'Zero spice',
      },
    ],
  };

  const currentCountryDishes = safeDishesByCountry[destination.id] || safeDishesByCountry['vietnam'];

  // Handle Menu Photo Upload or Demo Scan
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setMenuImagePreview(base64);
      analyzeMenuImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleTestDemoMenu = () => {
    // Demo mock base64 / scan
    setIsAnalyzingMenu(true);
    setMenuImagePreview('https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80');
    setTimeout(() => {
      setMenuAnalysis({
        dishName: 'Phở Bò & Phở Gà (Traditional Beef & Chicken Pho)',
        category: 'Menu Item Breakdown',
        detectedIngredients: ['Rice noodles', 'Beef marrow broth', 'Star anise', 'Fish sauce', 'Scallions', 'Cilantro'],
        dietaryVerdict: {
          isVegetarian: false,
          isVegan: false,
          isHalal: false,
          containsAllergens: ['Fish sauce (Nước mắm)', 'Beef / Poultry bones'],
        },
        companionWarning: '🚨 ALERT: The broth is slow-simmered with beef bones and fish sauce. Not suitable for vegetarians or vegans even if ordered without meat slices.',
        safeAlternativeOrder: 'Ask the vendor: “Cô ơi, có Phở Chay (nấu nấm) không ạ?” (Do you have vegetarian mushroom pho?)',
        normalFairPrice: '40,000 - 55,000 VND ($1.60 - $2.20)',
        spiceLevel: 'Mild broth, spicy chilies served separately',
      });
      setIsAnalyzingMenu(false);
    }, 1200);
  };

  const analyzeMenuImage = async (base64: string) => {
    setIsAnalyzingMenu(true);
    try {
      const res = await CompanionAPI.analyzeVisionPhoto({
        imageBase64: base64,
        mimeType: 'image/jpeg',
        taskType: 'menu',
        destination: destination.name,
        dietaryPreferences: selectedDiet,
        userLanguage: 'English',
      });

      const a = res.analysis;
      setMenuAnalysis({
        dishName: a.title || 'Scanned Menu Dish',
        category: a.category,
        detectedIngredients: a.dietaryAssessment?.containsAllergens || ['Local herbs', 'Broth', 'Base carbohydrates'],
        dietaryVerdict: {
          isVegetarian: a.dietaryAssessment?.isVegetarian ?? false,
          isVegan: a.dietaryAssessment?.isVegan ?? false,
          isHalal: a.dietaryAssessment?.isHalal ?? null,
          containsAllergens: a.dietaryAssessment?.containsAllergens || [],
        },
        companionWarning: a.dietaryAssessment?.summary || a.companionNote,
        safeAlternativeOrder: a.practicalInfo?.actionToTake || 'Show vegetarian phrase card to server.',
        normalFairPrice: a.practicalInfo?.normalFairPrice || 'Normal local pricing applies',
        spiceLevel: 'Ask for mild / "Không cay"',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingMenu(false);
    }
  };

  const speakPhrase = (text: string, lang = destination.speechVoiceLang) => {
    SpeechService.speak(text, lang);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Dietary & Menu Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Food Companion for {destination.name} {destination.flag}
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Never starve or accidentally consume meat/allergens in countries where you can’t read the language. Scan menus through the camera, inspect hidden ingredients (like fish sauce or lard), and discover verified authentic dishes.
        </p>
      </div>

      {/* Camera / Photo Menu Scanner Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Camera Menu Decoder</span>
            </h3>
            <p className="text-xs text-slate-400">
              Point your camera at any restaurant menu or dish signboard to inspect ingredients & dietary safety.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestDemoMenu}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              ⚡ Test with Hanoi Pho Menu Demo
            </button>
            <label className="flex items-center gap-1.5 text-xs bg-sky-500 hover:bg-sky-400 text-white font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>Scan / Upload Menu</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Scanner Result Display */}
        {isAnalyzingMenu && (
          <div className="p-8 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-white">Analyzing Menu & Ingredient Safety...</p>
            <p className="text-xs text-slate-400 mt-1">
              Checking for hidden fish sauce, beef broth, lard, and nut allergens.
            </p>
          </div>
        )}

        {menuAnalysis && !isAnalyzingMenu && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Menu Analysis Result
                </span>
                <h4 className="text-lg font-bold text-white mt-0.5">{menuAnalysis.dishName}</h4>
              </div>

              {/* Verdict Tag */}
              <div className="flex items-center gap-2">
                {menuAnalysis.dietaryVerdict.isVegetarian ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Vegetarian Safe</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>Not Vegetarian Safe</span>
                  </span>
                )}
              </div>
            </div>

            {/* Companion Warning Box */}
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              menuAnalysis.dietaryVerdict.isVegetarian
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Companion Safety Assessment:</span>
              </div>
              <p>{menuAnalysis.companionWarning}</p>
            </div>

            {/* Ingredients & Price Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-1">Detected Ingredients:</span>
                <div className="flex flex-wrap gap-1">
                  {menuAnalysis.detectedIngredients?.map((ing: string, i: number) => (
                    <span key={i} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-1">Fair Price Range:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {menuAnalysis.normalFairPrice}
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Check against receipt to prevent tourist surcharge.
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block font-semibold mb-1">Spice Level:</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {menuAnalysis.spiceLevel}
                </span>
              </div>
            </div>

            {/* Action script */}
            {menuAnalysis.safeAlternativeOrder && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-sky-300 block mb-0.5">
                    How to order safe alternative right now:
                  </span>
                  <p className="text-slate-200">{menuAnalysis.safeAlternativeOrder}</p>
                </div>
                <button
                  onClick={() => speakPhrase(menuAnalysis.safeAlternativeOrder)}
                  className="p-2 rounded-lg bg-sky-500 text-white shrink-0 hover:bg-sky-400 transition cursor-pointer"
                  title="Speak to waiter"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dietary Filter & Safe Dishes Catalog */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Authentic Safe Dishes in {destination.name}</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['Vegetarian', 'Vegan', 'Halal', 'Jain-friendly', 'Allergens'] as const).map((diet) => (
              <button
                key={diet}
                onClick={() => setSelectedDiet(diet)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedDiet === diet
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {diet}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentCountryDishes.map((dish, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {dish.category}
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">{dish.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-sky-300 font-mono">{dish.native}</span>
                    <button
                      onClick={() => speakPhrase(dish.native)}
                      className="p-1 rounded text-slate-400 hover:text-sky-300 transition"
                      title="Pronounce dish"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-mono italic">
                    🗣️ &ldquo;{dish.phonetic}&rdquo;
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-emerald-400 font-bold block">
                    {dish.fairPrice}
                  </span>
                  <span className="text-[11px] text-slate-500">{dish.spiceLevel}</span>
                </div>
              </div>

              {/* Danger ingredients warning */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-200">
                <span className="font-bold flex items-center gap-1 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Watch out for:
                </span>
                <p className="text-[11px] text-slate-300">{dish.dangerIngredients.join(', ')}</p>
              </div>

              {/* Exact Order Phrase to show server */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Show this to waiter:
                  </span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">
                    {dish.howToOrderSpecial}
                  </p>
                </div>
                <button
                  onClick={() => speakPhrase(dish.howToOrderSpecial)}
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer shadow-sm"
                  title="Speak phrase to waiter"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
