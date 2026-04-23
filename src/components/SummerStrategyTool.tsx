import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  AlertTriangle, 
  Zap, 
  Beaker, 
  Scale, 
  CheckCircle2, 
  Thermometer, 
  TrendingDown,
  ArrowRight,
  ClipboardCheck,
  ShieldCheck
} from 'lucide-react';

interface SummerStrategyToolProps {
  currentTemp?: number;
  humidity?: number;
  heatIndex?: number;
  fiDropPercent?: number;
  heatFactor?: number;
}

const SummerStrategyTool: React.FC<SummerStrategyToolProps> = ({ 
  currentTemp = 32, 
  humidity = 50,
  heatIndex = 32,
  fiDropPercent = 12,
  heatFactor = 0.88
}) => {
  const isTriggered = heatIndex >= 30 || fiDropPercent >= 8 || heatFactor <= 0.92;

  const sections = [
    {
      title: "1. Summer Context",
      icon: <Sun className="w-5 h-5 text-orange-500" />,
      items: [
        { label: "Expected Temperature", value: "30–40°C" },
        { label: "FI Reduction", value: "8–22%" },
        { label: "DG Reduction", value: "10–25%" },
        { label: "Mortality Risk", value: "0.5–2.0%" }
      ]
    },
    {
      title: "4. Energy Strategy (EM)",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      content: "Compensate for reduced FI intake by increasing density:",
      rules: [
        { condition: "FI drop 8–12%", action: "+40 kcal/kg EM" },
        { condition: "FI drop 12–18%", action: "+60 kcal/kg EM" },
        { condition: "FI drop >18%", action: "+80 kcal/kg EM" }
      ],
      note: "Preferred: Vegetable oil, High-quality animal fat."
    },
    {
      title: "5. Amino Acid Strategy",
      icon: <Beaker className="w-5 h-5 text-indigo-500" />,
      items: [
        { label: "SID Lysine", value: "+6%" },
        { label: "Threonine", value: "+4%" },
        { label: "Methionine", value: "+3%" }
      ],
      note: "Maintain protein deposition under reduced FI."
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Status */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-2xl">
              <Sun className="w-10 h-10 text-orange-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Summer Nutrition Strategy v1.0</h2>
              <p className="text-gray-500 font-mono text-sm">Target Context: Syrian Summer (30–40°C)</p>
            </div>
          </div>

          <div className={`px-6 py-4 rounded-2xl flex items-center gap-3 border ${isTriggered ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
            {isTriggered ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Strategy Status</p>
              <p className="font-bold">{isTriggered ? 'ACTIVE: Heat Stress Protocol' : 'STANDBY: Normal Conditions'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Triggers and Context */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              2. Activation Triggers
            </h3>
            <div className="space-y-3">
              {[
                { label: `Temp ≥ 30°C (Current: ${currentTemp}°)`, active: currentTemp >= 30 },
                { label: `Heat Index ≥ 30 (Current: ${heatIndex.toFixed(1)})`, active: heatIndex >= 30 },
                { label: `FI Drop ≥ 8% (Current: ${fiDropPercent.toFixed(1)}%)`, active: fiDropPercent >= 8 },
                { label: `HeatFactor ≤ 0.92 (Current: ${heatFactor.toFixed(2)})`, active: heatFactor <= 0.92 }
              ].map((t, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between ${t.active ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`text-[11px] font-bold ${t.active ? 'text-red-700' : 'text-gray-500'}`}>{t.label}</span>
                  {t.active && <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Thermometer className="w-24 h-24" />
            </div>
            <h3 className="font-bold flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-blue-300" />
              3. Growth Modifier
            </h3>
            <div className="space-y-4">
              <p className="text-xs opacity-80 leading-relaxed italic pr-4 border-r-2 border-blue-400">
                HF = Temp ≤ 28°C → 1.00<br />
                HF = 28–32°C → 0.95–0.88<br />
                HF = ≥ 32°C → 0.85
              </p>
              <div className="p-4 bg-white/10 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-300 uppercase mb-1">Adjusted Daily Gain</p>
                <p className="font-mono text-lg font-bold">DG_heat = DG_obs × HF</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Diet Adjustments */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* EM Strategy */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-bold text-gray-800">4. Energy (EM)</h3>
              </div>
              <div className="space-y-3">
                {[
                  { range: "8–12% FI Drop", val: "+40 kcal" },
                  { range: "12–18% FI Drop", val: "+60 kcal" },
                  { range: ">18% FI Drop", val: "+80 kcal" }
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-500">{r.range}</span>
                    <span className="text-xs font-bold text-yellow-600">{r.val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-bold bg-gray-50 p-2 rounded-lg">Sources: Vegetable oil, High-quality animal fat.</p>
            </div>

            {/* AA Strategy */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Beaker className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-800">5. Amino Acids</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "SID Lysine", val: "+6%" },
                  { label: "Threonine", val: "+4%" },
                  { label: "Methionine", val: "+3%" }
                ].map((a, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400">{a.label}</span>
                    <span className="text-sm font-bold text-indigo-600">{a.val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 italic">Concentration increases, not daily intake increases.</p>
            </div>

            {/* Minerals */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Scale className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800">6. Ca & P Reduction</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center">
                    <span className="block text-[10px] font-bold uppercase mb-1">Calcium</span>
                    <span className="font-bold">-0.05%</span>
                  </div>
                  <div className="flex-1 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center">
                    <span className="block text-[10px] font-bold uppercase mb-1">AvP</span>
                    <span className="font-bold">-0.03%</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-900 text-white rounded-xl text-center">
                  <span className="text-[10px] block opacity-70">Target DEB</span>
                  <span className="font-mono font-bold">250–260 mEq/kg</span>
                </div>
              </div>
            </div>

            {/* Decision Tree Preview */}
            <div className="bg-gray-900 text-white rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ClipboardCheck className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-bold">10. Weekly Decision Tree</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 items-start group">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0"></div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-300">Temp ≥ 32</p>
                    <p className="text-[9px] text-gray-500">HF 0.85 | +60 EM | +6% Lys</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start group">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0"></div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-300">FI Drop ≥ 12%</p>
                    <p className="text-[9px] text-gray-500">+60 EM | +4-6% AA | Quality Check</p>
                  </div>
                </div>
              </div>
              <button className="w-full py-2 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[10px] font-bold flex items-center justify-center gap-1">
                View Full Decision Logic <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Monitoring Checklist */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              9. Daily Monitoring Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {[
                "House Temperature monitoring (Max/Min)",
                "Daily Feed Intake recording",
                "Bird behavior (Panting/Clustering)",
                "Expected vs Actual DG tracking",
                "Mortality & Thirst levels",
                "Ventilation & Air quality check"
              ].map((check, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-lg flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{check}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Versioning */}
      <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 px-8">
        <span className="uppercase tracking-widest">Syrian Summer Strategy v1.0</span>
        <span className="font-mono">Created for Syrian Field Ops (2026)</span>
      </div>
    </div>
  );
};

export default SummerStrategyTool;
