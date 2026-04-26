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
  Scale,
  Printer,
  History,
  Copy,
  ArrowRightLeft,
  Lightbulb,
  Activity,
  LineChart as LineChartIcon,
  Facebook,
  MapPin,
  ExternalLink,
  RefreshCcw,
  Beaker,
  Database,
  Sun,
  FlaskConical,
  Wind,
  Droplets,
  CircleDot,
  Zap,
  Info,
  Calculator as CalculatorIcon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import GrowthEngineTool from './components/GrowthEngineTool';
import RegressionEngineTool from './components/RegressionEngineTool';
import SummerStrategyTool from './components/SummerStrategyTool';
import { SyrianBroilerEngine, ModelSettings } from './services/syrianModelEngine';
import { Ingredient, Nutrition, PhaseRequirement, FeedEntry, Snapshot, PerformanceStandard } from './types';
import { 
  DEFAULT_INGREDIENTS, 
  SBM_STANDARDS,
  CORN_STANDARDS,
  OIL_STANDARDS,
  LIMESTONE_STANDARDS,
  METHIONINE_STANDARDS,
  THREONINE_STANDARDS,
  VALINE_STANDARDS,
  ISOLEUCINE_STANDARDS,
  ARGININE_STANDARDS,
  CHOLINE_STANDARDS,
  DCP_STANDARDS,
  ENZYME_STANDARDS,
  ROSS_308_PHASES_3, 
  ROSS_308_PHASES_4, 
  ROSS_308_PHASES_5, 
  INITIAL_NUTRITION, 
  TOP_ADDITIVES, 
  TOP_COMPANIES,
  ROSS_308_PERFORMANCE_DATA 
} from './constants';

import PhytaseCalculator from './components/PhytaseCalculator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'mixture' | 'nutrition' | 'results' | 'compare' | 'additives' | 'performance' | 'simulator' | 'regression' | 'summer' | 'phytase'>('mixture');
  const [selectedPerformanceDay, setSelectedPerformanceDay] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(33);
  const [humidity, setHumidity] = useState<number>(55);
  const [performanceMode, setPerformanceMode] = useState<'standard' | 'advanced'>('standard');
  const [syrianModelSettings, setSyrianModelSettings] = useState({
    performanceFactor: 0.95,
    heatCorrection: true,
    cornType: 'Ukrainian' as 'Syrian' | 'Ukrainian',
    soyType: 'Soy46' as 'Soy44' | 'Soy46'
  });

  const [regressionCoeffs, setRegressionCoeffs] = useState({
    em: { a: 2.80, b: 0.015 },
    lys: { a: 1.00, b: 0.0010 }
  });

  const heatIndex = useMemo(() => {
    return SyrianBroilerEngine.calculateHeatIndex(temperature, humidity);
  }, [temperature, humidity]);

  const adjustedPerformanceData = useMemo(() => {
    let factor = 1;
    // Using Heat Index for performance scaling
    if (heatIndex > 26) {
      factor = 1 - (heatIndex - 23) * 0.016;
    } else if (heatIndex < 20) {
      factor = 1 + (20 - heatIndex) * 0.013;
    }

    let cumIntake = 0;
    return ROSS_308_PERFORMANCE_DATA.map(dayData => {
      if (dayData.day === 0) return { ...dayData };
      const adjDailyIntake = dayData.dailyIntake * factor;
      cumIntake += adjDailyIntake;
      return {
        ...dayData,
        dailyIntake: Math.round(adjDailyIntake),
        cumIntake: Math.round(cumIntake),
        fcr: cumIntake / dayData.weight,
      };
    });
  }, [temperature]);

  const fiDropPercent = useMemo(() => {
    const standardFI = ROSS_308_PERFORMANCE_DATA[selectedPerformanceDay]?.dailyIntake || 0;
    const adjustedFI = adjustedPerformanceData[selectedPerformanceDay]?.dailyIntake || 0;
    if (standardFI <= 0) return 0;
    return ((standardFI - adjustedFI) / standardFI) * 100;
  }, [selectedPerformanceDay, adjustedPerformanceData]);

  const currentHeatFactor = useMemo(() => {
    const hi = heatIndex;
    if (hi <= 28) return 1.0;
    if (hi >= 32) return 0.85;
    const frac = (hi - 28) / (32 - 28);
    const drop = 0.05 + frac * (0.15 - 0.05);
    return 1.0 - drop;
  }, [heatIndex]);
  
  const groupedAdditives = useMemo(() => {
    const groups: Record<string, typeof TOP_ADDITIVES> = {};
    TOP_ADDITIVES.forEach(add => {
      if (!groups[add.category]) groups[add.category] = [];
      groups[add.category].push(add);
    });
    return groups;
  }, []);
  
  // Persistence Loading
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('ross308_ingredients');
    return saved ? JSON.parse(saved) : DEFAULT_INGREDIENTS;
  });

  const [mixture, setMixture] = useState<FeedEntry[]>(() => {
    const saved = localStorage.getItem('ross308_mixture');
    return saved ? JSON.parse(saved) : [];
  });

  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const saved = localStorage.getItem('ross308_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [selectedPhaseCount, setSelectedPhaseCount] = useState<number>(() => {
    const saved = localStorage.getItem('ross308_phaseCount');
    return saved ? parseInt(saved) : 3;
  });

  const [allCustomPhases, setAllCustomPhases] = useState<{3: PhaseRequirement[], 4: PhaseRequirement[], 5: PhaseRequirement[]}>(() => {
    const saved = localStorage.getItem('ross308_customPhases');
    const defaults = {
      3: JSON.parse(JSON.stringify(ROSS_308_PHASES_3)),
      4: JSON.parse(JSON.stringify(ROSS_308_PHASES_4)),
      5: JSON.parse(JSON.stringify(ROSS_308_PHASES_5))
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deep merge or at least ensure dMetCys exists
        [3, 4, 5].forEach(count => {
          if (parsed[count]) {
            parsed[count] = parsed[count].map((p: PhaseRequirement, idx: number) => {
              const defP = defaults[count as 3|4|5][idx] || defaults[count as 3|4|5][0];
              return {
                ...p,
                nutrition: {
                  ...defP.nutrition, // Start with defaults
                  ...p.nutrition     // Overwrite with saved
                }
              };
            });
          }
        });
        return parsed;
      } catch (e) {
        console.error("Error parsing saved phases", e);
      }
    }
    return defaults;
  });
  
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [expandedAdditive, setExpandedAdditive] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(1);

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

  useEffect(() => {
    localStorage.setItem('ross308_customPhases', JSON.stringify(allCustomPhases));
  }, [allCustomPhases]);

  // Simulator State & Logic
  const [simulatorSourceId, setSimulatorSourceId] = useState<string>('');
  const [simulatorTargetId, setSimulatorTargetId] = useState<string>('');
  const [simulatorAmount, setSimulatorAmount] = useState<number>(3);

  useEffect(() => {
    if (!simulatorSourceId) {
      const sbm = ingredients.find(ing => ing.name.includes('صويا') || ing.name.toLowerCase().includes('soybean'));
      if (sbm) setSimulatorSourceId(sbm.id);
    }
    if (!simulatorTargetId) {
      const corn = ingredients.find(ing => ing.name.includes('ذرة') || ing.name.toLowerCase().includes('corn'));
      if (corn) setSimulatorTargetId(corn.id);
    }
  }, [ingredients, simulatorSourceId, simulatorTargetId]);

  useEffect(() => {
    localStorage.setItem('ross308_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  const availablePhases = allCustomPhases[selectedPhaseCount as 3|4|5] || allCustomPhases[3];
  
  const isSummerStrategyActive = useMemo(() => {
    return heatIndex >= 30 || fiDropPercent >= 8 || currentHeatFactor <= 0.92;
  }, [heatIndex, fiDropPercent, currentHeatFactor]);

  const baseRequirement = useMemo(() => {
    return availablePhases[currentPhaseIndex]?.nutrition || availablePhases[0].nutrition;
  }, [availablePhases, currentPhaseIndex]);

  useEffect(() => {
    // When current phase changes, update oil ME based on age
    const phaseDays = availablePhases[currentPhaseIndex]?.days || "";
    const startDayMatch = phaseDays.match(/^(\d+)/);
    const startDay = startDayMatch ? parseInt(startDayMatch[1]) : 0;

    setIngredients(prev => prev.map(ing => {
      if (ing.name.includes("زيت")) {
        const isSunflower = ing.name.includes("دوار");
        const baseME = isSunflower ? 9000 : 8800;
        let bonus = 0;
        
        // 1-14 days: base
        // 15-28 days: +100
        // >28 days: +200
        if (startDay >= 15 && startDay <= 28) bonus = 100;
        else if (startDay > 28) bonus = 200;
        
        return {
          ...ing,
          nutrition: {
            ...ing.nutrition,
            ME: baseME + bonus
          }
        };
      }
      return ing;
    }));
  }, [currentPhaseIndex, availablePhases]);

  const currentRequirement = useMemo(() => {
    if (!isSummerStrategyActive) return baseRequirement;

    const adjusted = { ...baseRequirement };
    
    // Energy (EM) Adjustment based on FI Drop
    let emOffset = 0;
    if (fiDropPercent > 18) emOffset = 80;
    else if (fiDropPercent >= 12) emOffset = 60;
    else if (fiDropPercent >= 8) emOffset = 40;
    
    adjusted.ME = (parseFloat(baseRequirement.ME) + emOffset).toString();
    
    // Amino Acid Strategy - Using engine values directly as they include heat and corn adjustments
    adjusted.dLys = (parseFloat(baseRequirement.dLys) || 0).toFixed(3);
    adjusted.dThr = (parseFloat(baseRequirement.dThr) || 0).toFixed(3);
    
    // User requested Met to stay at 0.55 for 5-phase OR follow table for 3-phase
    adjusted.dMet = (parseFloat(baseRequirement.dMet) || 0.550).toFixed(3);
    
    // Explicitly handle dMetCys from engine with robust fallback
    const rawVal = baseRequirement.dMetCys;
    let dMetCysVal = parseFloat(rawVal);
    
    // If missing or truly 0 (which is unlikely for a requirement), try to pull from default constants as a safety net
    if (isNaN(dMetCysVal) || dMetCysVal === 0) {
      const fallbackSet = selectedPhaseCount === 3 ? ROSS_308_PHASES_3 : 
                          selectedPhaseCount === 4 ? ROSS_308_PHASES_4 : 
                          ROSS_308_PHASES_5;
      const fallbackMetCys = fallbackSet[currentPhaseIndex]?.nutrition.dMetCys || 0.900;
      dMetCysVal = parseFloat(fallbackMetCys);
    }
    
    adjusted.dMetCys = dMetCysVal.toFixed(3);

    adjusted.dCys = (parseFloat(baseRequirement.dCys) || 0).toFixed(3);
    adjusted.dVal = (parseFloat(baseRequirement.dVal) || 0).toFixed(3);
    adjusted.dIso = (parseFloat(baseRequirement.dIso) || 0).toFixed(3);
    adjusted.dArg = (parseFloat(baseRequirement.dArg) || 0).toFixed(3);
    adjusted.dTry = (parseFloat(baseRequirement.dTry) || 0).toFixed(3);
    adjusted.dLeu = (parseFloat(baseRequirement.dLeu) || 0).toFixed(3);
    adjusted.dGlySer = (parseFloat(baseRequirement.dGlySer) || 0).toFixed(3);
    
    // Minerals & Electrolytes Strategy - Use engine values directly
    adjusted.Ca = (parseFloat(baseRequirement.Ca) || 0).toFixed(3);
    adjusted.avP = (parseFloat(baseRequirement.avP) || 0).toFixed(3);
    adjusted.Na = (parseFloat(baseRequirement.Na) || 0).toFixed(3);
    adjusted.Cl = (parseFloat(baseRequirement.Cl) || 0).toFixed(3);
    
    return adjusted;
  }, [baseRequirement, isSummerStrategyActive, fiDropPercent, syrianModelSettings.cornType]);

  const activeIngredients = useMemo(() => {
    return mixture.map(m => ingredients.find(ing => ing.id === m.ingredientId)).filter(Boolean) as Ingredient[];
  }, [mixture, ingredients]);

  // Global calculations
  const totalPercentage = useMemo(() => {
    return mixture.reduce((sum, entry) => sum + (parseFloat(entry.percentage) || 0), 0);
  }, [mixture]);

  const actualNutrition = useMemo(() => {
    const result = { ...INITIAL_NUTRITION };
    mixture.forEach(entry => {
      const ing = ingredients.find(i => i.id === entry.ingredientId);
      const percentage = parseFloat(entry.percentage) || 0;
      if (ing && percentage > 0) {
        const ratio = percentage / 100;
        
        // Comprehensive nutrition object for this ingredient
        const ingNut = { ...ing.nutrition };
        
        // CRITICAL: Calculate/Ensure dMet and dMetCys for this specific ingredient entry
        const m = parseFloat(ingNut.dMet) || 0;
        const c = parseFloat(ingNut.dCys) || 0;
        const mc = parseFloat(ingNut.dMetCys) || 0;
        
        // Use the higher value to avoid data gaps
        const effectiveMC = Math.max(mc, (m + c));
        const effectiveM = m > 0 ? m : (mc > 0 ? mc * 0.55 : 0);

        Object.keys(result).forEach(key => {
          const k = key as keyof Nutrition;
          if (k === 'dMetCys') {
              (result[k] as number) += effectiveMC * ratio;
          } else if (k === 'dMet') {
              (result[k] as number) += effectiveM * ratio;
          } else {
              (result[k] as number) += (parseFloat(ingNut[k]) || 0) * ratio;
          }
        });
      }
    });

    // Final safety cross-check: dMetCys must be >= dMet
    if (result.dMetCys < result.dMet) {
      result.dMetCys = result.dMet;
    }
    
    return result;
  }, [mixture, ingredients]);

  const costPerKg = useMemo(() => {
    return mixture.reduce((sum, entry) => {
      const ing = ingredients.find(i => i.id === entry.ingredientId);
      const percentage = parseFloat(entry.percentage) || 0;
      const price = parseFloat(ing?.price) || 0;
      if (ing) return sum + (price * percentage / 100);
      return sum;
    }, 0);
  }, [mixture, ingredients]);

  const simulationResult = useMemo(() => {
    const source = ingredients.find(ing => ing.id === simulatorSourceId);
    const target = ingredients.find(ing => ing.id === simulatorTargetId);
    
    if (!source || !target) return null;

    // The logic remains relative to the swap, but we interpret it based on its impact on the 1000kg formula.
    const delta: any = {};
    const keys = Object.keys(source.nutrition);
    
    keys.forEach(key => {
      delta[key] = (target.nutrition[key as keyof Nutrition] - source.nutrition[key as keyof Nutrition]) * (simulatorAmount / 100);
    });

    const oil = ingredients.find(ing => ing.name.includes('زيت') || ing.name.toLowerCase().includes('oil'));
    const meth = ingredients.find(ing => ing.name.includes('ميثيونين') || ing.name.toLowerCase().includes('methionine'));
    const lys = ingredients.find(ing => ing.name.includes('ليسين') || ing.name.includes('لايسين') || ing.name.toLowerCase().includes('lysine'));
    const thr = ingredients.find(ing => ing.name.includes('ثريونين') || ing.name.toLowerCase().includes('threonine'));
    const valIn = ingredients.find(ing => ing.name.includes('فالين') || ing.name.toLowerCase().includes('valine'));
    const ile = ingredients.find(ing => ing.name.includes('ايزوليوسين') || ing.name.includes('إيزوليوسين') || ing.name.toLowerCase().includes('isoleucine'));
    const arg = ingredients.find(ing => ing.name.includes('ارجنين') || ing.name.includes('أرجنين') || ing.name.toLowerCase().includes('arginine'));
    const limestone = ingredients.find(ing => ing.name.includes('حجر') || ing.name.toLowerCase().includes('limestone') || ing.name.includes('كلس'));
    const dcp = ingredients.find(ing => ing.name.includes('دي كالسيم') || ing.name.toLowerCase().includes('dcp') || ing.name.includes('فوسفات'));
    const choline = ingredients.find(ing => ing.name.includes('كولين') || ing.name.toLowerCase().includes('choline'));

    const corrections: {name: string, amount: number, unit: string, price: number, type: 'add' | 'reduce'}[] = [];
    
    /**
     * Logic Update:
     * Instead of just correcting the delta, we check if the delta makes the current mixture's nutrition 
     * cross the requirements threshold.
     * 
     * However, the user's specific request "mimic the mixture built" means:
     * If the user has a balanced mix, any change should be compensated to return to THAT balance.
     */
    
    // Energy (Oil)
    if (oil && oil.nutrition.ME > 0) {
        if (delta.ME < 0) {
            const needed = (Math.abs(delta.ME) * 1000) / oil.nutrition.ME;
            corrections.push({ name: oil.name, amount: needed, unit: 'كغ/طن', price: parseFloat(oil.price) || 0, type: 'add' });
        } else if (delta.ME > 0) {
            const extra = (delta.ME * 1000) / oil.nutrition.ME;
            corrections.push({ name: oil.name, amount: extra, unit: 'كغ/طن', price: parseFloat(oil.price) || 0, type: 'reduce' });
        }
    }

    // Amino Acids
    const aminoMap = [
        { key: 'dLys', ing: lys },
        { key: 'dMet', ing: meth },
        { key: 'dThr', ing: thr },
        { key: 'dVal', ing: valIn },
        { key: 'dIso', ing: ile },
        { key: 'dArg', ing: arg }
    ];

    aminoMap.forEach(amino => {
        if (delta[amino.key] < 0 && amino.ing && amino.ing.nutrition[amino.key as keyof Nutrition] > 0) {
            const neededPure = (Math.abs(delta[amino.key]) / 100) * 1000;
            const neededSupp = neededPure / (parseFloat(amino.ing.nutrition[amino.key as keyof Nutrition] as string) / 100);
            corrections.push({ name: amino.ing.name, amount: neededSupp, unit: 'كغ/طن', price: parseFloat(amino.ing.price) || 0, type: 'add' });
        }
    });

    // Choline
    if (delta.choline < 0 && choline && choline.nutrition.choline > 0) {
        const neededTotalMg = Math.abs(delta.choline) * 1000;
        const neededSupp = neededTotalMg / choline.nutrition.choline;
        corrections.push({ name: choline.name, amount: neededSupp, unit: 'كغ/طن', price: parseFloat(choline.price) || 0, type: 'add' });
    }
    
    // Minerals
    if (delta.Ca < 0 && limestone && limestone.nutrition.Ca > 0) {
        const neededPure = (Math.abs(delta.Ca) / 100) * 1000;
        const neededSupp = neededPure / (limestone.nutrition.Ca / 100);
        corrections.push({ name: limestone.name, amount: neededSupp, unit: 'كغ/طن', price: parseFloat(limestone.price) || 0, type: 'add' });
    }

    if (delta.avP < 0 && dcp && dcp.nutrition.avP > 0) {
        const neededPure = (Math.abs(delta.avP) / 100) * 1000;
        const neededSupp = neededPure / (dcp.nutrition.avP / 100);
        corrections.push({ name: dcp.name, amount: neededSupp, unit: 'كغ/طن', price: parseFloat(dcp.price) || 0, type: 'add' });
    }

    // Cost Calculation per 1 Ton (1000 kg)
    const sourcePrice = parseFloat(source.price) || 0;
    const targetPrice = parseFloat(target.price) || 0;
    const amountInKg = (simulatorAmount / 100) * 1000;

    const sourceCostSaving = amountInKg * sourcePrice;
    const targetCostSpent = amountInKg * targetPrice;
    
    const correctionsCostNet = corrections.reduce((sum, c) => {
        const cost = c.amount * c.price;
        return c.type === 'add' ? sum + cost : sum - cost;
    }, 0);

    const netCostImpact = (targetCostSpent + correctionsCostNet) - sourceCostSaving;

    return { 
        delta, 
        corrections, 
        source, 
        target, 
        netCostImpact,
        isMixtureSufficient: actualNutrition.ME >= currentRequirement.ME // Example check
    };
  }, [ingredients, simulatorSourceId, simulatorTargetId, simulatorAmount, actualNutrition, currentRequirement]);

  const handlePercentageChange = (id: string, value: string) => {
    setMixture(prev => prev.map(item => 
      item.ingredientId === id ? { ...item, percentage: value } : item
    ));
  };

  const handlePriceChange = (id: string, value: string) => {
    setIngredients(prev => prev.map(item => 
      item.id === id ? { ...item, price: value } : item
    ));
  };

  const updateIngredientNutrition = (id: string, field: keyof Nutrition, value: string) => {
    setIngredients(prev => prev.map(item => {
      if (item.id === id) {
        const newNutrition = { ...item.nutrition, [field]: value };
        // Auto-sync for synthetic methionine
        if (item.name.includes("ميثيونين") || item.name.includes("Methionine")) {
          if (field === 'dMet') newNutrition.dMet = value;
          if (field === 'dMetCys') newNutrition.dMetCys = value;
        }
        return { ...item, nutrition: newNutrition };
      }
      return item;
    }));
  };

  const updateRequirementValue = (key: keyof Nutrition, value: string) => {
    setAllCustomPhases(prev => {
      const currentSet = [...prev[selectedPhaseCount as 3|4|5]];
      currentSet[currentPhaseIndex] = {
        ...currentSet[currentPhaseIndex],
        nutrition: {
          ...currentSet[currentPhaseIndex].nutrition,
          [key]: value
        }
      };
      return {
        ...prev,
        [selectedPhaseCount]: currentSet
      };
    });
  };

  const resetRequirementsToDefault = () => {
    if (!window.confirm("هل أنت متأكد من العودة إلى القيم الافتراضية لدليل Ross 308؟ سيتم مسح أي تعديلات قمت بها على الاحتياجات.")) return;
    
    setAllCustomPhases({
      3: JSON.parse(JSON.stringify(ROSS_308_PHASES_3)),
      4: JSON.parse(JSON.stringify(ROSS_308_PHASES_4)),
      5: JSON.parse(JSON.stringify(ROSS_308_PHASES_5))
    });
  };

  const applySyrianModel = () => {
    if (!window.confirm("سيقوم النظام الآن بتوليد احتياجات غذائية مخصصة بناءً على 'النموذج السوري v1.0' والظروف البيئية الحالية. هل تود الاستمرار؟")) return;

    const settings: ModelSettings = {
      sex: 'male',
      performanceFactor: syrianModelSettings.performanceFactor,
      temperature: temperature,
      humidity: humidity,
      heatCorrection: syrianModelSettings.heatCorrection,
      cornType: syrianModelSettings.cornType,
      soyType: syrianModelSettings.soyType
    };

    const updatePhaseSet = (phases: PhaseRequirement[]) => {
      return phases.map((p, idx) => {
        const output = SyrianBroilerEngine.calculatePhase(idx + 1, { 
          ...settings, 
          totalPhases: phases.length 
        });
        return {
          ...p,
          nutrition: output.nutrition
        };
      });
    };

    setAllCustomPhases({
      3: updatePhaseSet(JSON.parse(JSON.stringify(ROSS_308_PHASES_3))),
      4: updatePhaseSet(JSON.parse(JSON.stringify(ROSS_308_PHASES_4))),
      5: updatePhaseSet(JSON.parse(JSON.stringify(ROSS_308_PHASES_5)))
    });
  };

  const resetMixture = () => {
    if (!window.confirm("هل أنت متأكد من تصفير الخلطة بالكامل؟ سيتم مسح جميع المكونات والنسب المدخلة من الجدول.")) return;
    setMixture([]);
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

  const resetAllIngredientsToDefault = () => {
    if (!window.confirm("هل تريد إعادة ضبط جميع المكونات إلى القيم الافتراضية؟ سيتم مسح أي تعديلات قمت بها على أسعار أو نسب المكونات.")) return;
    setIngredients(DEFAULT_INGREDIENTS);
  };

  const zeroEnzymeMatrix = () => {
    if (!window.confirm("هل تريد تصفير قيم المصفوفة الغذائية (Matrix) لجميع الإنزيمات؟")) return;
    setIngredients(prev => prev.map(ing => {
      if (ing.name.includes('أنزيم') || ing.name.toLowerCase().includes('enzyme') || ing.name.includes('Natuzyme')) {
        return { ...ing, nutrition: { ...INITIAL_NUTRITION } };
      }
      return ing;
    }));
  };

  const saveSnapshot = () => {
    const name = window.prompt("ادخل اسماً لهذه الخلطة:", `خلطة ${new Date().toLocaleTimeString('ar-EG')}`);
    if (!name) return;

    const newSnapshot: Snapshot = {
      id: `snap-${Date.now()}`,
      name,
      mixture: [...mixture],
      actualNutrition: { ...actualNutrition },
      totalCost: costPerKg * 1000,
      timestamp: new Date().toISOString()
    };

    setSnapshots(prev => [newSnapshot, ...prev]);
  };

  const deleteSnapshot = (id: string) => {
    if (!window.confirm("حذف هذه الخلطة المحفوظة؟")) return;
    setSnapshots(prev => prev.filter(s => s.id !== id));
    setCompareIds(prev => prev.filter(cid => cid !== id));
  };

  const loadSnapshot = (snapshot: Snapshot) => {
    if (!window.confirm(`هل تريد اعتماد الخلطة "${snapshot.name}" كخلطة حالية؟ سيتم استبدال الجدول الحالي.`)) return;
    setMixture(snapshot.mixture);
    setActiveTab('mixture');
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const getEvaluation = (actual: number, required: any) => {
    const req = parseFloat(required) || 0;
    if (req === 0) return { label: '-', color: 'text-gray-400' };
    const diffPercent = ((actual - req) / req) * 100;
    if (Math.abs(diffPercent) <= 2) return { label: 'ممتاز', color: 'text-green-500' };
    if (Math.abs(diffPercent) <= 5) return { label: 'ضمن الحدود', color: 'text-blue-500' };
    return { label: 'يحتاج تعديل', color: 'text-red-500' };
  };

  const getRecommendations = () => {
    const recs: string[] = [];
    const keys: (keyof Nutrition)[] = ['ME', 'CP', 'Ca', 'avP', 'K', 'Na', 'Cl', 'dLys', 'dMet', 'dThr', 'dArg', 'dVal', 'dIso', 'dTry', 'dGlySer', 'dPhe', 'dPheTyr'];
    
    keys.forEach(k => {
      const act = actualNutrition[k] || 0;
      const req = parseFloat(currentRequirement[k]) || 0;
      if (req > 0) {
        const diffPercent = ((act - req) / req) * 100;
        const displayLabelMap: Record<string, string> = {
          'avP': 'av.P',
          'dMet': 'Met',
          'K': 'Potassium (K)',
          'dLys': 'Lys',
          'dThr': 'Thr',
          'dArg': 'Arg',
          'dVal': 'Val',
          'dIso': 'Iso',
          'dTry': 'Try',
          'dGlySer': 'Gly+Ser',
          'dPhe': 'Phe',
          'dPheTyr': 'Phe+Tyr'
        };
        const displayLabel = displayLabelMap[k] || k;
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
    { key: 'DM', label: 'Dry Matter (%)' },
    { key: 'ME', label: 'ME (Energy)' },
    { key: 'CP', label: 'CP (Protein)' },
    { key: 'Ca', label: 'Ca' },
    { key: 'avP', label: 'av.P' },
    { key: 'Na', label: 'Na' },
    { key: 'Cl', label: 'Cl' },
    { key: 'dLys', label: 'Lys' },
    { key: 'dMet', label: 'Met' },
    { key: 'dMetCys', label: 'Met+Cys' },
    { key: 'dThr', label: 'Thr' },
    { key: 'K', label: 'Potassium (K %)' },
    { key: 'dVal', label: 'Val' },
    { key: 'dIso', label: 'Iso' },
    { key: 'dArg', label: 'Arg' },
    { key: 'dGlySer', label: 'Gly+Ser' },
    { key: 'dPhe', label: 'Phe' },
    { key: 'dPheTyr', label: 'Phe+Tyr' },
    { key: 'dTry', label: 'Try' },
    { key: 'dLeu', label: 'Leu' },
    { key: 'dHis', label: 'His' },
    { key: 'dAla', label: 'Ala' },
    { key: 'dCys', label: 'Cys' },
    { key: 'dTyr', label: 'Tyr' },
    { key: 'dGly', label: 'Gly' },
    { key: 'dSer', label: 'Ser' },
    { key: 'EE', label: 'EE (Fat)' },
    { key: 'Fiber', label: 'Fiber' },
    { key: 'Starch', label: 'Starch' },
    { key: 'ADF', label: 'ADF' },
    { key: 'NDF', label: 'NDF' },
    { key: 'TotalP', label: 'Total P' },
    { key: 'NetEnergy', label: 'Net Energy' },
    { key: 'Linoleic', label: 'Linoleic Acid' },
    { key: 'Linolenic', label: 'Linolenic Acid' },
    { key: 'PhytateP', label: 'Phytate P' },
    { key: 'choline', label: 'Choline (mg/kg)' },
  ];

  const handleMoistureAdjustment = (id: string, targetDM: number) => {
    if (isNaN(targetDM) || targetDM <= 0 || targetDM > 100) {
      alert("يرجى إدخال نسبة مادة جافة صحيحة بين 0 و 100");
      return;
    }

    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const currentDM = parseFloat(ing.nutrition.DM) || 88;
        if (currentDM <= 0) return ing;
        
        const factor = targetDM / currentDM;
        const newNutrition = { ...ing.nutrition };
        
        // Exclude DM from scaling as we'll set it specifically
        Object.keys(newNutrition).forEach(key => {
          if (key === 'DM') return;
          const val = parseFloat(newNutrition[key]);
          if (!isNaN(val)) {
            newNutrition[key] = (val * factor).toFixed(4); // Keep precision
          }
        });
        
        newNutrition.DM = targetDM.toString();
        return { ...ing, nutrition: newNutrition };
      }
      return ing;
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans rtl" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://scontent-sjc3-1.xx.fbcdn.net/v/t39.30808-6/491529283_1072530858016732_1086890789763123853_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=lrMsrX8QA2MQ7kNvwGEOLh4&_nc_oc=AdrlzDeG9B4A-IlkrOdp9XUqxHK4fG-jpZLvrLerrMBCxrFw5ZmKlSydPXjGXXi1NZw&_nc_zt=23&_nc_ht=scontent-sjc3-1.xx&_nc_gid=EMLGCueKnEtU5G8GXgU4qg&_nc_ss=7a3a8&oh=00_Af1u8As3peG3hpx8NQufqfEIdCTZELry-WO6e-1ztcXgoA&oe=69ED1D2E" 
              alt="Logo" 
              className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">شركة الأسعد إخوان للدواجن</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Scientific Poultry Nutrition v2.0</p>
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                  <MapPin className="w-2.5 h-2.5" />
                  حمص، تلكلخ
                </div>
              </div>
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
            <button 
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'compare' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              مقارنة الخلطات
            </button>
            <button 
              onClick={() => setActiveTab('additives')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'additives' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Lightbulb className="w-4 h-4" />
              أفضل المضافات
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'performance' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Activity className="w-4 h-4" />
              الأداء والنمو
            </button>
            <button 
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'simulator' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <RefreshCcw className="w-4 h-4" />
              محاكي الاستبدال
            </button>
            <button 
              onClick={() => setActiveTab('regression')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'regression' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Database className="w-4 h-4" />
              تحليل الحقول
            </button>
            <button 
              onClick={() => setActiveTab('phytase')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'phytase' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FlaskConical className="w-4 h-4" />
              ماتريكس الفيتاز
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
              title="طباعة التقرير"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>طباعة</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
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
                       <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                         <span className="text-[10px] font-bold text-gray-400">سعة الخلاط:</span>
                         <input 
                            type="number"
                            value={batchSize}
                            onChange={(e) => setBatchSize(parseFloat(e.target.value) || 1)}
                            className="w-16 text-center font-bold text-blue-600 outline-none"
                         />
                         <span className="text-[10px] font-bold text-gray-400">طن</span>
                       </div>
                       <button 
                        onClick={saveSnapshot}
                        disabled={mixture.length === 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        title="حفظ للـمقارنة"
                       >
                         <Save className="w-3 h-3" />
                         حفظ الخلطة
                       </button>
                       <button 
                        onClick={addNewIngredient}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                       >
                         <Plus className="w-3 h-3" />
                         مكون جديد
                       </button>
                       <button 
                        onClick={resetMixture}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
                        title="تصفير الخلطة"
                       >
                         <Trash2 className="w-3 h-3" />
                         تصفير
                       </button>
                       <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${totalPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                         المجموع: {totalPercentage.toFixed(2)}%
                       </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-center border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-right sticky right-0 bg-gray-50 z-10">المكون</th>
                          <th className="px-4 py-4 w-32 font-bold text-gray-900 border-x border-gray-100">نسبة الإدخال (%)</th>
                          <th className="px-4 py-4 w-32 font-bold text-blue-700 bg-blue-50/30 border-x border-gray-100">الكمية (كغ/طن)</th>
                          <th className="px-4 py-4 w-32 font-bold text-indigo-700 bg-indigo-50/30 border-x border-gray-100">وزن الخلطة ({batchSize} طن)</th>
                          <th className="px-4 py-4 w-32 font-bold text-green-700">السعر ($/كغ)</th>
                          <th className="px-4 py-4 w-32 font-bold text-gray-900">تكلفة المكون</th>
                          <th className="px-4 py-4 w-20"></th>
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
                              <tr key={ing.id} className="hover:bg-gray-50 transition-colors group border-b border-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-800 sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                                  <input 
                                    type="text"
                                    value={ing.name}
                                    onChange={(e) => setIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, name: e.target.value } : i))}
                                    className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                  />
                                </td>
                                <td className="px-4 py-4 text-center border-x border-gray-50">
                                  <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={mixItem?.percentage ?? ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        handlePercentageChange(ing.id, val);
                                      }
                                    }}
                                    className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold text-gray-900 focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                                  />
                                </td>
                                <td className="px-4 py-4 text-center font-mono font-bold text-blue-700 bg-blue-50/20 border-x border-gray-50">
                                  {((parseFloat(mixItem?.percentage || '0') || 0) * 10).toFixed(2)} كغ
                                </td>
                                <td className="px-4 py-4 text-center font-mono font-bold text-indigo-700 bg-indigo-50/20 border-x border-gray-50">
                                  {((parseFloat(mixItem?.percentage || '0') || 0) * 10 * batchSize).toFixed(2)} كغ
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={ing.price ?? ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        handlePriceChange(ing.id, val);
                                      }
                                    }}
                                    className="w-24 bg-green-50/30 border border-green-100 rounded-lg px-2 py-1.5 text-center font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                                  />
                                </td>
                                <td className="px-4 py-4 text-center font-bold text-gray-600 bg-gray-50/30">
                                  ${((ing.price * (mixItem?.percentage || 0)) / 100).toFixed(4)}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <button 
                                    onClick={() => removeIngredientFromMixture(ing.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
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

          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8 pb-20"
            >
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <ArrowRightLeft className="w-7 h-7 text-blue-600" />
                      مقارنة الخلطات المحفوظة
                    </h2>
                    <p className="text-gray-500 mt-1">اختر خلطتين من القائمة للمقارنة بين التكلفة والتحليل الغذائي.</p>
                  </div>
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                    {snapshots.length} خلطات محفوظة
                  </div>
                </div>

                {snapshots.length === 0 ? (
                  <div className="py-20 text-center space-y-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <History className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="text-gray-400 font-medium">لا توجد خلطات محفوظة للمقارنة بعد.</p>
                    <button 
                      onClick={() => setActiveTab('mixture')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      اذهب للخلطة الحالية وقم بحفظ لقطة (Snapshot)
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {snapshots.map(snap => (
                      <div 
                        key={snap.id}
                        onClick={() => toggleCompare(snap.id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative group ${compareIds.includes(snap.id) ? 'border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-50' : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'}`}
                      >
                        {compareIds.includes(snap.id) && (
                          <div className="absolute top-4 left-4 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                            {compareIds.indexOf(snap.id) + 1}
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-gray-900 truncate pl-8">{snap.name}</h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteSnapshot(snap.id); }}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                          <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                            <p className="opacity-60 mb-1 tracking-wider uppercase">التكلفة</p>
                            <p className="text-sm font-mono">${(snap.totalCost).toFixed(2)}</p>
                          </div>
                          <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                            <p className="opacity-60 mb-1 tracking-wider uppercase">التاريخ</p>
                            <p className="text-[9px]">{new Date(snap.timestamp).toLocaleDateString('ar-EG')}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); loadSnapshot(snap); }}
                          className="w-full mt-4 py-2 border border-blue-200 rounded-xl text-blue-600 text-[10px] font-bold hover:bg-white transition-all transform group-hover:translate-y-0 translate-y-2 opacity-0 group-hover:opacity-100"
                        >
                          اعتماد كخلطة حالية
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {compareIds.length === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 overflow-hidden border border-gray-200 rounded-3xl bg-white shadow-xl"
                  >
                    <div className="p-6 bg-gray-900 text-white flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-blue-400" />
                        التحليل المقارن
                      </h3>
                      <button 
                        onClick={() => setCompareIds([])}
                        className="text-xs opacity-60 hover:opacity-100 underline"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-8 py-5 text-right font-bold text-gray-500">العنصر</th>
                            {[0, 1].map(idx => {
                              const snap = snapshots.find(s => s.id === compareIds[idx]);
                              return snap && (
                                <th key={idx} className={`px-8 py-5 text-center bg-gray-50/50 ${idx === 0 ? 'border-r border-gray-100' : ''}`}>
                                  <div className="text-[10px] uppercase text-gray-400 mb-1">الخلطة {idx + 1}</div>
                                  <div className="text-blue-900 font-bold">{snap.name}</div>
                                </th>
                              );
                            })}
                            <th className="px-8 py-5 text-center bg-blue-50/50 font-bold text-blue-900">الفرق</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 uppercase font-mono tracking-tight">
                          <tr className="bg-blue-50/20">
                            <td className="px-8 py-4 font-bold text-blue-900">سعر الطن ($)</td>
                            {[0, 1].map(idx => {
                              const snap = snapshots.find(s => s.id === compareIds[idx]);
                              return snap && (
                                <td key={idx} className={`px-8 py-4 text-center font-bold text-lg ${idx === 0 ? 'border-r border-gray-100' : ''}`}>
                                  ${snap.totalCost.toFixed(2)}
                                </td>
                              );
                            })}
                            <td className={`px-8 py-4 text-center font-black text-xl ${(snapshots.find(s => s.id === compareIds[0])?.totalCost || 0) < (snapshots.find(s => s.id === compareIds[1])?.totalCost || 0) ? 'text-green-600' : 'text-red-500'}`}>
                              ${Math.abs((snapshots.find(s => s.id === compareIds[0])?.totalCost || 0) - (snapshots.find(s => s.id === compareIds[1])?.totalCost || 0)).toFixed(2)}
                            </td>
                          </tr>
                          {[
                            { k: 'ME', l: 'الطاقة (kcal)' },
                            { k: 'CP', l: 'بروتين (%)' },
                            { k: 'Ca', l: 'كالسيوم (%)' },
                            { k: 'avP', l: 'فوسفور (%)' },
                            { k: 'dLys', l: 'لايسين (%)' },
                            { k: 'dMetCys', l: 'ميثيونين + سيستين (%)' }
                          ].map(({ k, l }) => {
                            const val1 = snapshots.find(s => s.id === compareIds[0])?.actualNutrition[k as keyof Nutrition] || 0;
                            const val2 = snapshots.find(s => s.id === compareIds[1])?.actualNutrition[k as keyof Nutrition] || 0;
                            const diff = val1 - val2;
                            return (
                              <tr key={k} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-4 text-gray-500 font-bold">{l}</td>
                                <td className="px-8 py-4 text-center border-r border-gray-100">{val1.toFixed(k === 'ME' ? 0 : 3)}</td>
                                <td className="px-8 py-4 text-center">{val2.toFixed(k === 'ME' ? 0 : 3)}</td>
                                <td className={`px-8 py-4 text-center font-bold ${diff === 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(3)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'additives' && (
            <motion.div
              key="additives"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-24"
            >
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-12">
                <div className="mb-16 text-center max-w-3xl mx-auto">
                  <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Lightbulb className="w-10 h-10" />
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 mb-4">دليل المضافات العلفية العالمية</h2>
                  <p className="text-gray-500 text-lg">استعرض أفضل المنتجات العالمية المصنفة حسب الغرض الفيزيولوجي، لدعم كفاءة التحويل وصحة القطيع.</p>
                </div>

                <div className="space-y-20">
                  {(Object.entries(groupedAdditives) as [string, typeof TOP_ADDITIVES][]).map(([category, items]) => (
                    <div key={category} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                        <h3 className="text-2xl font-black text-blue-900 bg-blue-50 px-6 py-2 rounded-full border border-blue-100">
                          {category}
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {items.map((add, idx) => (
                          <motion.div 
                            key={idx}
                            layout
                            onClick={() => setExpandedAdditive(expandedAdditive === (add.product || add.name) ? null : (add.product || add.name))}
                            whileHover={{ y: -5, boxShadow: '0 20px 40px -20px rgba(0,0,0,0.1)' }}
                            className={`bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-8 hover:bg-white transition-all duration-300 flex flex-col group cursor-pointer relative overflow-hidden ${expandedAdditive === (add.product || add.name) ? 'ring-2 ring-blue-500 bg-white ring-offset-4' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-6">
                              <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100">
                                {add.brand}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-white border border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm opacity-50">
                                  {idx + 1}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-6">
                              <h4 className="text-2xl font-black text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                {add.product || add.name}
                              </h4>
                              {add.product && <p className="text-sm text-gray-400 font-bold">{add.name}</p>}
                            </div>

                            <p className={`text-gray-600 leading-relaxed font-medium transition-all ${expandedAdditive === (add.product || add.name) ? 'mb-8' : 'line-clamp-2 mb-4'}`}>
                              {add.importance}
                            </p>

                            <AnimatePresence>
                              {expandedAdditive === (add.product || add.name) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  {add.recommendation && (
                                    <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-bold flex items-center gap-3">
                                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                                      {add.recommendation}
                                    </div>
                                  )}

                                  <div className="space-y-4 pt-4 border-t border-gray-100">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-3">تفاصيل وفوائد إضافية:</p>
                                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                       {add.benefits.map((benefit, i) => (
                                         <li key={i} className="flex items-start gap-2 text-xs text-gray-600 font-medium">
                                           <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0 mt-1.5" />
                                           <span>{benefit}</span>
                                         </li>
                                       ))}
                                     </ul>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {!expandedAdditive && (
                              <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-blue-500 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                عرض التفاصيل <ChevronRight className="w-3 h-3" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Companies Section */}
                <div className="mt-32 pt-20 border-t border-gray-100">
                  <div className="text-center mb-12">
                    <h3 className="text-2xl font-black text-gray-900 mb-2">أقوى شركات إضافات الأعلاف عالمياً</h3>
                    <p className="text-gray-500 font-medium whitespace-pre-line">
                      قائمة الشركات الرائدة والموثوقة في تكنولوجيا تغذية الدواجن وفق التقارير السوقية الحديثة
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {TOP_COMPANIES.map(company => (
                      <div 
                        key={company}
                        className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black text-gray-700 hover:bg-white hover:border-blue-400 hover:text-blue-600 hover:shadow-lg transition-all cursor-default"
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-[10px] text-gray-400 font-bold mt-12 uppercase tracking-widest leading-relaxed">
                    هذه القائمة للمرجعية المهنية وتضم الشركات الأقوى في الإنزيمات، الفيتامينات، والأحماض الأمينية
                  </p>
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
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Settings className="w-4 h-4 text-gray-500" />
                    قائمة المكونات
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={zeroEnzymeMatrix}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black border border-amber-200 hover:bg-amber-100 transition-all uppercase tracking-tighter"
                      title="تصفير مصفوفة الإنزيمات"
                    >
                      <Wind className="w-3 h-3" />
                      تصفير مصفوفة
                    </button>
                    <button 
                      onClick={resetAllIngredientsToDefault}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black border border-blue-200 hover:bg-blue-100 transition-all uppercase tracking-tighter"
                      title="إعادة ضبط الكل للافتراضي"
                    >
                      <RefreshCcw className="w-3 h-3" />
                      إعادة ضبط الكل
                    </button>
                  </div>
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

                  <div className="space-y-6">
                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('كسبة') && ingredients.find(i => i.id === editingIngredientId)?.name.includes('صويا') && (
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          اختر صنف كسبة الصويا (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.keys(SBM_STANDARDS).map(level => (
                            <button
                              key={level}
                              onClick={() => {
                                setIngredients(prev => prev.map(ing => 
                                  ing.id === editingIngredientId 
                                    ? { ...ing, nutrition: { ...SBM_STANDARDS[level] } } 
                                    : ing
                                ));
                              }}
                              className="px-3 py-2 bg-white border border-green-200 rounded-xl text-xs font-bold text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-sm"
                            >
                              SBM {level}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('ذرة') && (
                      <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-yellow-900 flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          اختر صنف الذرة الصفراء (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.keys(CORN_STANDARDS).map(level => (
                            <button
                              key={level}
                              onClick={() => {
                                setIngredients(prev => prev.map(ing => 
                                  ing.id === editingIngredientId 
                                    ? { ...ing, nutrition: { ...CORN_STANDARDS[level] } } 
                                    : ing
                                ));
                              }}
                              className="px-3 py-2 bg-white border border-yellow-200 rounded-xl text-xs font-bold text-yellow-700 hover:bg-yellow-600 hover:text-white hover:border-yellow-600 transition-all shadow-sm"
                            >
                              Corn CP {level}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('كلسي') && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الحجر الكلسي (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "الحجر الكلسي خام (36%)", nutrition: { ...ing.nutrition, ...LIMESTONE_STANDARDS["36"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-all shadow-sm"
                          >
                            خام (36%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "الحجر الكلسي نقي (38.5%)", nutrition: { ...ing.nutrition, ...LIMESTONE_STANDARDS["38.5"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-all shadow-sm"
                          >
                            نقي (38.5%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "الحجر الكلسي أوروبي (40%)", nutrition: { ...ing.nutrition, ...LIMESTONE_STANDARDS["40"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-all shadow-sm"
                          >
                            أوروبي (40%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('زيت') && (
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          اختر صنف الزيت (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "زيت صويا", nutrition: { ...ing.nutrition, ...OIL_STANDARDS["soy"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                          >
                            زيت صويا
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "زيت دوار شمس", nutrition: { ...ing.nutrition, ...OIL_STANDARDS["sunflower"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                          >
                            زيت دوار شمس
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('الميثيونين') && (
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الميثيونين (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "ميثيونين صناعي (أوروبي)", nutrition: { ...ing.nutrition, ...METHIONINE_STANDARDS["european"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          >
                            أوروبي (98%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "ميثيونين صناعي (صيني)", nutrition: { ...ing.nutrition, ...METHIONINE_STANDARDS["chinese"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          >
                            صيني (94%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('الثريونين') && (
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الثريونين (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "ثريونين صناعي (أوروبي)", nutrition: { ...ing.nutrition, ...THREONINE_STANDARDS["european"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                          >
                            أوروبي (98%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "ثريونين صناعي (صيني)", nutrition: { ...ing.nutrition, ...THREONINE_STANDARDS["chinese"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                          >
                            صيني (94%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('الفالين') && (
                      <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-cyan-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الفالين (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "فالين صناعي (أوروبي)", nutrition: { ...ing.nutrition, ...VALINE_STANDARDS["european"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-cyan-200 rounded-xl text-xs font-bold text-cyan-700 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all shadow-sm"
                          >
                            أوروبي (98%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "فالين صناعي (صيني)", nutrition: { ...ing.nutrition, ...VALINE_STANDARDS["chinese"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-cyan-200 rounded-xl text-xs font-bold text-cyan-700 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all shadow-sm"
                          >
                            صيني (94%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('إيزوليوسين') && (
                      <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-teal-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الإيزوليوسين (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "إيزوليوسين صناعي (أوروبي)", nutrition: { ...ing.nutrition, ...ISOLEUCINE_STANDARDS["european"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm"
                          >
                            أوروبي (98%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "إيزوليوسين صناعي (صيني)", nutrition: { ...ing.nutrition, ...ISOLEUCINE_STANDARDS["chinese"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm"
                          >
                            صيني (94%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('أرجنين') && (
                      <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-violet-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الأرجنين (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "أرجنين صناعي (أوروبي)", nutrition: { ...ing.nutrition, ...ARGININE_STANDARDS["european"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-violet-200 rounded-xl text-xs font-bold text-violet-700 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all shadow-sm"
                          >
                            أوروبي (98%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "أرجنين صناعي (صيني)", nutrition: { ...ing.nutrition, ...ARGININE_STANDARDS["chinese"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-violet-200 rounded-xl text-xs font-bold text-violet-700 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all shadow-sm"
                          >
                            صيني (94%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('الكولين') && (
                      <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-sky-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الكولين (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "كلوريد الكولين (60%)", nutrition: { ...ing.nutrition, ...CHOLINE_STANDARDS["60"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all shadow-sm"
                          >
                            تركيز (60%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "كلوريد الكولين (70%)", nutrition: { ...ing.nutrition, ...CHOLINE_STANDARDS["70"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all shadow-sm"
                          >
                            تركيز (70%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('فوسفات') && (
                      <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-orange-900 flex items-center gap-2">
                          <CircleDot className="w-4 h-4" />
                          اختر صنف الفوسفات (تحميل التحليل القياسي):
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "ديكالسيوم فوسفات (محلي)", nutrition: { ...ing.nutrition, ...DCP_STANDARDS["local"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm"
                          >
                            محلي (16%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "ديكالسيوم فوسفات (صيني)", nutrition: { ...ing.nutrition, ...DCP_STANDARDS["chinese"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm"
                          >
                            صيني (16.5%)
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, name: "ديكالسيوم فوسفات (أوروبي)", nutrition: { ...ing.nutrition, ...DCP_STANDARDS["european"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm"
                          >
                            أوروبي (17%)
                          </button>
                        </div>
                      </div>
                    )}

                    {ingredients.find(i => i.id === editingIngredientId)?.name.includes('أنزيم') && (
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-3">
                        <p className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-indigo-600" />
                          تحميل مصفوفة الأنزيم (Enzyme Matrix):
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, nutrition: { ...ing.nutrition, ...ENZYME_STANDARDS["phytase"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            مصفوفة الفيتاز
                          </button>
                          <button
                            onClick={() => {
                              setIngredients(prev => prev.map(ing => 
                                ing.id === editingIngredientId 
                                  ? { ...ing, nutrition: { ...ing.nutrition, ...ENZYME_STANDARDS["multi"] } } 
                                  : ing
                              ));
                            }}
                            className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            الأنزيم المتعدد
                          </button>
                        </div>
                        <p className="text-[10px] text-indigo-500 italic">
                          * هذه القيم تضاف إلى الحسابات النهائية عند إدخال الإنزيم في الخلطة.
                        </p>
                      </div>
                    )}

                    {(ingredients.find(i => i.id === editingIngredientId)?.name.includes('صويا') || 
                      ingredients.find(i => i.id === editingIngredientId)?.name.includes('ذرة')) && (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                            <Droplets className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-900">تعديل المادة الجافة (DM %)</p>
                            <p className="text-[10px] text-amber-700">تعديل كافة العناصر بناءً على الرطوبة الفعلية</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input 
                            type="number"
                            placeholder="DM %"
                            className="w-full sm:w-32 bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                editingIngredientId && handleMoistureAdjustment(editingIngredientId, val);
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              const input = (e.currentTarget.previousSibling as HTMLInputElement);
                              const val = parseFloat(input.value);
                              editingIngredientId && handleMoistureAdjustment(editingIngredientId, val);
                            }}
                            className="bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-700 transition-all flex items-center gap-2 whitespace-nowrap"
                          >
                            تعديل
                          </button>
                        </div>
                      </div>
                    )}

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
                              type="text"
                              inputMode="decimal"
                              value={ingredients.find(i => i.id === editingIngredientId)?.nutrition[key] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  updateIngredientNutrition(editingIngredientId, key, val);
                                }
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-lg transition-all focus:bg-white focus:ring-2 focus:ring-green-500 outline-none pr-12 text-right"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 uppercase">
                              / 1kg
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-20"
            >
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 mb-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-r-4 border-green-600 pr-3">
                   إعدادات النموذج السوري (Syrian Model Control)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">معامل الأداء (Performance Factor)</label>
                      <div className="flex items-center gap-3">
                         <input 
                           type="range" min="0.80" max="1.00" step="0.01" 
                           value={syrianModelSettings.performanceFactor}
                           onChange={(e) => setSyrianModelSettings({...syrianModelSettings, performanceFactor: parseFloat(e.target.value)})}
                           className="flex-1 accent-green-600"
                         />
                         <span className="font-mono font-bold text-green-700">%{Math.round(syrianModelSettings.performanceFactor * 100)}</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">تصحيح الحرارة (Heat Correction)</label>
                      <button 
                        onClick={() => setSyrianModelSettings({...syrianModelSettings, heatCorrection: !syrianModelSettings.heatCorrection})}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${syrianModelSettings.heatCorrection ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                      >
                        {syrianModelSettings.heatCorrection ? 'التصحيح مفعل ON' : 'التصحيح معطل OFF'}
                      </button>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">نوع الذرة</label>
                      <select 
                        value={syrianModelSettings.cornType}
                        onChange={(e) => setSyrianModelSettings({...syrianModelSettings, cornType: e.target.value as any})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      >
                        <option value="Syrian">ذرة سورية (CP 7.2%)</option>
                        <option value="Ukrainian">ذرة أوكرانية (CP 7.8%)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">كسبة الصويا</label>
                      <select 
                        value={syrianModelSettings.soyType}
                        onChange={(e) => setSyrianModelSettings({...syrianModelSettings, soyType: e.target.value as any})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      >
                        <option value="Soy44">صويا 44%</option>
                        <option value="Soy46">صويا 46%</option>
                      </select>
                   </div>
                </div>
              </div>
              {/* Phase Selection (Consolidated here) */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 mb-8">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-blue-900">نظام التغذية والمرحلة</h3>
                    <div className="flex gap-2">
                       <button 
                         onClick={resetRequirementsToDefault}
                         className="px-3 py-1 bg-white/50 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-white transition-all flex items-center gap-1 border border-blue-200"
                       >
                         <Trash2 className="w-3 h-3" />
                         استعادة دليل Ross 308
                       </button>
                       <button 
                         onClick={applySyrianModel}
                         className="px-3 py-1 bg-green-600 text-white rounded-lg text-[10px] font-bold hover:bg-green-700 transition-all flex items-center gap-1 shadow-sm"
                       >
                         <Beaker className="w-3 h-3" />
                         تطبيق النموذج السوري v1.0
                       </button>
                    </div>
                  </div>
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
              </div>

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
                        { k: 'avP', l: 'فوسفور متاح (av.P)', u: '%' },
                        { k: 'K', l: 'بوتاسيوم (K)', u: '%' },
                        { k: 'Na', l: 'صوديوم (Na)', u: '%' },
                        { k: 'Cl', l: 'كلور (Cl)', u: '%' },
                        { k: 'choline', l: 'الكولين (mg/kg)', u: 'mg' },
                      ].map(({ k, l, u }) => {
                        const key = k as keyof Nutrition;
                        const act = actualNutrition[key] || 0;
                        const req = currentRequirement[key];
                        const reqNum = parseFloat(req) || 0;
                        const diff = act - reqNum;
                        const evalRes = getEvaluation(act, req);
                        return (
                          <tr key={k} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4">
                              <span className="font-bold text-gray-800">{l}</span>
                              <span className="text-[10px] text-gray-400 mr-2 uppercase">{u}</span>
                            </td>
                            <td className="px-8 py-4 text-center">
                              <input 
                                type="text"
                                inputMode="decimal"
                                value={req ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    updateRequirementValue(key, val);
                                  }
                                }}
                                className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center font-mono font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                              />
                            </td>
                            <td className="px-8 py-4 text-center font-mono font-bold text-blue-700">{act.toFixed(k === 'ME' || k === 'choline' ? 0 : 2)}</td>
                            <td className={`px-8 py-4 text-center font-mono ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(k === 'ME' || k === 'choline' ? 0 : 2)}
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
                <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <CheckCircle2 className="w-5 h-5" />
                     </div>
                     <h2 className="text-xl font-bold">جدول الأحماض الأمينية المهضومة (%)</h2>
                   </div>
                   <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold border border-indigo-100 italic">
                     * الاحتياجات مسحوبة من مصفوفة FIVITAZ للمرحلة الحالية
                   </span>
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
                        { k: 'dMetCys', l: 'الميثيونين + السيستين (dM+C)' },
                        { k: 'dThr', l: 'ثريونين (dThr)' },
                        { k: 'dVal', l: 'فالين (dVal)' },
                        { k: 'dIso', l: 'إيزوليوسين (dIso)' },
                        { k: 'dArg', l: 'أرجنين (dArg)' },
                        { k: 'dGlySer', l: 'غليسين + سيرين (dG+S)' },
                        { k: 'dPhe', l: 'فينيل ألانين (dPhe)' },
                        { k: 'dPheTyr', l: 'فينيل ألانين + تيروسين' },
                        { k: 'dTry', l: 'تريبتوفان (dTry)' },
                        { k: 'dLeu', l: 'ليوسين (dLeu)' },
                        { k: 'dHis', l: 'هستيدين (dHis)' },
                      ].map(({ k, l }) => {
                        const key = k as keyof Nutrition;
                        const act = actualNutrition[key] || 0;
                        const req = currentRequirement[key];
                        const reqNum = parseFloat(req) || 0;
                        const diff = act - reqNum;
                        const evalRes = getEvaluation(act, req);
                        return (
                          <tr key={k} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4">
                              <span className="font-bold text-gray-800">{l}</span>
                              <span className="text-[10px] text-gray-400 mr-2 uppercase">%</span>
                            </td>
                            <td className="px-8 py-4 text-center">
                              <input 
                                type="text"
                                inputMode="decimal"
                                value={req ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    updateRequirementValue(key, val);
                                  }
                                }}
                                className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-center font-mono font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                              />
                            </td>
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

              {/* Detailed Fiber & Energy Analysis */}
              <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white">
                        <Database className="w-5 h-5" />
                     </div>
                     <h2 className="text-xl font-bold">تحليل الألياف والطاقة المتقدم</h2>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100">
                        <th className="px-8 py-4 text-right">العنصر</th>
                        <th className="px-8 py-4 text-center">المتحقق الحالي</th>
                        <th className="px-8 py-4 text-center">الوحدة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { k: 'NetEnergy', l: 'الطاقة الصافية (Net Energy)', u: 'kcal' },
                        { k: 'EE', l: 'الدهن الخام (EE)', u: '%' },
                        { k: 'Fiber', l: 'الألياف الخام (Crude Fiber)', u: '%' },
                        { k: 'Starch', l: 'النشاء (Starch)', u: '%' },
                        { k: 'NDF', l: 'الألياف المتعادلة (NDF)', u: '%' },
                        { k: 'ADF', l: 'الألياف الحمضية (ADF)', u: '%' },
                        { k: 'TotalP', l: 'الفوسفور الكلي (Total P)', u: '%' },
                        { k: 'PhytateP', l: 'فوسفور الفيتات (Phytate P)', u: '%' },
                        { k: 'Linoleic', l: 'حمض اللينوليك', u: '%' },
                        { k: 'Linolenic', l: 'حمض اللينولينيك', u: '%' },
                      ].map(({ k, l, u }) => {
                        const key = k as keyof Nutrition;
                        const act = actualNutrition[key] || 0;
                        return (
                          <tr key={k} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4">
                              <span className="font-bold text-gray-800">{l}</span>
                            </td>
                            <td className="px-8 py-4 text-center font-mono font-bold text-amber-700">
                              {act.toFixed(k === 'NetEnergy' ? 0 : 3)}
                            </td>
                            <td className="px-8 py-4 text-center text-[10px] text-gray-400 uppercase">
                              {u}
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

          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-20"
            >
              <div className="flex items-center justify-between mb-2">
                 <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                    <button 
                      onClick={() => setPerformanceMode('standard')}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${performanceMode === 'standard' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      مقارنة المعايير القياسية
                    </button>
                    <button 
                      onClick={() => setPerformanceMode('advanced')}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${performanceMode === 'advanced' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      المحرك الحيوي المتقدم (Engine)
                    </button>
                    <button 
                      onClick={() => setActiveTab('summer')}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all text-orange-600 hover:text-orange-700 flex items-center gap-2`}
                    >
                      <Sun className="w-4 h-4" />
                      استراتيجية الصيف السورية
                    </button>
                 </div>
              </div>

              {performanceMode === 'standard' ? (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <Activity className="w-7 h-7 text-green-600" />
                      تعقب الأداء والنمو (Ross 308)
                    </h2>
                    <p className="text-gray-500 mt-1">مقارنة أوزان واستهلاك العلف مع المعايير القياسية لشركة Aviagen.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">عمر الطيور (يوم)</p>
                        <input 
                          type="number"
                          min="0"
                          max="45"
                          value={selectedPerformanceDay}
                          onChange={(e) => setSelectedPerformanceDay(Math.min(45, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-20 bg-transparent border-none text-2xl font-bold text-gray-900 focus:ring-0 outline-none"
                        />
                      </div>
                      <div className="w-px h-10 bg-gray-200"></div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">الوزن المستهدف</p>
                        <p className="text-2xl font-bold text-green-600">{ROSS_308_PERFORMANCE_DATA[selectedPerformanceDay]?.weight} غ</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Temperature & Humidity Controls */}
                <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 mb-12 shadow-sm">
                  <div className="space-y-8">
                    {/* Temperature Slider */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-gray-400" />
                            محاكاة الظروف المناخية (درجة الحرارة)
                          </h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${temperature > 26 ? 'bg-orange-100 text-orange-700' : (temperature < 20 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}`}>
                            {temperature > 26 ? 'تأثير الصيف (انخفاض الاستهلاك)' : (temperature < 20 ? 'تأثير الشتاء (زيادة الاستهلاك)' : 'منطقة الراحة الحرارية')}
                          </span>
                        </div>
                        <div className="relative pt-1">
                          <input 
                            type="range" 
                            min="10" 
                            max="45" 
                            step="1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-1">
                            <span>10°</span>
                            <span>15°</span>
                            <span className="text-green-600 font-black">22° م</span>
                            <span>25°</span>
                            <span>30°</span>
                            <span>35°</span>
                            <span>40°</span>
                            <span>45°</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shrink-0 w-full md:w-auto justify-between">
                         <div className="text-center px-4">
                           <p className="text-[10px] text-gray-400 mb-1">الحرارة</p>
                           <p className="text-2xl font-bold">{temperature}°م</p>
                         </div>
                         <div className="w-px h-10 bg-gray-200"></div>
                         <div className="text-center px-4">
                           <p className="text-[10px] text-gray-400 mb-1">الاستهلاك اليومي</p>
                           <p className="text-xl font-bold text-orange-600">
                             {adjustedPerformanceData[selectedPerformanceDay]?.dailyIntake} غ
                           </p>
                         </div>
                      </div>
                    </div>

                    {/* Humidity Slider */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-t border-gray-100 pt-8">
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            مؤشر الرطوبة النسبية (%)
                          </h3>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${humidity > 70 ? 'bg-red-100 text-red-700' : (humidity < 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')}`}>
                            {humidity > 70 ? 'رطوبة عالية (إجهاد إضافي)' : (humidity < 40 ? 'رطوبة منخفضة (جفاف)' : 'رطوبة مثالية')}
                          </span>
                        </div>
                        <div className="relative pt-1">
                          <input 
                            type="range" 
                            min="10" 
                            max="95" 
                            step="1"
                            value={humidity}
                            onChange={(e) => setHumidity(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-1">
                            <span>10%</span>
                            <span>25%</span>
                            <span>40%</span>
                            <span className="text-green-600 font-black">55%</span>
                            <span>70%</span>
                            <span>85%</span>
                            <span>95%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm shrink-0 w-full md:w-auto justify-between">
                         <div className="text-center px-4">
                           <p className="text-[10px] text-gray-400 mb-1">الرطوبة</p>
                           <p className="text-2xl font-bold">{humidity}%</p>
                         </div>
                         <div className="w-px h-10 bg-gray-200"></div>
                         <div className="text-center px-4">
                           <p className="text-[10px] text-gray-400 mb-1">مؤشر الحرارة (HI)</p>
                           <p className={`text-xl font-bold ${heatIndex > 32 ? 'text-red-600' : 'text-blue-600'}`}>
                             {heatIndex.toFixed(1)}
                           </p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                       <Scale className="w-4 h-4 text-blue-600" />
                       منحنى نمو الوزن الحي (غ)
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={adjustedPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#9CA3AF" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            label={{ value: 'العمر (يوم)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `${value}g`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(label) => `يوم ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            name="الوزن القياسي"
                            stroke="#16A34A" 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={{ r: 6, fill: '#16A34A', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                       <FileText className="w-4 h-4 text-orange-600" />
                       استهلاك العلف المعدل حسب الحرارة (غ/طير)
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={adjustedPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#9CA3AF" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `${value}g`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(label) => `يوم ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="cumIntake" 
                            name="الاستهلاك المعدل"
                            stroke="#EA580C" 
                            strokeWidth={3} 
                            dot={false}
                            activeDot={{ r: 6, fill: '#EA580C', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-widest text-[10px]">
                      <tr>
                        <th className="px-6 py-4">اليوم</th>
                        <th className="px-6 py-4">الوزن (غ)</th>
                        <th className="px-6 py-4">الزيادة اليومية (غ)</th>
                        <th className="px-6 py-4">الاستهلاك اليومي (غ)</th>
                        <th className="px-6 py-4">الاستهلاك التراكمي (غ)</th>
                        <th className="px-6 py-4">معامل التحويل (FCR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-mono">
                      {adjustedPerformanceData.filter((_, i) => i % 7 === 0 || i === selectedPerformanceDay || i === 45).map((row) => (
                        <tr 
                          key={row.day} 
                          className={`hover:bg-gray-50 transition-colors ${selectedPerformanceDay === row.day ? 'bg-green-50/50' : ''}`}
                        >
                          <td className="px-6 py-3 font-bold text-gray-900">{row.day}</td>
                          <td className="px-6 py-3">{row.weight}</td>
                          <td className="px-6 py-3 text-blue-600">{row.dailyGain}</td>
                          <td className="px-6 py-3 text-orange-600">{row.dailyIntake}</td>
                          <td className="px-6 py-3 text-orange-800">{row.cumIntake}</td>
                          <td className="px-6 py-3 font-bold text-green-700">{row.fcr.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 bg-gray-50 text-center text-[10px] text-gray-400">
                    * ملاحظة: هذه الأرقام تمثل الأداء القياسي (As-Hatched) لشركة Aviagen لسلالة Ross 308.
                  </div>
                </div>
              </div>
            ) : (
              <GrowthEngineTool coeffs={regressionCoeffs} />
            )}
          </motion.div>
        )}

          {activeTab === 'regression' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RegressionEngineTool onApply={(coeffs) => setRegressionCoeffs(coeffs)} />
            </motion.div>
          )}

          {activeTab === 'summer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SummerStrategyTool 
                currentTemp={temperature}
                humidity={humidity}
                heatIndex={heatIndex}
                fiDropPercent={fiDropPercent}
                heatFactor={currentHeatFactor}
              />
            </motion.div>
          )}

          {activeTab === 'phytase' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PhytaseCalculator onCopyResults={(newMatrix) => {
                setIngredients(prev => prev.map(ing => {
                  if (ing.name.includes("فيتاز") || ing.name.includes("Hiphos")) {
                    return { ...ing, nutrition: { ...ing.nutrition, ...newMatrix } };
                  }
                  return ing;
                }));
              }} />
            </motion.div>
          )}

          {activeTab === 'simulator' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-blue-100 rounded-2xl">
                    <RefreshCcw className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">محاكي الاستبدال الذكي</h2>
                    <p className="text-gray-500">حساب تأثير استبدال مادة بأخرى والكميات المطلوبة للتعويض.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100 mb-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase pr-2">المادة المراد استبدالها (المصدر)</label>
                    <select 
                      value={simulatorSourceId}
                      onChange={(e) => setSimulatorSourceId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      <option value="">اختر مادة...</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-center pt-6">
                    <div className="w-full h-px bg-gray-200 relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full border border-gray-100 shadow-sm">
                          <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase pr-2">المادة البديلة (الهدف)</label>
                    <select 
                      value={simulatorTargetId}
                      onChange={(e) => setSimulatorTargetId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      <option value="">اختر مادة...</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-start-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase pr-2">النسبة المئوية للاستبدال (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={simulatorAmount}
                      onChange={(e) => setSimulatorAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center"
                    />
                  </div>
                </div>

                {simulationResult && (
                  <div className="space-y-8">
                    {/* Financial Impact Banner */}
                    <div className="space-y-4">
                      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${simulationResult.netCostImpact > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${simulationResult.netCostImpact > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <DollarSign className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">الأثر المالي لإعادة التوازن (لكل 1 طن)</p>
                            <h3 className={`text-3xl font-black ${simulationResult.netCostImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {simulationResult.netCostImpact > 0 ? '+' : ''}{simulationResult.netCostImpact.toFixed(2)} $
                            </h3>
                          </div>
                        </div>
                        <div className="bg-white/50 px-6 py-3 rounded-2xl border border-white/20">
                           <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">حالة التكلفة بعد التصحيح</p>
                           <p className={`text-lg font-bold ${simulationResult.netCostImpact > 0 ? 'text-red-700' : 'text-green-700'}`}>
                             {simulationResult.netCostImpact > 0 ? 'زيادة في المصاريف' : 'توفير حقيقي'}
                           </p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                         <div className="p-2 bg-blue-100 rounded-lg">
                           <Activity className="w-4 h-4 text-blue-600" />
                         </div>
                         <div className="text-sm leading-relaxed">
                            <span className="font-bold text-blue-800 block mb-1">ذكاء المحاكاة (Formula-Aware):</span>
                            <p className="text-blue-700 opacity-80">
                              يتم حساب هذه المقترحات بناءً على **خلطتك الحالية**. الهدف هو الحفاظ على نفس القيم الغذائية التي وصلت إليها في تبويب "النتائج"، لضمان عدم تأثر أداء الطيور سلباً بهذا الاستبدال.
                            </p>
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Impact Table */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
                          <TrendingDown className="w-5 h-5 text-red-500" />
                          الأثر الغذائي للاستبدال (لكل كغ علف)
                        </h3>
                        <div className="overflow-hidden rounded-2xl border border-gray-100">
                          <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 text-gray-500 uppercase tracking-widest text-[10px]">
                              <tr>
                                <th className="px-4 py-3">العنصر الغذائي</th>
                                <th className="px-4 py-3">خسارة / زيادة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-mono">
                              {nutrientsToEdit.map(n => {
                                const val = simulationResult.delta[n.key] || 0;
                                if (Math.abs(val) < 0.0001) return null;
                                return (
                                  <tr key={n.key}>
                                    <td className="px-4 py-3 font-bold text-gray-600">{n.label}</td>
                                    <td className={`px-4 py-3 font-bold ${val > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {val > 0 ? '+' : ''}{val.toFixed(4)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Correction Actions */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 px-2 text-blue-600">
                          <CheckCircle2 className="w-5 h-5" />
                          الإجراءات التصحيحية المقترحة
                        </h3>
                        <div className="space-y-4">
                          {simulationResult.corrections.length > 0 ? (
                            simulationResult.corrections.map((c, i) => (
                              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${c.type === 'add' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white rounded-lg shadow-sm">
                                    {c.type === 'add' ? <Plus className="w-4 h-4 text-blue-600" /> : <Trash2 className="w-4 h-4 text-orange-600" />}
                                  </div>
                                  <span className="font-bold text-gray-700">{c.type === 'add' ? 'إضافة' : 'خفض'} {c.name}</span>
                                </div>
                                <div className="text-left">
                                  <span className={`text-xl font-black ${c.type === 'add' ? 'text-blue-700' : 'text-orange-700'}`}>{c.amount.toFixed(3)}</span>
                                  <span className={`text-xs font-bold mr-1 ${c.type === 'add' ? 'text-blue-400' : 'text-orange-400'}`}>{c.unit}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 italic">
                              لا يوجد نقص يحتاج لتصحيح آلي حالياً.
                            </div>
                          )}
                          <div className="p-4 bg-orange-50 rounded-xl text-[10px] text-orange-700 flex gap-2 border border-orange-100">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>ملاحظة: هذه الحسابات تعتمد على القيم الحالية للمواد التصحيحية (الزيت، الأحماض الأمينية، المصادر المعدنية) كما هي معرفة في قاعدة بيانات المكونات لديك.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
           <div className="flex items-center gap-6">
             <a 
               href="https://www.facebook.com/share/18dXfcgUun/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
             >
               <Facebook className="w-3.5 h-3.5" />
               <span className="normal-case">Facebook Page</span>
               <ExternalLink className="w-2.5 h-2.5 opacity-50" />
             </a>
             <div className="flex flex-col items-end leading-none">
               <span className="text-[9px] text-blue-600 mb-0.5" dir="rtl">تقديم وتصميم: د. ظلال الصافتلي</span>
               <span className="font-mono text-[9px] text-gray-400" dir="ltr">+963946656403</span>
             </div>
             <div>Ross 308 Standards &copy; 2026</div>
           </div>
        </div>
      </footer>

      {/* Printable Report Content (Hidden in UI via CSS) */}
      <div id="printable-report" className="hidden print:block p-10 bg-white text-black rtl text-right" dir="rtl">
        <div className="flex items-center justify-between border-b-2 border-green-600 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="https://scontent-sjc3-1.xx.fbcdn.net/v/t39.30808-6/491529283_1072530858016732_1086890789763123853_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=lrMsrX8QA2MQ7kNvwGEOLh4&_nc_oc=AdrlzDeG9B4A-IlkrOdp9XUqxHK4fG-jpZLvrLerrMBCxrFw5ZmKlSydPXjGXXi1NZw&_nc_zt=23&_nc_ht=scontent-sjc3-1.xx&_nc_gid=EMLGCueKnEtU5G8GXgU4qg&_nc_ss=7a3a8&oh=00_Af1u8As3peG3hpx8NQufqfEIdCTZELry-WO6e-1ztcXgoA&oe=69ED1D2E" 
              alt="Logo" 
              className="w-20 h-20 rounded-2xl object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-right" dir="rtl">
              <h1 className="text-3xl font-bold text-gray-900">شركة الأسعد إخوان للدواجن</h1>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-green-700">تقرير تحليل علائق Ross 308</p>
                {isSummerStrategyActive && (
                  <span className="px-3 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-black uppercase tracking-tighter">
                    Syrian Summer Strategy v1.0 Activated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-gray-500 italic">تقديم وتصميم: د. ظلال الصافتلي (+963946656403)</p>
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                <p className="text-sm text-gray-500 font-bold">حمص - تلكلخ</p>
              </div>
              <p className="text-sm text-gray-400 mt-1">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>
          <div className="text-left" dir="ltr">
            <p className="font-bold text-green-700 text-xl tracking-tight">Scientific Poultry Nutrition</p>
            <p className="text-xs text-gray-400">Software v2.0</p>
          </div>
        </div>

        <div className="mb-10 text-right">
          <h2 className="text-xl font-bold bg-gray-100 p-3 rounded-lg mb-4 border-r-4 border-blue-600">أولاً: المكونات الرئيسية (Macro Ingredients)</h2>
          
          {isSummerStrategyActive && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Sun className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase">سياق الإجهاد الحراري</p>
                  <p className="text-sm font-bold text-gray-700">الحرارة: {temperature}°م | نقص الاستهلاك: {fiDropPercent.toFixed(1)}% | معامل الحرارة: {currentHeatFactor.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400">إزاحة الطاقة المعتمدة</p>
                <p className="text-lg font-black text-orange-700">+{fiDropPercent > 18 ? '80' : (fiDropPercent >= 12 ? '60' : '40')} kcal/kg</p>
              </div>
            </div>
          )}

          <table className="w-full border-collapse mb-8">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-sm">
                <th className="border-2 border-gray-300 p-3 text-right">المكون الأساسي</th>
                <th className="border-2 border-gray-300 p-3 text-center">النسبة (%)</th>
                <th className="border-2 border-gray-300 p-3 text-center">لكل 1 طن</th>
                <th className="border-2 border-gray-300 p-3 text-center text-blue-900 bg-blue-50">لـ {batchSize} طن</th>
              </tr>
            </thead>
            <tbody>
              {activeIngredients
                .filter(ing => ing.name.includes('ذرة') || ing.name.includes('صويا') || ing.name.includes('زيت'))
                .map(ing => {
                  const mixItem = mixture.find(m => m.ingredientId === ing.id);
                  const percentage = parseFloat(mixItem?.percentage) || 0;
                  return (
                    <tr key={ing.id} className="text-base text-gray-900 font-medium">
                      <td className="border-2 border-gray-300 p-4 font-bold bg-gray-50/50">{ing.name}</td>
                      <td className="border-2 border-gray-300 p-4 text-center font-mono">%{percentage.toFixed(2)}</td>
                      <td className="border-2 border-gray-300 p-4 text-center font-mono text-gray-600">{(percentage * 10).toFixed(2)} كغ</td>
                      <td className="border-2 border-gray-300 p-4 text-center font-mono font-bold text-blue-800 bg-blue-50/30">{(percentage * 10 * batchSize).toFixed(2)} كغ</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <div className="mt-4 p-5 bg-blue-900 text-white rounded-2xl flex justify-between items-center shadow-lg print:shadow-none" dir="rtl">
             <span className="font-bold text-lg">سعر الطن المتوقع:</span>
             <span className="text-3xl font-mono">${(costPerKg * 1000).toLocaleString()} / طن</span>
          </div>
        </div>

        {/* Page Break for Premix Section */}
        <div className="page-break-before pt-10 text-right">
          <div className="flex items-center justify-between border-b-2 border-green-600 pb-4 mb-6">
             <h2 className="text-2xl font-black text-green-700">ثانياً: جدول أوزان البريمكس والإضافات (الميزان الدقيق)</h2>
             <div className="text-left">
                <p className="text-xs font-bold text-gray-500 uppercase">Batch Size: {batchSize} Ton</p>
                <p className="text-xs font-bold text-green-600">Precision Weighing List</p>
             </div>
          </div>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-green-50 text-green-900">
                <th className="border-2 border-green-200 p-4 text-right text-lg">المكون / الإضافة المهضومة</th>
                <th className="border-2 border-green-200 p-4 text-center text-lg">النسبة (%)</th>
                <th className="border-2 border-green-200 p-4 text-center text-lg bg-green-100">الوزن المطلوب لـ ({batchSize} طن)</th>
              </tr>
            </thead>
            <tbody>
              {activeIngredients
                .filter(ing => !(ing.name.includes('ذرة') || ing.name.includes('صويا') || ing.name.includes('زيت')))
                .map(ing => {
                  const mixItem = mixture.find(m => m.ingredientId === ing.id);
                  const percentage = parseFloat(mixItem?.percentage) || 0;
                  const weightInKg = percentage * 10 * batchSize;
                  return (
                    <tr key={ing.id} className="text-lg">
                      <td className="border-2 border-green-200 p-5 font-black text-gray-900">{ing.name}</td>
                      <td className="border-2 border-green-200 p-5 text-center font-mono text-gray-500">%{percentage.toFixed(3)}</td>
                      <td className="border-2 border-green-200 p-5 text-center font-mono font-black text-green-800 bg-green-50/50">
                        {weightInKg >= 1 ? `${weightInKg.toFixed(3)} كغ` : `${(weightInKg * 1000).toFixed(0)} غرام`}
                      </td>
                    </tr>
                  );
                })}
              <tr className="bg-gray-900 text-white font-bold text-xl">
                <td className="border-2 border-gray-900 p-6" colSpan={2}>المجموع الكلي للبريمكس والإضافات</td>
                <td className="border-2 border-gray-900 p-6 text-center font-mono">
                   {(activeIngredients
                    .filter(ing => !(ing.name.includes('ذرة') || ing.name.includes('صويا') || ing.name.includes('زيت')))
                    .reduce((sum, ing) => sum + (parseFloat(mixture.find(m => m.ingredientId === ing.id)?.percentage || '0') * 10 * batchSize), 0)
                   ).toFixed(3)} كغ
                </td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-8 grid grid-cols-2 gap-6">
             <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest text-center">توقيع المسؤول عن الميزان</p>
                <div className="h-px bg-gray-100 w-full mb-4"></div>
             </div>
             <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl">
                <p className="text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest text-center">ملاحظات التحضير</p>
                <div className="h-px bg-gray-100 w-full mb-4"></div>
             </div>
          </div>
        </div>

        <div className="page-break-before pt-10 text-right">
          <h2 className="text-xl font-bold bg-gray-100 p-3 rounded-lg mb-4 border-r-4 border-indigo-600">ثالثاً: التحليل الغذائي والمقارنة الدولية</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="border border-gray-300 p-3 text-right">العنصر الغذائي</th>
                <th className="border border-gray-300 p-3 text-center">الاحتياج المطلوب</th>
                <th className="border border-gray-300 p-3 text-center">المتحقق بالخلطة</th>
                <th className="border border-gray-300 p-3 text-center">الفرق</th>
                <th className="border border-gray-300 p-3 text-center">التقييم</th>
              </tr>
            </thead>
            <tbody>
              {[
                { k: 'ME', l: 'الطاقة الممثلة (ME)', u: 'kcal' },
                { k: 'CP', l: 'بروتين خام (CP)', u: '%' },
                { k: 'Ca', l: 'كالسيوم (Ca)', u: '%' },
                { k: 'avP', l: 'فوسفور متاح (av.P)', u: '%' },
                { k: 'K', l: 'بوتاسيوم (K)', u: '%' },
                { k: 'Na', l: 'صوديوم (Na)', u: '%' },
                { k: 'Cl', l: 'كلور (Cl)', u: '%' },
                { k: 'dLys', l: 'لايسين (dLys)', u: '%' },
                { k: 'dMetCys', l: 'الميثيونين + السيستين (dMetCys)', u: '%' },
                { k: 'dThr', l: 'ثريونين (dThr)', u: '%' },
                { k: 'dVal', l: 'فالين (dVal)', u: '%' },
                { k: 'choline', l: 'الكولين (Choline)', u: 'mg' },
              ].map(({ k, l, u }) => {
                const key = k as keyof Nutrition;
                const act = actualNutrition[key] || 0;
                const req = parseFloat(currentRequirement[key]) || 0;
                const diff = act - req;
                const evalRes = getEvaluation(act, req);
                return (
                  <tr key={k} className="text-sm">
                    <td className="border border-gray-300 p-3 font-bold">{l} <span className="text-[10px] text-gray-400 font-normal">({u})</span></td>
                    <td className="border border-gray-300 p-3 text-center font-mono">{req.toFixed(k === 'ME' || k === 'choline' ? 0 : 3)}</td>
                    <td className="border border-gray-300 p-3 text-center font-mono font-bold text-blue-700">{act.toFixed(k === 'ME' || k === 'choline' ? 0 : 3)}</td>
                    <td className={`border border-gray-300 p-3 text-center font-mono ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(k === 'ME' || k === 'choline' ? 0 : 3)}
                    </td>
                    <td className="border border-gray-300 p-3 text-center font-bold">{evalRes.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-right">
          <h2 className="text-xl font-bold bg-gray-100 p-3 rounded-lg mb-4 border-r-4 border-red-600">رابعاً: التوصيات والملاحظات العلمية</h2>
          <div className="space-y-3">
            {getRecommendations().map((rec, i) => (
              <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{rec}</p>
              </div>
            ))}
            {getRecommendations().length === 0 && (
              <p className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 text-sm">تم استيفاء جميع المتطلبات الغذائية بنجاح، لا توجد توصيات تعديل حالياً.</p>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs">
          <p>هذا التقرير تم إنشاؤه عبر برنامج Scientific Poultry Nutrition v2.0 كأداة مساعدة للمتخصصين.</p>
          <p className="mt-1">جميع الحقوق محفوظة -Ross 308 Guide Compliance</p>
        </div>
      </div>
    </div>
  );
}
