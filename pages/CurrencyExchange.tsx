
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Coins, 
  Globe,
  Wallet
} from 'lucide-react';

const SUPPORTED_CURRENCIES = [
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  { code: 'MZN', name: 'Mozambican Metical', flag: '🇲🇿', symbol: 'MT' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'PLN', name: 'Polish Zloty', flag: '🇵🇱', symbol: 'zł' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', symbol: '¥' },
];

// Base Rate relative to ZAR (1 ZAR = X Currency)
const INITIAL_RATES_TO_ZAR: Record<string, number> = {
  'ZAR': 1, 
  'MZN': 3.45,
  'USD': 0.053,
  'GBP': 0.042,
  'PLN': 0.21,
  'EUR': 0.049,
  'AUD': 0.081,
  'CAD': 0.072,
  'JPY': 7.95,
  'CNY': 0.38
};

// Mock Wallet Holdings
const MOCK_HOLDINGS: Record<string, number> = {
    'USD': 50000,
    'ZAR': 125000,
    'MZN': 450000
};

export const CurrencyExchange: React.FC = () => {
  const [rates, setRates] = useState(INITIAL_RATES_TO_ZAR);
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('ZAR');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate live tickers
  useEffect(() => {
    const interval = setInterval(() => {
        setRates(prev => {
            const newRates = { ...prev };
            Object.keys(newRates).forEach(key => {
                if (key !== 'ZAR') { // Keep base anchor stable for mock
                  const change = (Math.random() - 0.5) * 0.005; // Small random fluctuation
                  newRates[key] = newRates[key] * (1 + change);
                }
            });
            return newRates;
        });
        setLastUpdated(new Date());
    }, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSwap = () => {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
  };

  // Conversion Logic: 
  // Rate_From = X units per 1 ZAR
  // Rate_To = Y units per 1 ZAR
  // Amount in ZAR = Amount / Rate_From
  // Converted Amount = Amount in ZAR * Rate_To
  // Simplified: Amount * (Rate_To / Rate_From)
  
  const rateFrom = rates[fromCurrency];
  const rateTo = rates[toCurrency];
  const exchangeRate = rateTo / rateFrom;
  
  const convertedAmount = parseFloat(amount || '0') * exchangeRate;

  // Portfolio Valuation Logic
  // Convert each holding to ZAR first (Holding / Rate_Code), then to Target (Total_ZAR * Rate_Target)
  const totalPortfolioValue = Object.entries(MOCK_HOLDINGS).reduce((acc, [code, qty]) => {
      const rateCode = rates[code] || 1;
      const valInZar = qty / rateCode;
      return acc + valInZar;
  }, 0) * rateTo;

  const fromSymbol = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)?.symbol;
  const toSymbol = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency)?.symbol;
  
  return (
    <div className="space-y-6 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Globe className="text-indigo-600" /> Currency Exchange
                </h2>
                <p className="text-slate-500 mt-2">Real-time conversions and global forex market data.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 Market Live • Updated: {lastUpdated.toLocaleTimeString()}
            </div>
        </div>

        {/* Main Converter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                        <Coins size={20} className="text-amber-500" /> Converter
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center mb-8">
                        {/* FROM */}
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-sm font-bold text-slate-500">From</label>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
                                <div className="flex justify-between items-center mb-1">
                                    <select 
                                        value={fromCurrency} 
                                        onChange={e => setFromCurrency(e.target.value)}
                                        className="bg-transparent font-bold text-lg outline-none text-slate-900 dark:text-white cursor-pointer"
                                    >
                                        {SUPPORTED_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                        ))}
                                    </select>
                                </div>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="bg-transparent text-3xl font-black text-slate-900 dark:text-white outline-none w-full"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-slate-400 font-medium truncate mt-1">
                                    {SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)?.name}
                                </p>
                            </div>
                        </div>

                        {/* SWAP */}
                        <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                            <button 
                                onClick={handleSwap}
                                className="p-3 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-900/30 transition-all shadow-sm active:scale-95"
                            >
                                <ArrowRightLeft size={20} />
                            </button>
                        </div>

                        {/* TO */}
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-sm font-bold text-slate-500">To</label>
                            <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-500/20 flex flex-col text-white relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <select 
                                            value={toCurrency} 
                                            onChange={e => setToCurrency(e.target.value)}
                                            className="bg-transparent font-bold text-lg outline-none text-white cursor-pointer [&>option]:text-slate-900"
                                        >
                                            {SUPPORTED_CURRENCIES.map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-3xl font-black truncate">
                                        {convertedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </div>
                                    <p className="text-xs text-indigo-200 font-medium truncate mt-1">
                                        {SUPPORTED_CURRENCIES.find(c => c.code === toCurrency)?.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                        <span className="text-slate-500 mb-2 md:mb-0">Exchange Rate</span>
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-700 dark:text-slate-300">
                             1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                             <span className="text-slate-300">|</span>
                             1 {toCurrency} = {(1/exchangeRate).toFixed(4)} {fromCurrency}
                        </div>
                    </div>
                </div>

                {/* Popular Rates Grid */}
                <div className="mt-8">
                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Live Rates (vs {fromCurrency})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {SUPPORTED_CURRENCIES.filter(c => c.code !== fromCurrency).slice(0, 6).map(currency => {
                            const thisRate = rates[currency.code] / rates[fromCurrency];
                            const prevRate = INITIAL_RATES_TO_ZAR[currency.code] / INITIAL_RATES_TO_ZAR[fromCurrency];
                            const isUp = thisRate >= prevRate;

                            return (
                                <div key={currency.code} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{currency.flag}</span>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{currency.code}</p>
                                            <p className="text-xs text-slate-500">{currency.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-slate-900 dark:text-white">{thisRate.toFixed(3)}</p>
                                        <div className={`text-[10px] font-bold flex items-center justify-end ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isUp ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                                            {Math.abs((thisRate - prevRate) / prevRate * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Sidebar / Wallet Stats */}
            <div className="space-y-6">
                 <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl">
                      <div className="flex items-center gap-2 mb-6 opacity-80">
                          <Wallet size={20} />
                          <span className="text-sm font-bold uppercase tracking-wider">Estimated Holdings</span>
                      </div>
                      <div className="space-y-6">
                           <div>
                               <p className="text-indigo-300 text-xs mb-1">Total in Base ({toCurrency})</p>
                               <h3 className="text-3xl font-black">{toSymbol} {totalPortfolioValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                           </div>
                           <div className="w-full h-px bg-white/10"></div>
                           <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">🇺🇸</div>
                                        <span className="font-bold">USD</span>
                                    </div>
                                    <span className="font-mono">$ {MOCK_HOLDINGS['USD'].toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">🇿🇦</div>
                                        <span className="font-bold">ZAR</span>
                                    </div>
                                    <span className="font-mono">R {MOCK_HOLDINGS['ZAR'].toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">🇲🇿</div>
                                        <span className="font-bold">MZN</span>
                                    </div>
                                    <span className="font-mono">MT {MOCK_HOLDINGS['MZN'].toLocaleString()}</span>
                                </div>
                           </div>
                      </div>
                 </div>

                 <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800">
                      <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-2">Forex Insight</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                          The ZAR has strengthened 1.2% against the USD this week. Consider capitalizing on import payments now.
                      </p>
                 </Card>
            </div>
        </div>
    </div>
  );
};
