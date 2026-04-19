import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Settings, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingDown, 
  ChevronRight,
  Save,
  Trash2,
  Plus,
  DollarSign,
  Scale
} from 'lucide-react';
import { Ingredient, Nutrition, PhaseRequirement, FeedEntry } from './types';
import { DEFAULT_INGREDIENTS, ROSS_308_PHASES_3, ROSS_308_PHASES_4, ROSS_308_PHASES_5, INITIAL_NUTRITION } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState<'mixture' | 'nutrition' | 'results'>('mixture');
  
  // Persistence Loading
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('ross308_ingredients');
    return saved ? JSON.parse(saved) : DEFAULT_INGREDIENTS;
  });

  const [mixture, setMixture] = useState<FeedEntry[]>(() => {
    const saved = localStorage.getItem('ross308_mixture');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedPhaseCount, setSelectedPhaseCount] = useState<number>(() => {
    const saved = localStorage.getItem('ross308_phaseCount');
    return saved ? parseInt(saved) : 3;
  });
  
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Persistence Saving
  useEffect(() => {
    localStorage.setItem('ross308_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('ross308_mixture', JSON.stringify(mixture));
  }, [mixture]);

  useEffect(() => {
    localStorage.setItem('ross308_phaseCount', selectedPhaseCount.toString());
  }, [selectedPhaseCount]);

  // Filter phases based on user selection
  const availablePhases = useMemo(() => {
    if (selectedPhaseCount === 3) return ROSS_308_PHASES_3;
    if (selectedPhaseCount === 4) return ROSS_308_PHASES_4;
    return ROSS_308_PHASES_5; // Default for 5
  }, [selectedPhaseCount]);
  
  const currentRequirement = availablePhases[currentPhaseIndex]?.nutrition || availablePhases[0].nutrition;

  const activeIngredients = useMemo(() => {
    return mixture.map(m => ingredients.find(ing => ing.id === m.ingredientId)).filter(Boolean) as Ingredient[];
  }, [mixture, ingredients]);

  // Global calculations
  const totalPercentage = useMemo(() => {
    return mixture.reduce((sum, entry) => sum + entry.percentage, 0);
  }, [mixture]);

  const actualNutrition = useMemo(() => {
    const result = { ...INITIAL_NUTRITION };
    mixture.forEach(entry => {
      const ing = ingredients.find(i => i.id === entry.ingredientId);
      if (ing && entry.percentage > 0) {
        const ratio = entry.percentage / 100;
        Object.keys(result).forEach(key => {
          const k = key as keyof Nutrition;
          (result[k] as number) += (ing.nutrition[k] || 0) * ratio;
        });
      }
    });
    return result;
  }, [mixture, ingredients]);

  const costPerKg = useMemo(() => {
    return mixture.reduce((sum, entry) => {
      const ing = ingredients.find(i => i.id === entry.ingredientId);
      if (ing) return sum + (ing.price * entry.percentage / 100);
      return sum;
    }, 0);
  }, [mixture, ingredients]);

  const handlePercentageChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMixture(prev => prev.map(item => 
      item.ingredientId === id ? { ...item, percentage: numValue } : item
    ));
  };

  const handlePriceChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setIngredients(prev => prev.map(item => 
      item.id === id ? { ...item, price: numValue } : item
    ));
  };

  const updateIngredientNutrition = (id: string, field: keyof Nutrition, value: string) => {
    const numValue = parseFloat(value) || 0;
    setIngredients(prev => prev.map(item => 
      item.id === id ? { ...item, nutrition: { ...item.nutrition, [field]: numValue } } : item
    ));
  };

  const addIngredientToMixture = (id: string) => {
    if (mixture.some(m => m.ingredientId === id)) return;
    setMixture(prev => [...prev, { ingredientId: id, percentage: 0 }]);
  };

  const removeIngredientFromMixture = (id: string) => {
    setMixture(prev => prev.filter(m => m.ingredientId !== id));
  };

  const addNewIngredient = () => {
    const newId = `custom-${Date.now()}`;
    const newIng: Ingredient = {
      id: newId,
      name: "مكون جديد",
      price: 0,
      nutrition: { ...INITIAL_NUTRITION }
    };
    setIngredients(prev => [...prev, newIng]);
    setEditingIngredientId(newId);
    addIngredientToMixture(newId);
  };

  const resetIngredientToDefault = (id: string) => {
    const defaultIng = DEFAULT_INGREDIENTS.find(i => i.id === id);
    if (defaultIng) {
      setIngredients(prev => prev.map(item => item.id === id ? { ...defaultIng } : item));
    } else {
      // If it's a custom ingredient, we can't "reset" it to a default, 
      // but maybe clear its nutrition to INITIAL_NUTRITION
      setIngredients(prev => prev.map(item => 
        item.id === id ? { ...item, nutrition: { ...INITIAL_NUTRITION }, price: 0 } : item
      ));
    }
  };

  const getEvaluation = (actual: number, required: number) => {
    if (required === 0) return { label: '-', color: 'text-gray-400' };
    const diffPercent = ((actual - required) / required) * 100;
    if (Math.abs(diffPercent) <= 2) return { label: 'ممتاز', color: 'text-green-500' };
    if (Math.abs(diffPercent) <= 5) return { label: 'ضمن الحدود', color: 'text-blue-500' };
    return { label: 'يحتاج تعديل', color: 'text-red-500' };
  };

  const getRecommendations = () => {
    const recs: string[] = [];
    const keys: (keyof Nutrition)[] = ['ME', 'CP', 'Ca', 'avP', 'K', 'Na', 'Cl', 'dLys', 'dMet', 'dThr'];
    
    keys.forEach(k => {
      const act = actualNutrition[k] || 0;
      const req = currentRequirement[k] || 0;
      if (req > 0) {
        const diffPercent = ((act - req) / req) * 100;
        const displayLabel = k === 'avP' ? 'av.P' : k === 'dMet' ? 'Met+Cys' : k === 'K' ? 'Potassium (K)' : k;
        if (diffPercent > 5) recs.push(`العنصر ${displayLabel} مرتفع بنسبة ${diffPercent.toFixed(1)}% عن الاحتياج.`);
        if (diffPercent < -5) recs.push(`العنصر ${displayLabel} منخفض بنسبة ${Math.abs(diffPercent).toFixed(1)}% عن الاحتياج.`);
      }
    });

    if (totalPercentage !== 100) {
      recs.push(`تنبيه: مجموع المكونات هو ${totalPercentage.toFixed(2)}%، يجب أن يكون 100%.`);
    }

    return recs;
  };

  const nutrientsToEdit: { key: keyof Nutrition; label: string }[] = [
    { key: 'ME', label: 'ME (Energy)' },
    { key: 'CP', label: 'CP (Protein)' },
    { key: 'Ca', label: 'Ca' },
    { key: 'avP', label: 'av.P' },
    { key: 'Na', label: 'Na' },
    { key: 'Cl', label: 'Cl' },
    { key: 'dLys', label: 'Lys' },
    { key: 'dMet', label: 'Met+Cys' },
    { key: 'dThr', label: 'Thr' },
    { key: 'K', label: 'Potassium (K %)' },
    { key: 'dVal', label: 'Val' },
    { key: 'dIso', label: 'Iso' },
    { key: 'dArg', label: 'Arg' },
    { key: 'dGlySer', label: 'Gly+Ser' },
    { key: 'dPhe', label: 'Phe' },
    { key: 'dPheTyr', label: 'Phe+Tyr' },
    { key: 'choline', label: 'Choline (mg/kg)' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans rtl" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg shadow-sm">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">محلل علائق Ross 308</h1>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Scientific Poultry Nutrition v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button 
              onClick={() => setActiveTab('mixture')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'mixture' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Scale className="w-4 h-4" />
              إدخال الخلطة
            </button>
            <button 
              onClick={() => setActiveTab('nutrition')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'nutrition' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Settings className="w-4 h-4" />
              تعديل المكونات
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'results' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FileText className="w-4 h-4" />
              النتائج والتحليل
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* TO-DO: Implement Phases selection here globally or in results */}
          {activeTab === 'results' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6"
            >
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-1">نظام التغذية والمرحلة</h3>
                <p className="text-sm text-blue-700">اختر عدد المراحل والمرحلة الحالية للمقارنة الدقيقة.</p>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-blue-200">
                  {[3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => {
                        setSelectedPhaseCount(n);
                        setCurrentPhaseIndex(0);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedPhaseCount === n ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      {n} مراحل
                    </button>
                  ))}
                </div>
                <div className="h-8 w-px bg-blue-200 hidden md:block"></div>
                <select 
                  value={currentPhaseIndex}
                  onChange={(e) => setCurrentPhaseIndex(parseInt(e.target.value))}
                  className="bg-white border border-blue-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {availablePhases.map((p, idx) => (
                    <option key={idx} value={idx}>{p.name} ({p.days})</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}

          {activeTab === 'mixture' && (
            <motion.div
              key="mixture"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                    <h2 className="font-bold flex items-center gap-2">
                      <Scale className="w-5 h-5 text-green-600" />
                      تكوين الخلطة المختارة
                    </h2>
                    <div className="flex items-center gap-3">
                       <button 
                        onClick={addNewIngredient}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                       >
                         <Plus className="w-3 h-3" />
                         مكون جديد
                       </button>
                       <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${totalPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                         المجموع: {totalPercentage.toFixed(2)}%
                       </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] min-w-[1200px]">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-center">
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-3 text-right sticky right-0 bg-gray-50 z-10 w-40">المكون</th>
                          <th className="px-2 py-3 w-20">النسبة (%)</th>
                          <th className="px-2 py-3 w-16 text-blue-600">ME</th>
                          <th className="px-2 py-3 w-16 text-blue-600">CP %</th>
                          <th className="px-2 py-3 w-16">Ca</th>
                          <th className="px-2 py-3 w-16">av.P</th>
                          <th className="px-2 py-3 w-16">K %</th>
                          <th className="px-2 py-3 w-16">Na</th>
                          <th className="px-2 py-3 w-16">dLys</th>
                          <th className="px-2 py-3 w-16">dM+C</th>
                          <th className="px-2 py-3 w-16">dThr</th>
                          <th className="px-2 py-3 w-16">dVal</th>
                          <th className="px-2 py-3 w-16">dIso</th>
                          <th className="px-2 py-3 w-16 text-purple-600">Choline</th>
                          <th className="px-2 py-3 w-20 text-green-600">السعر ($)</th>
                          <th className="px-2 py-3 w-24">التكلفة</th>
                          <th className="px-4 py-3 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activeIngredients.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="px-6 py-12 text-center text-gray-400 italic">
                              لم يتم اختيار أي مكونات بعد. ابدأ بإضافة مكونات من القائمة الجانبية أو إنشاء مكون جديد.
                            </td>
                          </tr>
                        ) : (
                          activeIngredients.map((ing) => {
                            const mixItem = mixture.find(m => m.ingredientId === ing.id);
                            return (
                              <tr key={ing.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-4 py-3 font-bold text-gray-700 sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-gray-50">
                                  <input 
                                    type="text"
                                    value={ing.name}
                                    onChange={(e) => setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, name: e.target.value } : i))}
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none hover:bg-gray-100 rounded px-1 transition-colors"
                                  />
                                </td>
                                <td className="px-1 py-3 text-center">
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={mixItem?.percentage || ''}
                                    placeholder="0.00"
                                    onChange={(e) => handlePercentageChange(ing.id, e.target.value)}
                                    className="w-16 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.ME}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'ME', e.target.value)}
                                    className="w-14 bg-blue-50/50 border border-blue-100 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.CP}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'CP', e.target.value)}
                                    className="w-14 bg-blue-50/50 border border-blue-100 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.Ca}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'Ca', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.avP}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'avP', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.K}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'K', e.target.value)}
                                    className="w-12 bg-orange-50/50 border border-orange-100 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-orange-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.Na}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'Na', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.dLys}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'dLys', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.dMet}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'dMet', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.dThr}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'dThr', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.dVal}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'dVal', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.dIso}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'dIso', e.target.value)}
                                    className="w-12 bg-gray-50 border border-gray-200 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.nutrition.choline}
                                    onChange={(e) => updateIngredientNutrition(ing.id, 'choline', e.target.value)}
                                    className="w-14 bg-purple-50 border border-purple-100 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-purple-300 outline-none text-[10px]"
                                  />
                                </td>
                                <td className="px-1 py-3">
                                  <input 
                                    type="number"
                                    value={ing.price}
                                    onChange={(e) => handlePriceChange(ing.id, e.target.value)}
                                    className="w-16 bg-green-50/50 border border-green-100 rounded px-1 py-1 text-center font-mono focus:bg-white focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                  />
                                </td>
                                <td className="px-2 py-3 text-center font-mono text-gray-500">
                                  ${((ing.price * (mixItem?.percentage || 0)) / 100).toFixed(4)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    onClick={() => removeIngredientFromMixture(ing.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="w-full lg:w-80 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[500px]">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" />
                        أضف مكوّن للقائمة
                      </div>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1">
                      {ingredients.filter(ing => !mixture.some(m => m.ingredientId === ing.id)).map(ing => (
                        <button
                          key={ing.id}
                          onClick={() => addIngredientToMixture(ing.id)}
                          className="w-full text-right px-4 py-2 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all flex items-center justify-between group"
                        >
                          {ing.name}
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <DollarSign className="w-20 h-20" />
                    </div>
                    <h3 className="text-xs font-medium opacity-80 mb-4">ملخص التكاليف</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] opacity-60 mb-1">سعر الكيلو الواحد</p>
                        <p className="text-2xl font-bold font-mono">${costPerKg.toFixed(4)}</p>
                      </div>
                      <div className="pt-4 border-t border-green-800">
                        <p className="text-[10px] opacity-60 mb-1">سعر الطن المتوقع</p>
                        <p className="text-xl font-bold font-mono text-green-300 tracking-tight">${(costPerKg * 1000).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-[calc(100vh-12rem)] sticky top-24">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  قائمة المكونات
                </div>
                <div className="overflow-y-auto h-full pb-20">
                  {ingredients.map((ing) => (
                    <button
                      key={ing.id}
                      onClick={() => setEditingIngredientId(ing.id)}
                      className={`w-full px-6 py-4 text-right border-b border-gray-50 transition-all flex items-center justify-between hover:bg-gray-50 ${editingIngredientId === ing.id ? 'bg-green-50 border-r-4 border-r-green-600' : ''}`}
                    >
                      <span className={`text-sm font-medium ${editingIngredientId === ing.id ? 'text-green-700' : 'text-gray-700'}`}>{ing.name}</span>
                      <ChevronRight className={`w-4 h-4 transform rotate-180 ${editingIngredientId === ing.id ? 'text-green-600' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                {editingIngredientId ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{ingredients.find(i => i.id === editingIngredientId)?.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {ingredients.find(i => i.id === editingIngredientId)?.name.includes('أنزيم') 
                            ? 'إدخال المصفوفة الغذائية (Matrix) لكل 1 كغ إنزيم خالص.' 
                            : 'تعديل قيم التحليل الكيميائي والغذائي لكل 1 كغ من هذا المكون.'}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl text-blue-700">
                        <Save className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <button
                        onClick={() => editingIngredientId && resetIngredientToDefault(editingIngredientId)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        استعادة الافتراضي
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {nutrientsToEdit.map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{label}</label>
                          <div className="relative">
                            <input 
                              type="number"
                              step="0.001"
                              value={ingredients.find(i => i.id === editingIngredientId)?.nutrition[key] || 0}
                              onChange={(e) => updateIngredientNutrition(editingIngredientId, key, e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-lg transition-all focus:bg-white focus:ring-2 focus:ring-green-500 outline-none pr-12"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 uppercase">
                              / 1kg
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl h-96 flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                      <Settings className="w-12 h-12" />
                    </div>
                    <p className="font-medium">اختر مكوناً من القائمة الجانبية للبدء بتعديله</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 pb-20"
            >
              {/* Energy & Minerals Table */}
              <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <Calculator className="w-5 h-5" />
                     </div>
                     <h2 className="text-xl font-bold">جدول الطاقة والمعادن</h2>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                     <span className="text-xs text-gray-500">التكلفة المقدرة:</span>
                     <span className="font-mono font-bold text-green-600">${(costPerKg * 1000).toFixed(2)} / طن</span>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100">
                        <th className="px-8 py-4 text-right">العنصر</th>
                        <th className="px-8 py-4 text-center">الاحتياج المطلوب</th>
                        <th className="px-8 py-4 text-center">المتحقق</th>
                        <th className="px-8 py-4 text-center">الفرق</th>
                        <th className="px-8 py-4 text-center">التقييم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { k: 'ME', l: 'الطاقة الممثلة (ME)', u: 'kcal' },
                        { k: 'CP', l: 'بروتين خام (CP)', u: '%' },
                        { k: 'Ca', l: 'كالسيوم (Ca)', u: '%' },
                        { k: 'avP', l: 'فسفور متاح (av.P)', u: '%' },
                        { k: 'K', l: 'بوتاسيوم (K)', u: '%' },
                        { k: 'Na', l: 'صوديوم (Na)', u: '%' },
                        { k: 'Cl', l: 'كلور (Cl)', u: '%' },
                        { k: 'choline', l: 'الكولين (mg/kg)', u: 'mg' },
                      ].map(({ k, l, u }) => {
                        const key = k as keyof Nutrition;
                        const act = actualNutrition[key] || 0;
                        const req = currentRequirement[key] || 0;
                        const diff = act - req;
                        const evalRes = getEvaluation(act, req);
                        return (
                          <tr key={k} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4">
                              <span className="font-bold text-gray-800">{l}</span>
                              <span className="text-[10px] text-gray-400 mr-2 uppercase">{u}</span>
                            </td>
                            <td className="px-8 py-4 text-center font-mono text-gray-600">{req.toFixed(2)}</td>
                            <td className="px-8 py-4 text-center font-mono font-bold text-blue-700">{act.toFixed(2)}</td>
                            <td className={`px-8 py-4 text-center font-mono ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                            </td>
                            <td className="px-8 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-100 shadow-sm ${evalRes.color}`}>
                                {evalRes.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Amino Acids Table */}
              <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <CheckCircle2 className="w-5 h-5" />
                     </div>
                     <h2 className="text-xl font-bold">جدول الأحماض الأمينية المهضومة (%)</h2>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100">
                        <th className="px-8 py-4 text-right">الحمض الأميني</th>
                        <th className="px-8 py-4 text-center">الاحتياج المطلوب</th>
                        <th className="px-8 py-4 text-center">المتحقق</th>
                        <th className="px-8 py-4 text-center">الفرق</th>
                        <th className="px-8 py-4 text-center">التقييم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { k: 'dLys', l: 'لايسين (dLys)' },
                        { k: 'dMet', l: 'الميثيونين + السيستين (dM+C)' },
                        { k: 'dThr', l: 'ثريونين (dThr)' },
                        { k: 'dVal', l: 'فالين (dVal)' },
                        { k: 'dIso', l: 'إيزوليوسين (dIso)' },
                        { k: 'dArg', l: 'أرجنين (dArg)' },
                        { k: 'dGlySer', l: 'غليسين + سيرين (dG+S)' },
                        { k: 'dPhe', l: 'فينيل ألانين (dPhe)' },
                        { k: 'dPheTyr', l: 'فينيل ألانين + تيروسين' },
                      ].map(({ k, l }) => {
                        const key = k as keyof Nutrition;
                        const act = actualNutrition[key] || 0;
                        const req = currentRequirement[key] || 0;
                        const diff = act - req;
                        const evalRes = getEvaluation(act, req);
                        return (
                          <tr key={k} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4 font-bold text-gray-800">{l}</td>
                            <td className="px-8 py-4 text-center font-mono text-gray-600">{req.toFixed(3)}</td>
                            <td className="px-8 py-4 text-center font-mono font-bold text-indigo-700">{act.toFixed(3)}</td>
                            <td className={`px-8 py-4 text-center font-mono ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(3)}
                            </td>
                            <td className="px-8 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-100 shadow-sm ${evalRes.color}`}>
                                {evalRes.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Scientific Commentary */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm h-full">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white">
                        <AlertCircle className="w-5 h-5" />
                     </div>
                     <h2 className="text-xl font-bold">التعليق العلمي والتوصيات</h2>
                   </div>
                   <div className="space-y-4">
                     {getRecommendations().length > 0 ? (
                       getRecommendations().map((rec, i) => (
                         <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 shrink-0"></div>
                            <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                         </div>
                       ))
                     ) : (
                       <div className="p-10 text-center space-y-4">
                         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                         </div>
                         <p className="text-gray-500">العليقة مطابقة تماماً للاحتياجات الغذائية لسلالة Ross 308.</p>
                       </div>
                     )}
                   </div>
                </div>

                <div className="bg-[#151619] text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden h-full">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingDown className="w-6 h-6 text-green-400" />
                    تحليل الكفاءة الاقتصادية
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs text-white/40 mb-1">حمولة البروتين</p>
                          <p className="text-xl font-mono">{(actualNutrition.CP / (costPerKg || 1)).toFixed(2)}</p>
                          <p className="text-[10px] text-white/30 uppercase mt-1">CP / $</p>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-xs text-white/40 mb-1">كفاءة الطاقة</p>
                          <p className="text-xl font-mono">{(actualNutrition.ME / (costPerKg || 1)).toFixed(0)}</p>
                          <p className="text-[10px] text-white/30 uppercase mt-1">kcal / $</p>
                       </div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-sm italic leading-relaxed text-white/70">
                         "الخلطة الحالية توزع التكاليف بنسبة رئيسية على المكونات البروتينية. ينصح بمراجعة نسبة {ingredients.find(i => i.name.includes('صويا'))?.name} في حال ارتفاع سعر الصويا العالمي لتقليل تكلفة الطن مع الحفاظ على مستويات اللايسين."
                       </p>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
               <div className={`w-2 h-2 rounded-full ${totalPercentage === 100 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
               <span>{totalPercentage.toFixed(2)}% إجمالي النسبة</span>
             </div>
             <div className="hidden sm:flex items-center gap-1">
               <DollarSign className="w-3 h-3" />
               <span>توزيع المكونات: {ingredients.length}</span>
             </div>
           </div>
           <div>Ross 308 Standards &copy; 2026</div>
        </div>
      </footer>
    </div>
  );
}
