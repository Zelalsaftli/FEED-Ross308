
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Settings2, 
  ThermometerSun, 
  FlaskConical, 
  Droplets, 
  ChevronRight,
  Info,
  Beaker,
  ShieldAlert,
  Flame,
  Wind,
  Zap
} from 'lucide-react';
import { PhytaseMatrixService, PhytaseInputs } from '../services/phytaseMatrixService';

interface PhytaseCalculatorProps {
  onCopyResults?: (nutrition: any) => void;
}

const PhytaseCalculator: React.FC<PhytaseCalculatorProps> = ({ onCopyResults }) => {
  const PHASES = [
    { id: 1, name: 'ما قبل البادئ (Pre-Starter)', target: 1800 },
    { id: 2, name: 'بادئ (Starter)', target: 1700 },
    { id: 3, name: 'نامي (Grower)', target: 1600 },
    { id: 4, name: 'ناهي 1 (Finisher 1)', target: 1500 },
    { id: 5, name: 'ناهي 2 (Finisher 2)', target: 1400 }
  ];

  const [selectedPhaseId, setSelectedPhaseId] = useState(3); // Default to Grower (1600)
  
  const [inputs, setInputs] = useState<PhytaseInputs>({
    product_concentration_fyt_per_g: 10000,
    inclusion_rate_g_per_ton: 160,
    corrected_phytate_p: 0.28,
    calcium_percent: 0.90,
    available_phosphorus_percent: 0.45,
    protease_present: 'no',
    carbohydrase_present: 'no',
    acidifier_present: 'no',
    accessibility_factor_percent: 100
  });

  const [activeTab, setActiveTab] = useState<'inputs' | 'results'>('inputs');

  const results = useMemo(() => {
    return PhytaseMatrixService.calculate(inputs);
  }, [inputs]);

  const handlePhaseChange = (id: number) => {
    setSelectedPhaseId(id);
    const phase = PHASES.find(p => p.id === id);
    if (phase) {
      // Dose (g/ton) = (Requirement (FYT/kg) * 1000) / Product (FYT/g)
      const newRate = (phase.target * 1000) / inputs.product_concentration_fyt_per_g;
      setInputs(prev => ({ ...prev, inclusion_rate_g_per_ton: Math.round(newRate) }));
    }
  };

  const handleConcentrationChange = (conc: number) => {
    const phase = PHASES.find(p => p.id === selectedPhaseId);
    if (phase && conc > 0) {
      const newRate = (phase.target * 1000) / conc;
      setInputs(prev => ({ 
        ...prev, 
        product_concentration_fyt_per_g: conc,
        inclusion_rate_g_per_ton: Math.round(newRate)
      }));
    } else {
      setInputs(prev => ({ ...prev, product_concentration_fyt_per_g: conc }));
    }
  };

  const handleInputChange = (key: keyof PhytaseInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const nutrientLabels: Record<string, {label: string, unit: string, color: string}> = {
    AvP: { label: 'Available Phosphorus', unit: '%', color: 'text-blue-600' },
    Ca: { label: 'Calcium', unit: '%', color: 'text-orange-600' },
    Na: { label: 'Sodium', unit: '%', color: 'text-sky-600' },
    Protein: { label: 'Crude Protein', unit: '%', color: 'text-emerald-600' },
    ME: { label: 'Metab. Energy', unit: 'kcal/kg', color: 'text-red-600' },
    Lys: { label: 'SID Lysine', unit: '%', color: 'text-indigo-600' },
    MetCys: { label: 'SID Met+Cys', unit: '%', color: 'text-indigo-400' },
    Thr: { label: 'SID Threonine', unit: '%', color: 'text-violet-600' },
    Arg: { label: 'SID Arginine', unit: '%', color: 'text-sky-600' },
    Val: { label: 'SID Valine', unit: '%', color: 'text-violet-500' },
    Iso: { label: 'SID Isoleucine', unit: '%', color: 'text-cyan-500' },
    Leu: { label: 'SID Leucine', unit: '%', color: 'text-cyan-600' },
    GlySer: { label: 'SID Gly+Ser', unit: '%', color: 'text-teal-600' },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">حاسبة ماتريكس الفيتاز (DSM Logic)</h1>
            <p className="text-gray-500 font-medium text-sm">تعديل الماتريكس بناءً على الجرعة، نسبة الكالسيوم، والتداخلات الإنزيمية</p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('inputs')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'inputs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            المدخلات
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'results' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            النتائج النهائية
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Inputs Panel */}
        <div className={`lg:col-span-4 space-y-6 ${activeTab === 'results' ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 h-full">
            <h2 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              بارامترات الحساب
            </h2>

            <div className="space-y-6">
              {/* Phase Selection Section */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full w-fit">المرحلة والجرعة المستهدفة</p>
                <div className="space-y-3">
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">اختر المرحلة العمرية</label>
                    <div className="grid grid-cols-1 gap-2">
                       {PHASES.map(phase => (
                         <button
                           key={phase.id}
                           onClick={() => handlePhaseChange(phase.id)}
                           className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300 ${
                             selectedPhaseId === phase.id 
                               ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                               : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-indigo-200'
                           }`}
                         >
                           <span className="text-xs font-bold">{phase.name}</span>
                           <span className={`text-[10px] font-black ${selectedPhaseId === phase.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                             {phase.target} FYT/kg
                           </span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Concentration Section */}
              <div className="space-y-4 border-t border-gray-50 pt-6">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full w-fit">تركيز المنتج والإضافة</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">تركيز المنتج (FYT/غ)</label>
                    <input 
                      type="number" 
                      value={inputs.product_concentration_fyt_per_g}
                      onChange={(e) => handleConcentrationChange(parseFloat(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <div className="flex justify-between items-center mb-1">
                       <label className="text-xs font-bold text-indigo-700">معدل الإضافة (غ/طن علف)</label>
                       <span className="text-[9px] font-black text-indigo-400 px-2 py-0.5 bg-white rounded-full">محسوب آلياً</span>
                    </div>
                    <input 
                      type="number" 
                      value={inputs.inclusion_rate_g_per_ton}
                      onChange={(e) => handleInputChange('inclusion_rate_g_per_ton', parseFloat(e.target.value))}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-lg font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Composition Section */}
              <div className="space-y-4 border-t border-gray-50 pt-6">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full w-fit">المعطيات الغذائية الحالية</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">الكالسيوم %</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={inputs.calcium_percent}
                        onChange={(e) => handleInputChange('calcium_percent', parseFloat(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Phos المتاح %</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={inputs.available_phosphorus_percent}
                        onChange={(e) => handleInputChange('available_phosphorus_percent', parseFloat(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enzymes Section */}
              <div className="space-y-4 border-t border-gray-50 pt-6">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit">التفاعلات الأنزيمية</p>
                <div className="space-y-3">
                  {[
                    { id: 'protease_present', label: 'Protease (بروتياز)', icon: Beaker },
                    { id: 'carbohydrase_present', label: 'Carbohydrase', icon: Wind },
                    { id: 'acidifier_present', label: 'Acidifier', icon: Droplets }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-gray-700">{item.label}</span>
                      </div>
                      <select 
                        value={inputs[item.id as keyof PhytaseInputs]}
                        onChange={(e) => handleInputChange(item.id as keyof PhytaseInputs, e.target.value)}
                        className="bg-white border border-gray-100 rounded-xl px-3 py-1 text-xs font-bold focus:ring-2 focus:ring-emerald-200 outline-none"
                      >
                        <option value="yes">نعم</option>
                        <option value="no">لا</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className={`lg:col-span-8 space-y-6 ${activeTab === 'inputs' ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 h-full">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                <Beaker className="w-5 h-5 text-indigo-600" />
                تحليل الماتريكس الصافي
              </h2>
              <div className="flex flex-wrap gap-2">
                {onCopyResults && (
                  <button
                    onClick={() => {
                      const matrixToCopy: any = {};
                      Object.entries(nutrientLabels).forEach(([key]) => {
                        const summerValue = results.matrix_summer_mode[key] || 0;
                        let releaseValue = 0;
                        if (key === 'ME') {
                          releaseValue = summerValue * 10000;
                        } else {
                          releaseValue = (summerValue * 100) / (inputs.inclusion_rate_g_per_ton / 10000);
                        }
                        
                        // Mapping to nutrition object keys
                        const mapping: Record<string, string> = {
                          'AvP': 'avP',
                          'Ca': 'Ca',
                          'Na': 'Na',
                          'Protein': 'CP',
                          'Lys': 'dLys',
                          'Thr': 'dThr',
                          'Arg': 'dArg',
                          'Val': 'dVal',
                          'Iso': 'dIso',
                          'Leu': 'dLeu',
                          'ME': 'ME'
                        };
                        
                        if (mapping[key]) {
                          matrixToCopy[mapping[key]] = parseFloat(releaseValue.toFixed(2));
                        }
                      });
                      onCopyResults(matrixToCopy);
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 ml-4 h-fit"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    تحديث مصفوفة الأنزيم بالخلطة
                  </button>
                )}
                <div className="bg-indigo-50 px-3 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-[9px] font-black text-indigo-400 uppercase">Dose Factor</span>
                  <span className="text-sm font-black text-indigo-700">{results.dose_factor.toFixed(2)}</span>
                </div>
                <div className="bg-blue-50 px-3 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-[9px] font-black text-blue-400 uppercase">Ratio Factor</span>
                  <span className="text-sm font-black text-blue-700">{results.ca_p_factor.toFixed(2)}</span>
                </div>
                <div className="bg-emerald-50 px-3 py-1.5 rounded-xl flex flex-col items-center">
                  <span className="text-[9px] font-black text-emerald-400 uppercase">Enzyme Fact.</span>
                  <span className="text-sm font-black text-emerald-700">{results.enzyme_factor.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Matrix Data Table */}
            <div className="overflow-hidden border border-gray-100 rounded-3xl">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">العنصر الغذائي</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase">الوحدة</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-600 uppercase text-center bg-indigo-50/30">الماتريكس المعدل</th>
                    <th className="px-6 py-4 text-xs font-black text-orange-600 uppercase text-center bg-orange-50/30">الصيف (70%)</th>
                    <th className="px-6 py-4 text-xs font-black text-emerald-600 uppercase text-center bg-emerald-50/30">تحرير/1كغ أنزيم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(nutrientLabels).map(([key, info]) => {
                    const summerValue = results.matrix_summer_mode[key] || 0;
                    const releasePerKg = key === 'ME' 
                      ? summerValue * 10000 
                      : (summerValue * 100) / (inputs.inclusion_rate_g_per_ton / 10000);

                    return (
                      <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-400">{info.unit}</td>
                        <td className="px-6 py-4 text-center bg-indigo-50/10">
                          <span className="text-sm font-black text-indigo-900">
                            {results.matrix_raw[key]?.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center bg-orange-50/10">
                          <span className="text-sm font-black text-orange-700">
                            {summerValue.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center bg-emerald-50/10">
                          <span className="text-sm font-black text-emerald-700">
                            {releasePerKg !== null ? releasePerKg.toFixed(2) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Alert */}
            <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex gap-5 items-start">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">تحذير الإجهاد الحراري (سوريا)</p>
                <p className="text-xs text-red-700 leading-relaxed font-medium">
                  تم تطبيق عامل أمان 30% لوضع الصيف. في الأجواء الحارة، ينخفض نشاط الأنزيم داخلياً وتضعف قدرة الطيور على امتصاص الفوسفور، لذا يوصى دائماً باستخدام قيم "الصيف" في الصياغة الميدانية السورية لضمان سلامة الهيكل العظمي.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhytaseCalculator;
