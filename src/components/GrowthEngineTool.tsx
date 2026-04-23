import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Activity, Beaker, TrendingUp, Settings2, Info, Plus, Calculator, Table, FileText, Scale } from 'lucide-react';
import { growthEngine, ModelType, Sex } from '../services/growthEngine';
import { ROSS_308_PERFORMANCE_DATA } from '../constants';

import { SyrianBroilerEngine } from '../services/syrianModelEngine';

interface GrowthEngineToolProps {
  coeffs?: {
    em: { a: number, b: number };
    lys: { a: number, b: number };
  };
}

const GrowthEngineTool: React.FC<GrowthEngineToolProps> = ({ coeffs }) => {
  const effectiveCoeffs = coeffs || {
    em: { a: 2.80, b: 0.015 },
    lys: { a: 1.00, b: 0.0010 }
  };
  
  const [sex, setSex] = useState<Sex>('male');
  const [model, setModel] = useState<ModelType>('Gompertz');
  const [isFitting, setIsFitting] = useState(false);
  const [fitResult, setFitResult] = useState<any>(null);

  // Manual Inputs for Syrian Growth Engine
  const [weeklyBW, setWeeklyBW] = useState<Record<number, string>>({
    1: '185',
    2: '450',
    3: '880',
    4: '1450',
    5: '2100',
    6: '2800'
  });

  const [weeklyFI, setWeeklyFI] = useState<Record<number, string>>({
    1: '160',
    2: '380',
    3: '750',
    4: '1150',
    5: '1600',
    6: '2100'
  });

  const [weeklyTemp, setWeeklyTemp] = useState<Record<number, string>>({
    1: '28',
    2: '30',
    3: '34',
    4: '38',
    5: '38',
    6: '38'
  });

  const [weeklyHumidity, setWeeklyHumidity] = useState<Record<number, string>>({
    1: '50',
    2: '50',
    3: '55',
    4: '60',
    5: '60',
    6: '60'
  });

  const [useManualData, setUseManualData] = useState(true);

  // Pre-load reference data
  const refData = useMemo(() => {
    if (useManualData) {
      const t = [7, 14, 21, 28, 35, 42];
      const bw = [1, 2, 3, 4, 5, 6].map(w => parseFloat(weeklyBW[w]) || 0);
      const fi_weekly = [1, 2, 3, 4, 5, 6].map(w => parseFloat(weeklyFI[w]) || 0);
      
      let cumIntake = 0;
      const fi_cum = fi_weekly.map(v => {
        cumIntake += v;
        return cumIntake;
      });

      return { t, bw, fi_cum };
    }

    const t = ROSS_308_PERFORMANCE_DATA.map(d => d.day);
    const bw = ROSS_308_PERFORMANCE_DATA.map(d => sex === 'male' ? d.weight : d.weight * 0.92);
    const fi_cum = ROSS_308_PERFORMANCE_DATA.map(d => sex === 'male' ? d.cumIntake : d.cumIntake * 0.94);

    return { t, bw, fi_cum };
  }, [useManualData, weeklyBW, weeklyFI, sex]);

  const runFitting = () => {
    setIsFitting(true);
    setTimeout(() => {
      growthEngine.fitGrowthModel(sex, model, refData.t, refData.bw);
      growthEngine.fitFIModel(sex, model, refData.t, refData.fi_cum);

      setFitResult({
        current: growthEngine.getParams(sex, 'growth', model)
      });
      setIsFitting(false);
    }, 600);
  };

  useEffect(() => {
    runFitting();
  }, [refData, model, sex]);

  const chartData = useMemo(() => {
    if (!fitResult) return [];
    return Array.from({ length: 43 }, (_, i) => ({
      day: i,
      standard: ROSS_308_PERFORMANCE_DATA[i]?.weight || 0,
      predicted: Math.round(growthEngine.predictBW(sex, i, model)),
      dailyGain: Math.round(growthEngine.predictGrowthRate(sex, i, model)),
      dailyFI: Math.round(growthEngine.predictFIDaily(sex, i, model))
    }));
  }, [sex, model, fitResult]);

  const params = fitResult?.current;

  // Derived Metrics for Table
  const derivedMetrics = useMemo(() => {
    const metrics = [];
    const initialBW = 42; // Standard chick weight at Day 1
    
    for (let w = 1; w <= 6; w++) {
      const bwCurrent = parseFloat(weeklyBW[w]) || 0;
      const bwPrev = w === 1 ? initialBW : (parseFloat(weeklyBW[w - 1]) || initialBW);
      const fi = parseFloat(weeklyFI[w]) || 0;
      
      const wg = bwCurrent - bwPrev;
      const dg_obs = wg / 7;
      const fcr = wg > 0 ? fi / wg : 0;
      
      // Heat Stress Modifier (Using Heat Index)
      const temp = parseFloat(weeklyTemp[w]) || 24;
      const humidity = parseFloat(weeklyHumidity[w]) || 50;
      const hi = SyrianBroilerEngine.calculateHeatIndex(temp, humidity);
      
      const t_onset = 28;
      const t_severe = 32;
      const mild_drop = 0.05;
      const severe_drop = 0.20;
      
      let heat_factor = 1.0;
      if (hi > t_onset) {
        if (hi >= t_severe) {
          heat_factor = 1.0 - severe_drop;
        } else {
          const frac = (hi - t_onset) / (t_severe - t_onset);
          const drop = mild_drop + frac * (severe_drop - mild_drop);
          heat_factor = 1.0 - drop;
        }
      }
      
      const dg_heat = dg_obs * heat_factor;
      
      const daily_fi = fi / 7;
      // Use the Integrated Nutrition Engine Layer on heat-adjusted DG
      const nutrition = SyrianBroilerEngine.calculateIntegratedRequirements(w, dg_heat, daily_fi, effectiveCoeffs, humidity);

      metrics.push({ 
        week: w, 
        bw: bwCurrent, 
        wg, 
        dg: dg_obs,
        dg_heat,
        temp,
        humidity,
        hi,
        heat_factor,
        fi, 
        fcr, 
        em_req: nutrition.EM_target, 
        lys_req: nutrition.SID_Lys_target,
        ca_req: nutrition.Ca_target,
        p_req: nutrition.AvP_target
      });
    }
    return metrics;
  }, [weeklyBW, weeklyFI, weeklyTemp, effectiveCoeffs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              محرك النمذجة الحيوية السوري (Syrian Modeling Engine)
            </h2>
            <p className="text-gray-500">إدخال أوزان الحقل الأسبوعية واشتقاق المنحنيات والاحتياجات.</p>
          </div>
          <button 
            onClick={() => setUseManualData(!useManualData)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${useManualData ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
          >
            {useManualData ? 'استخدام البيانات اليدوية' : 'استخدام بيانات Ross 308'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              أوزان الجسم الأسبوعية (BW g)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(w => (
                <div key={w} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400">أسبوع {w}</label>
                  <input 
                    type="number"
                    value={weeklyBW[w]}
                    onChange={(e) => setWeeklyBW(prev => ({ ...prev, [w]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              استهلاك العلف الأسبوعي (FI g/week)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(w => (
                <div key={w} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400">أسبوع {w}</label>
                  <input 
                    type="number"
                    value={weeklyFI[w]}
                    onChange={(e) => setWeeklyFI(prev => ({ ...prev, [w]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-red-600" />
              الحرارة (°C) والرطوبة (%) الأسبوعية
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(w => (
                  <div key={w} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">حرارة و{w}</label>
                    <input 
                      type="number"
                      value={weeklyTemp[w]}
                      onChange={(e) => setWeeklyTemp(prev => ({ ...prev, [w]: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map(w => (
                  <div key={w} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">رطوبة و{w}</label>
                    <input 
                      type="number"
                      value={weeklyHumidity[w]}
                      onChange={(e) => setWeeklyHumidity(prev => ({ ...prev, [w]: e.target.value }))}
                      className="w-full bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Settings2 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-800">إعدادات المحرك</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">النموذج الرياضي</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-200">
                  <button 
                    onClick={() => setModel('Gompertz')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${model === 'Gompertz' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-white'}`}
                  >
                    Gompertz
                  </button>
                  <button 
                    onClick={() => setModel('Logistic')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${model === 'Logistic' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-white'}`}
                  >
                    Logistic
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={runFitting}
              disabled={isFitting}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
            >
              {isFitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
              {isFitting ? 'جاري التحليل...' : 'تحديث منحنى النمو'}
            </button>

            {params && (
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">نموذج النمو المستنبط:</h4>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center" dir="ltr">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Syrian {model} Equation</p>
                  <p className="text-sm font-mono font-bold text-indigo-700">
                    BW(t) = {params.W_inf.toFixed(0)} * exp(-exp(-{params.k.toFixed(4)} * (t - {params.t0.toFixed(2)})))
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-left" dir="ltr">
                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <p className="text-[9px] font-bold text-gray-400">W_inf</p>
                    <p className="font-mono text-xs font-bold text-indigo-600">{params.W_inf.toFixed(0)}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <p className="text-[9px] font-bold text-gray-400">k</p>
                    <p className="font-mono text-xs font-bold text-indigo-600">{params.k.toFixed(4)}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <p className="text-[9px] font-bold text-gray-400">t0</p>
                    <p className="font-mono text-xs font-bold text-indigo-600">{params.t0.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-10">
                <Calculator className="w-32 h-32" />
             </div>
             <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
               معادلات الاحتياجات المطبقة:
               {coeffs && (
                 <span className="bg-green-500 text-[10px] px-2 py-0.5 rounded-full">مخصصة</span>
               )}
             </h4>
             <div className="text-xs leading-relaxed opacity-80 font-mono" dir="ltr">
                <p>Energy = {effectiveCoeffs.em.a.toFixed(2)} + {effectiveCoeffs.em.b.toFixed(4)} * (DG/10)</p>
                <p>SID Lys = {effectiveCoeffs.lys.a.toFixed(2)} + {effectiveCoeffs.lys.b.toFixed(6)} * DG</p>
             </div>
          </div>
        </div>

        {/* Right: Analysis */}
        <div className="lg:col-span-2 space-y-8">
          {/* Growth Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Table className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-gray-800">بيانات النمو والاحتياجات المكتشفة</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-4 py-4">الأسبوع</th>
                    <th className="px-4 py-4">الوزن (BW)</th>
                    <th className="px-4 py-4 text-blue-600">الزيادة (WG)</th>
                    <th className="px-4 py-4 text-blue-800">اليومي (DG)</th>
                    <th className="px-4 py-4 text-red-600">Temp/RH</th>
                    <th className="px-4 py-4 text-blue-600">HI</th>
                    <th className="px-4 py-4 text-orange-600">Heat F.</th>
                    <th className="px-4 py-4 text-green-700">FCR</th>
                    <th className="px-4 py-4 bg-indigo-50 text-indigo-700">EM Req</th>
                    <th className="px-4 py-4 bg-indigo-50 text-indigo-700">SID Lys%</th>
                    <th className="px-4 py-4 bg-gray-50 text-gray-700 font-bold">Ca%</th>
                    <th className="px-4 py-4 bg-gray-50 text-gray-700 font-bold">AvP%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-mono font-bold">
                  {derivedMetrics.map(m => (
                    <tr key={m.week} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-gray-400">W{m.week}</td>
                      <td className="px-4 py-4">{m.bw}</td>
                      <td className="px-4 py-4 text-blue-500">{m.wg}</td>
                      <td className="px-4 py-4 text-blue-700">
                        <div className="flex flex-col">
                          <span>{m.dg.toFixed(1)}</span>
                          <span className="text-[9px] text-red-500">H: {m.dg_heat.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-red-600">
                        <div className="flex flex-col">
                          <span>{m.temp}°</span>
                          <span className="text-[9px] text-blue-400">{m.humidity}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-blue-600">{m.hi.toFixed(1)}</td>
                      <td className="px-4 py-4 text-orange-600">{m.heat_factor.toFixed(2)}</td>
                      <td className="px-4 py-4 text-green-600">{m.fcr.toFixed(3)}</td>
                      <td className="px-4 py-4 bg-indigo-50/20 text-indigo-600">{m.em_req.toFixed(3)}</td>
                      <td className="px-4 py-4 bg-indigo-50/20 text-indigo-800">{m.lys_req.toFixed(3)}%</td>
                      <td className="px-4 py-4 bg-gray-50/50 text-gray-700">{m.ca_req.toFixed(2)}%</td>
                      <td className="px-4 py-4 bg-gray-50/50 text-gray-700">{m.p_req.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <h3 className="font-bold text-gray-800 mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              توقعات منحنى الحقل (Field Prediction Curve)
            </h3>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}g`} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    name="الوزن المتوقع (الحقل)" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorPredicted)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="standard" 
                    name="المعيار القياسي" 
                    stroke="#cbd5e1" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthEngineTool;
