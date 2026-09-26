import React, { useState, useEffect } from 'react';
import { DestinationInfo, ExpenseItem } from '../types';
import { OFFLINE_PACKS } from '../data/offlinePacks';
import { CompanionAPI } from '../services/api';
import {
  Wallet,
  ArrowRightLeft,
  CircleDollarSign,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  PieChart,
  ShoppingBag,
  Car,
  Utensils,
  Hotel,
  RefreshCw,
} from 'lucide-react';

interface MoneyCompanionViewProps {
  destination: DestinationInfo;
}

export const MoneyCompanionView: React.FC<MoneyCompanionViewProps> = ({
  destination,
}) => {
  // Currency Converter State
  const pack = OFFLINE_PACKS[destination.id] || OFFLINE_PACKS['vietnam'];
  const [foreignAmount, setForeignAmount] = useState<string>('500000');
  const [homeCurrency, setHomeCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');

  // Rates to 1 Foreign unit (or from 1 USD/INR)
  // For VND: 1 USD = 25,400 VND, 1 INR = 305 VND
  const getExchangeRates = () => {
    switch (destination.id) {
      case 'vietnam':
        return { USD: 1 / 25400, INR: 1 / 305, EUR: 1 / 27500, GBP: 1 / 32500 };
      case 'japan':
        return { USD: 1 / 155, INR: 1 / 1.85, EUR: 1 / 168, GBP: 1 / 198 };
      case 'india':
        return { USD: 1 / 87, INR: 1, EUR: 1 / 95, GBP: 1 / 112 };
      case 'thailand':
        return { USD: 1 / 36, INR: 1 / 0.43, EUR: 1 / 39, GBP: 1 / 46 };
      case 'france':
      case 'italy':
      case 'germany':
        return { USD: 1.08, INR: 93, EUR: 1, GBP: 0.85 };
      default:
        return { USD: 1 / 25400, INR: 1 / 305, EUR: 1 / 27500, GBP: 1 / 32500 };
    }
  };

  const rates = getExchangeRates();
  const convertedHomeValue = (Number(foreignAmount) || 0) * (rates[homeCurrency] || 1);

  // "Is This Expensive?" Sanity Check State
  const [itemToCheck, setItemToCheck] = useState('5 km taxi ride from city center');
  const [quotedPriceToCheck, setQuotedPriceToCheck] = useState('500,000 VND');
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [priceVerdict, setPriceVerdict] = useState<any>({
    verdict: 'Heavy Overcharge / Tourist Trap',
    isFairPrice: false,
    normalPriceRange: '75,000 - 100,000 VND ($3.00 - $4.00)',
    quotedPrice: '500,000 VND ($20.00)',
    explanation:
      '500,000 VND is approximately 5x the normal metered fare in Vietnam. A standard 5km taxi ride costs ~75,000 - 95,000 VND on Mai Linh or Vinasun meters, or on the Grab app.',
    counterOfferOrAction:
      'Politely decline: say “Đắt quá, đi đồng hồ nhé” (Too expensive, meter please) or book on Grab.',
  });

  // Expense Tracker State (Persistent locally)
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const stored = localStorage.getItem(`travel_expenses_${destination.id}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return [
      {
        id: '1',
        title: 'Vietnamese Iced Coffee (Cà phê sữa đá)',
        amount: 35000,
        currency: destination.currencySymbol,
        homeAmount: 115,
        homeCurrency: 'INR',
        category: 'Food',
        date: new Date().toLocaleDateString(),
      },
      {
        id: '2',
        title: 'Grab Taxi to Temple of Literature',
        amount: 55000,
        currency: destination.currencySymbol,
        homeAmount: 180,
        homeCurrency: 'INR',
        category: 'Transport',
        date: new Date().toLocaleDateString(),
      },
    ];
  });

  const [dailyBudgetGoal, setDailyBudgetGoal] = useState<number>(3000); // in homeCurrency
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseItem['category']>('Food');

  useEffect(() => {
    try {
      localStorage.setItem(`travel_expenses_${destination.id}`, JSON.stringify(expenses));
    } catch (e) {
      // ignore
    }
  }, [expenses, destination.id]);

  const handleCheckPrice = async () => {
    if (!itemToCheck.trim() || !quotedPriceToCheck.trim()) return;
    setIsCheckingPrice(true);
    try {
      const res = await CompanionAPI.checkPriceSanity({
        itemOrService: itemToCheck,
        quotedPrice: quotedPriceToCheck,
        destination: destination.name,
        city: destination.capital,
      });
      setPriceVerdict(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingPrice(false);
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpenseAmount);
    if (!newExpenseTitle.trim() || isNaN(amt) || amt <= 0) return;

    const rate = rates[homeCurrency] || 1;
    const homeVal = Math.round(amt * rate);

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      title: newExpenseTitle.trim(),
      amount: amt,
      currency: destination.currencySymbol,
      homeAmount: homeVal,
      homeCurrency,
      category: newExpenseCategory,
      date: new Date().toLocaleDateString(),
    };

    setExpenses((prev) => [newItem, ...prev]);
    setNewExpenseTitle('');
    setNewExpenseAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const totalSpentHome = expenses.reduce((sum, item) => sum + item.homeAmount, 0);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
          <Wallet className="w-3.5 h-3.5" />
          <span>Financial Shield & Currency Sense</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Money Companion in {destination.name} {destination.flag}
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
          Foreign currencies with many zeros (like VND or JPY) often cause confusion or overpayment. Convert instantly offline, check whether prices quoted by merchants are fair or tourist rip-offs, and track your daily spending.
        </p>
      </div>

      {/* Grid: Currency Converter + "Is This Expensive?" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Converter Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              <span>Offline Currency Converter</span>
            </h3>
            <span className="text-[10px] bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded font-mono border border-sky-500/20">
              OFFLINE CACHED
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Amount in {destination.currency} ({destination.currencySymbol}):
              </label>
              <input
                type="number"
                value={foreignAmount}
                onChange={(e) => setForeignAmount(e.target.value)}
                placeholder="500000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-lg font-bold font-mono text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-semibold">Your Home Currency:</span>
              <div className="flex gap-1">
                {(['INR', 'USD', 'EUR', 'GBP'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setHomeCurrency(curr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      homeCurrency === curr
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Equivalent Output Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-medium block">
                Approximate Home Equivalent:
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1 block">
                {homeCurrency === 'INR' ? '₹' : homeCurrency === 'USD' ? '$' : homeCurrency === 'EUR' ? '€' : '£'}{' '}
                {convertedHomeValue.toLocaleString(undefined, { maximumFractionDigits: 1 })} {homeCurrency}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Based on verified benchmark bank rates
              </span>
            </div>
          </div>
        </div>

        {/* "Is This Expensive?" Sanity Checker */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-400" />
              <span>“Is This Expensive?” Scam Checker</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Item / Service offered:
              </label>
              <input
                type="text"
                value={itemToCheck}
                onChange={(e) => setItemToCheck(e.target.value)}
                placeholder="e.g. 5km taxi ride, or 1 T-shirt at night market"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Quoted Price by Vendor / Driver:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quotedPriceToCheck}
                  onChange={(e) => setQuotedPriceToCheck(e.target.value)}
                  placeholder="e.g. 500,000 VND"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleCheckPrice}
                  disabled={isCheckingPrice}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shrink-0 transition cursor-pointer disabled:opacity-50"
                >
                  {isCheckingPrice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
                </button>
              </div>
            </div>

            {/* Verdict Display */}
            {priceVerdict && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                priceVerdict.isFairPrice
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm flex items-center gap-1.5">
                    {priceVerdict.isFairPrice ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    {priceVerdict.verdict}
                  </span>
                  <span className="font-mono text-[11px] opacity-90">
                    Normal: {priceVerdict.normalPriceRange}
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {priceVerdict.explanation}
                </p>
                {priceVerdict.counterOfferOrAction && (
                  <div className="mt-2 pt-1.5 border-t border-rose-500/20 font-bold text-white text-[11px]">
                    👉 Counter Action: {priceVerdict.counterOfferOrAction}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Expense Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-400" />
              <span>Offline Expense Tracker & Budget Watchdog</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Saved automatically to local device storage; works on airplanes or remote islands.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">TOTAL SPENT</span>
              <span className="text-lg font-extrabold text-white font-mono">
                {homeCurrency === 'INR' ? '₹' : '$'} {totalSpentHome.toLocaleString()} {homeCurrency}
              </span>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <input
            type="text"
            value={newExpenseTitle}
            onChange={(e) => setNewExpenseTitle(e.target.value)}
            placeholder="Expense title (e.g. Dinner pho, Grab ride)"
            className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          />

          <input
            type="number"
            value={newExpenseAmount}
            onChange={(e) => setNewExpenseAmount(e.target.value)}
            placeholder={`Amount in ${destination.currencySymbol}`}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
          />

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </form>

        {/* Expense List */}
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No expenses recorded yet.</p>
          ) : (
            expenses.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-800 text-sky-400">
                    {item.category === 'Food' ? (
                      <Utensils className="w-3.5 h-3.5" />
                    ) : item.category === 'Transport' ? (
                      <Car className="w-3.5 h-3.5" />
                    ) : item.category === 'Stay' ? (
                      <Hotel className="w-3.5 h-3.5" />
                    ) : (
                      <ShoppingBag className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">{item.title}</span>
                    <span className="text-[10px] text-slate-500">{item.date} • {item.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-bold text-slate-100 font-mono block">
                      {item.amount.toLocaleString()} {item.currency}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ≈ {item.homeCurrency === 'INR' ? '₹' : '$'}{item.homeAmount}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteExpense(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
