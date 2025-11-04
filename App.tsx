
import React, { useState, useCallback, useEffect } from 'react';
import { generateCuttingPlan } from './services/geminiService';
import type { Rod, CuttingPlan, StockRodUsage } from './types';
import { translations } from './translations';

// SVG Icons
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);

const RulerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L3 8.4a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0L15.3 9" />
        <path d="m14.3 10.3 8.7 8.7" />
        <path d="m8 6 2-2" />
        <path d="m12 10 2-2" />
        <path d="m16 14 2-2" />
        <path d="m6 8 2-2" />
    </svg>
);

const PaletteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const backgroundOptions = [
  { id: 'default', name: 'Default Dark', class: 'bg-gray-900' },
  { id: 'metal', name: 'Brushed Metal', class: 'bg-animated-metal' },
  { id: 'ocean', name: 'Deep Ocean', class: 'bg-animated-ocean' },
  { id: 'blueprint', name: 'Blueprint', class: 'bg-blueprint' },
];

const backgroundClassMap: { [key: string]: string } = {
    default: 'bg-gray-900',
    metal: 'bg-animated-metal',
    ocean: 'bg-animated-ocean',
    blueprint: 'bg-blueprint'
};

const BackgroundSelector: React.FC<{ setBackground: (id: string) => void }> = ({ setBackground }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition"
                aria-label="Change background"
            >
                <PaletteIcon />
            </button>
            {isOpen && (
                <div className="absolute top-full end-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 z-10">
                    <p className="text-sm text-gray-400 px-2 pb-2">Backgrounds</p>
                    <div className="grid grid-cols-2 gap-2">
                        {backgroundOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => { setBackground(opt.id); setIsOpen(false); }}
                                className="w-full h-10 rounded-md border-2 border-transparent hover:border-cyan-400 focus:border-cyan-400 transition"
                                title={opt.name}
                            >
                                <div className={`w-full h-full rounded ${opt.class}`}></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to create a new Rod object
const createNewRod = (): Rod => ({
  id: crypto.randomUUID(),
  length: 0,
  quantity: 1,
});

interface RodInputListProps {
  title: string;
  rods: Rod[];
  setRods: React.Dispatch<React.SetStateAction<Rod[]>>;
  addButtonLabel: string;
  t: (key: keyof typeof translations.en) => string;
}

const RodInputList: React.FC<RodInputListProps> = ({ title, rods, setRods, addButtonLabel, t }) => {
  const addRod = () => {
    setRods(prev => [...prev, createNewRod()]);
  };

  const updateRod = (id: string, field: 'length' | 'quantity', value: number) => {
    setRods(prev => prev.map(rod => rod.id === id ? { ...rod, [field]: value } : rod));
  };

  const removeRod = (id: string) => {
    setRods(prev => prev.filter(rod => rod.id !== id));
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-cyan-400 mb-3">{title}</h3>
      <div className="space-y-3 max-h-60 overflow-y-auto pe-2">
        {rods.map((rod, index) => (
          <div key={rod.id} className="grid grid-cols-12 gap-2 items-center animate-fade-in">
            <span className="col-span-1 text-sm text-gray-400">{index + 1}.</span>
            <div className="col-span-5">
              <label className="text-xs text-gray-400">{t('lengthCm')}</label>
              <input
                type="number"
                value={rod.length || ''}
                onChange={(e) => updateRod(rod.id, 'length', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder={t('lengthPlaceholder')}
              />
            </div>
            <div className="col-span-4">
              <label className="text-xs text-gray-400">{t('quantity')}</label>
              <input
                type="number"
                value={rod.quantity || ''}
                onChange={(e) => updateRod(rod.id, 'quantity', parseInt(e.target.value, 10))}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                placeholder={t('quantityPlaceholder')}
              />
            </div>
            <div className="col-span-2 flex justify-end">
                <button
                    onClick={() => removeRod(rod.id)}
                    className="mt-4 p-2 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                    aria-label="Remove rod"
                >
                    <TrashIcon />
                </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addRod} className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-transform transform hover:scale-105">
        <PlusIcon /> {addButtonLabel}
      </button>
    </div>
  );
};

const ResultsSummary: React.FC<{ plan: CuttingPlan; t: (key: keyof typeof translations.en) => string; onExport: () => void; }> = ({ plan, t, onExport }) => (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-6 rounded-lg">
        <div className="text-center">
            <p className="text-base text-gray-300">{t('totalWaste')}</p>
            <p className="text-4xl font-bold text-red-400 my-1" dir="ltr">
                ({plan.summary.totalWaste.toFixed(2)})
                <span className="text-2xl text-gray-400 font-medium mx-2">{plan.summary.wastePercentage.toFixed(2)}%</span>
                cm
            </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-600">
             <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex justify-around items-start text-start">
                {/* Offcut Waste - Placed first in DOM to be on the right in RTL */}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded border-2 border-orange-400 bg-gray-800/50"></div>
                    <div>
                        <p className="text-sm text-orange-400">{t('offcutWaste')}</p>
                        <p className="text-xl font-semibold">{plan.summary.totalOffcutWaste.toFixed(2)} cm</p>
                    </div>
                </div>
                {/* Blade Waste */}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded border-2 border-yellow-400 bg-gray-800/50"></div>
                    <div>
                        <p className="text-sm text-yellow-400">{t('bladeWaste')}</p>
                        <p className="text-xl font-semibold">{plan.summary.totalKerfWaste.toFixed(2)} cm</p>
                    </div>
                </div>
             </div>
        </div>

        <div className="mt-6 text-center">
            <button
              onClick={onExport}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition-transform transform hover:scale-105"
            >
              {t('exportToPdf')}
            </button>
        </div>
    </div>
);


const RodVisualization: React.FC<{ usage: StockRodUsage, index: number, bladeThickness: number, t: (key: keyof typeof translations.en) => string }> = ({ usage, index, bladeThickness, t }) => {
  const totalLength = usage.stockRodLength;
  if (totalLength <= 0) return null;

  return (
    <div className="mb-6 animate-fade-in" dir="ltr">
      <h4 className="text-md font-bold text-cyan-400 mb-2 text-start">
        {t('usingStockRod')} #{index + 1} <span className="font-normal text-gray-400">({totalLength.toFixed(2)} cm)</span>
      </h4>
      <div className="w-full h-10 bg-gray-600 flex rounded overflow-hidden border border-gray-500 text-black font-bold text-sm">
        {usage.cuts.map((cut, i) => (
          <React.Fragment key={`cut-${i}`}>
            <div
              style={{ width: `${(cut.length / totalLength) * 100}%` }}
              className="bg-cyan-400 flex items-center justify-center overflow-hidden"
              title={`Cut: ${cut.length.toFixed(2)} cm`}
            >
              <span className="truncate px-1">{cut.length.toFixed(2)}</span>
            </div>
            {/* Blade waste visualization */}
            <div
              style={{ width: `${(bladeThickness / totalLength) * 100}%` }}
              className="bg-gray-700 flex justify-center items-center"
              title={`${t('bladeWaste')}: ${bladeThickness.toFixed(2)} cm`}
            >
               <div className="w-[1px] h-full bg-yellow-400"></div>
            </div>
          </React.Fragment>
        ))}
        {usage.offcutWaste > 0.01 && (
          <div
            style={{ width: `${(usage.offcutWaste / totalLength) * 100}%` }}
            className="bg-red-500 flex items-center justify-center text-white overflow-hidden"
            title={`${t('offcutWaste')}: ${usage.offcutWaste.toFixed(2)} cm`}
          >
             <span className="truncate px-1">{usage.offcutWaste.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};


export default function App() {
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [background, setBackground] = useState('default');
  const [bladeThickness, setBladeThickness] = useState<number>(0.5);
  const [standardRodLength, setStandardRodLength] = useState<number>(600);
  const [standardRodQuantity, setStandardRodQuantity] = useState<number>(10);
  const [leftoverRods, setLeftoverRods] = useState<Rod[]>([]);
  const [requiredCuts, setRequiredCuts] = useState<Rod[]>([
      { id: crypto.randomUUID(), length: 55.5, quantity: 50 }
  ]);
  const [cuttingPlan, setCuttingPlan] = useState<CuttingPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = useCallback((key: keyof typeof translations.en) => {
    return translations[language][key] || translations['en'][key];
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(backgroundClassMap[background] || 'bg-gray-900', 'text-white');
  }, [background]);

  const handleExportToPDF = useCallback(() => {
    if (!cuttingPlan) return;

    const getRodVisualizationHTML = (usage: StockRodUsage, index: number) => {
        const totalLength = usage.stockRodLength;
        if (totalLength <= 0) return '';
        
        let segmentsHTML = '';
        usage.cuts.forEach((cut) => {
            segmentsHTML += `<div style="width: ${(cut.length / totalLength) * 100}%; background-color: #67e8f9; display: flex; align-items: center; justify-content: center; overflow: hidden; color: black; box-sizing: border-box;"><span>${cut.length.toFixed(2)}</span></div>`;
            segmentsHTML += `<div style="width: ${(bladeThickness / totalLength) * 100}%; background-color: #d1d5db; display: flex; justify-content: center; align-items: center; box-sizing: border-box;" title="Blade Waste: ${bladeThickness.toFixed(2)} cm"><div style="width: 1px; height: 100%; background-color: #facc15;"></div></div>`;
        });
        
        if (usage.offcutWaste > 0.01) {
            segmentsHTML += `<div style="width: ${(usage.offcutWaste / totalLength) * 100}%; background-color: #ef4444; color: white; display: flex; align-items: center; justify-content: center; overflow: hidden; box-sizing: border-box;"><span>${usage.offcutWaste.toFixed(2)}</span></div>`;
        }

        return `
            <div style="margin-bottom: 20px; text-align: ${language === 'ar' ? 'right' : 'left'};">
                <h4>${t('usingStockRod')} #${index + 1} (${totalLength.toFixed(2)} cm)</h4>
                <div style="direction: ltr; width: 100%; height: 30px; background-color: #e5e7eb; display: flex; border: 1px solid #ccc; font-size: 12px; border-radius: 4px; overflow: hidden;">
                    ${segmentsHTML}
                </div>
            </div>
        `;
    };

    const rodVisualizationsHTML = cuttingPlan.plan.map(getRodVisualizationHTML).join('');

    const unfulfilledCutsHTML = cuttingPlan.summary.unfulfilledCuts.length > 0 ? `
        <div style="padding: 10px; border: 1px solid #f59e0b; background-color: #fffbeb; margin-top: 20px; border-radius: 4px;">
            <h3>${t('unfulfilledCuts')}</h3>
            <p>${t('unfulfilledCutsMessage')}</p>
            <ul style="padding-${language === 'ar' ? 'right' : 'left'}: 20px;">
                ${cuttingPlan.summary.unfulfilledCuts.map(cut => `<li>${cut.quantity}x ${cut.length} cm</li>`).join('')}
            </ul>
        </div>
    ` : '';
    
    const htmlContent = `
      <html>
        <head>
          <title>${t('resultsTitle')}</title>
          <style>
            body { font-family: sans-serif; margin: 20px; color: #111827; }
            h1, h2, h3, h4 { margin: 0 0 10px 0; }
            .summary-container { text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 20px; }
            .summary-total p { margin: 0; }
            .total-waste-value { font-size: 2.5rem; font-weight: bold; color: #ef4444; }
            .waste-percentage { font-size: 1.5rem; color: #6b7280; }
            .summary-breakdown { display: flex; justify-content: space-around; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ccc; }
            .summary-item h3 { font-size: 1rem; color: #4b5568; margin-bottom: 5px; }
            .summary-item p { font-size: 1.25rem; font-weight: 600; margin: 0; }
          </style>
        </head>
        <body dir="${language === 'ar' ? 'rtl' : 'ltr'}">
          <h1>${t('title')}</h1>
          <h2>${t('resultsTitle')}</h2>
          <div class="summary-container">
            <div class="summary-total">
              <p>${t('totalWaste')}</p>
              <p class="total-waste-value">(${cuttingPlan.summary.totalWaste.toFixed(2)}) <span class="waste-percentage">${cuttingPlan.summary.wastePercentage.toFixed(2)}%</span> cm</p>
            </div>
            <div class="summary-breakdown">
                <div class="summary-item">
                  <h3>${t('offcutWaste')}</h3>
                  <p>${cuttingPlan.summary.totalOffcutWaste.toFixed(2)} cm</p>
                </div>
                <div class="summary-item">
                  <h3>${t('bladeWaste')}</h3>
                  <p>${cuttingPlan.summary.totalKerfWaste.toFixed(2)} cm</p>
                </div>
            </div>
          </div>
          ${rodVisualizationsHTML}
          ${unfulfilledCutsHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }, [cuttingPlan, bladeThickness, t, language]);


  const handleCalculate = useCallback(async () => {
    setError(null);
    setCuttingPlan(null);
    setIsLoading(true);

    const standardStock = standardRodLength > 0 && standardRodQuantity > 0 
      ? [{ id: 'standard', length: standardRodLength, quantity: standardRodQuantity }] 
      : [];
    const validLeftovers = leftoverRods.filter(r => r.length > 0 && r.quantity > 0);
    const allStockRods = [...standardStock, ...validLeftovers];
    const validCuts = requiredCuts.filter(r => r.length > 0 && r.quantity > 0);

    if (bladeThickness <= 0 || allStockRods.length === 0 || validCuts.length === 0) {
      setError(t('errorInput'));
      setIsLoading(false);
      return;
    }

    try {
      const result = await generateCuttingPlan(bladeThickness, allStockRods, validCuts);
      setCuttingPlan(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [bladeThickness, standardRodLength, standardRodQuantity, leftoverRods, requiredCuts, t]);

  return (
    <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
            <div className="absolute top-4 end-4 flex items-center gap-2">
                <BackgroundSelector setBackground={setBackground} />
                <button
                    onClick={() => setLanguage(lang => lang === 'en' ? 'ar' : 'en')}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition"
                >
                    {t('toggleLanguage')}
                </button>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4">
                <RulerIcon />
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    {t('title')}
                </h1>
            </div>
            <p className="mt-2 text-lg text-cyan-400">{t('subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-4 rounded-lg">
                <label htmlFor="bladeThickness" className="block text-lg font-semibold text-cyan-400 mb-2">
                    {t('bladeThickness')}
                </label>
                <input
                    id="bladeThickness"
                    type="number"
                    value={bladeThickness || ''}
                    onChange={(e) => setBladeThickness(parseFloat(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                    placeholder={t('bladeThicknessPlaceholder')}
                />
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">{t('standardStockRod')}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400">{t('lengthCm')}</label>
                        <input
                            type="number"
                            value={standardRodLength || ''}
                            onChange={(e) => setStandardRodLength(parseFloat(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                            placeholder={t('lengthPlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400">{t('quantity')}</label>
                        <input
                            type="number"
                            value={standardRodQuantity || ''}
                            onChange={(e) => setStandardRodQuantity(parseInt(e.target.value, 10))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                            placeholder={t('quantityPlaceholder')}
                        />
                    </div>
                </div>
            </div>

            <RodInputList title={t('existingLeftovers')} rods={leftoverRods} setRods={setLeftoverRods} addButtonLabel={t('addLeftover')} t={t}/>
            <RodInputList title={t('requiredCuts')} rods={requiredCuts} setRods={setRequiredCuts} addButtonLabel={t('addCut')} t={t}/>

            <button
              onClick={handleCalculate}
              disabled={isLoading}
              className="w-full text-lg bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ms-1 me-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('calculating')}
                </>
              ) : t('generatePlan')}
            </button>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8 bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-6 rounded-lg min-h-[60vh]">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">{t('resultsTitle')}</h2>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="animate-spin h-12 w-12 text-cyan-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-lg text-gray-300">{t('calculating')}</p>
                <p className="text-sm text-gray-500">This may take a moment.</p>
              </div>
            )}
            {error && <div className="bg-red-900/80 backdrop-blur-sm border border-red-700 text-red-200 p-4 rounded-md">{error}</div>}
            {cuttingPlan && (
              <div className="space-y-6">
                <ResultsSummary plan={cuttingPlan} t={t} onExport={handleExportToPDF} />
                
                {cuttingPlan.summary.unfulfilledCuts.length > 0 && (
                    <div className="bg-yellow-900/80 backdrop-blur-sm border border-yellow-700 text-yellow-200 p-4 rounded-md">
                        <h3 className="font-bold">{t('unfulfilledCuts')}</h3>
                        <p>{t('unfulfilledCutsMessage')}</p>
                        <ul className="list-disc list-inside mt-2">
                            {cuttingPlan.summary.unfulfilledCuts.map((cut, i) => (
                                <li key={i}>{cut.quantity}x {cut.length} cm</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pe-2">
                    {cuttingPlan.plan.map((usage, index) => (
                        <RodVisualization key={index} usage={usage} index={index} bladeThickness={bladeThickness} t={t} />
                    ))}
                </div>
              </div>
            )}
            {!isLoading && !cuttingPlan && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <p className="text-xl">{t('resultsPlaceholderTitle')}</p>
                <p>{t('resultsPlaceholderSubtitle')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
