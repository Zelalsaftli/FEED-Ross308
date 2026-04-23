import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { 
  Database, 
  Plus, 
  Trash2, 
  Calculator, 
  Zap, 
  LineChart as LineChartIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface FarmData {
  id: string;
  dg: string;
  em: string;
  lys: string;
}

interface RegressionCoeffs {
  em: { a: number, b: number };
  lys: { a: number, b: number };
}

interface RegressionEngineToolProps {
  onApply?: (coeffs: RegressionCoeffs) => void;
}

const RegressionEngineTool: React.FC<RegressionEngineToolProps> = ({ onApply }) => {
  const [farms, setFarms] = useState<FarmData[]>([
    { id: '1', dg: '45', em: '2.87', lys: '1.045' },
    { id: '2', dg: '52', em: '2.88', lys: '1.052' },
    { id: '3', dg: '58', em: '2.89', lys: '1.058' }
  ]);

  const [results, setResults] = useState<{
    em: { a: number, b: number },
    lys: { a: number, b: number }
  } | null>(null);

  const addFarm = () => {
    setFarms([...farms, { id: Date.now().toString(), dg: '', em: '', lys: '' }]);
  };

  const removeFarm = (id: string) => {
    if (farms.length <= 2) return;
    setFarms(farms.filter(f => f.id !== id));
  };

  const updateFarm = (id: string, field: keyof Omit<FarmData, 'id'>, value: string) => {
    setFarms(farms.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const calculateRegression = () => {
    const validFarms = farms.filter(f => f.dg && f.em && f.lys);
    if (validFarms.length < 2) {
      alert("الرجاء إدخال بيانات مزرعتين على الأقل.");
      return;
    }

    const dg = validFarms.map(f => parseFloat(f.dg));
    const em = validFarms.map(f => parseFloat(f.em));
    const lys = validFarms.map(f => parseFloat(f.lys));

    const emRegression = new SimpleLinearRegression(dg, em);
    const lysRegression = new SimpleLinearRegression(dg, lys);

    setResults({
      em: { a: emRegression.intercept, b: emRegression.slope },
      lys: { a: lysRegression.intercept, b: lysRegression.slope }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-600" />
              محرك الانحدار السوري (Regression Engine)
            </h2>
            <p className="text-gray-500">تحليل بيانات المزارع المتعددة لاشتقاق معادلات الاحتياجات المحلية.</p>
          </div>
          <button 
            onClick={calculateRegression}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Zap className="w-5 h-5" />
            حساب الثوابت السورية
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">المزرعة</th>
                <th className="px-6 py-4">النمو اليومي (DG g/d)</th>
                <th className="px-6 py-4">الطاقة المستخدمة (kcal/gain)</th>
                <th className="px-6 py-4">اللايسين المستخدم (SID Lys %)</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {farms.map((farm, index) => (
                <tr key={farm.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-400"># {index + 1}</td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={farm.dg}
                      onChange={(e) => updateFarm(farm.id, 'dg', e.target.value)}
                      placeholder="0.0"
                      className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={farm.em}
                      onChange={(e) => updateFarm(farm.id, 'em', e.target.value)}
                      placeholder="0.0"
                      className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={farm.lys}
                      onChange={(e) => updateFarm(farm.id, 'lys', e.target.value)}
                      placeholder="0.0"
                      className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => removeFarm(farm.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            onClick={addFarm}
            className="w-full py-4 bg-gray-50 text-gray-400 font-bold text-xs hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة بيانات مزرعة أخرى
          </button>
        </div>
      </div>

      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom duration-500">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Zap className="w-6 h-6 text-orange-500" />
                معادلة الطاقة السورية المستنبطة
              </h3>
              {onApply && (
                <button 
                  onClick={() => onApply(results)}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1 shadow-md shadow-green-100"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تطبيق الثوابت على المحرك
                </button>
              )}
            </div>
            <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 text-center">
              <p className="text-xl font-mono font-bold text-orange-700" dir="ltr">
                EM_req = {results.em.a.toFixed(4)} + {results.em.b.toFixed(6)} * DG
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">التقاطع (a_E)</p>
                <p className="text-lg font-bold font-mono">{results.em.a.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">الميل (b_E)</p>
                <p className="text-lg font-bold font-mono">{results.em.b.toFixed(6)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500" />
              معادلة اللايسين السورية المستنبطة
            </h3>
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-center">
              <p className="text-xl font-mono font-bold text-blue-700" dir="ltr">
                SID_Lys = {results.lys.a.toFixed(4)} + {results.lys.b.toFixed(6)} * DG
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">التقاطع (a_L)</p>
                <p className="text-lg font-bold font-mono">{results.lys.a.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">الميل (b_L)</p>
                <p className="text-lg font-bold font-mono">{results.lys.b.toFixed(6)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <LineChartIcon className="w-40 h-40" />
        </div>
        <div className="relative z-10 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
             <Calculator className="w-6 h-6" />
             ما هو محرك الانحدار؟
          </h3>
          <p className="text-sm leading-relaxed opacity-90 max-w-3xl">
            هذه الأداة مخصصة لك كخبير تغذية لضبط "النموذج الرياضي" ليوافق واقع مزارعك. من خلال إدخال بيانات الأداء الفعلي (DG) ومستويات العناصر التي حققت هذا الأداء، يقوم النظام بعمل تحليل انحدار خطي (Linear Regression) لاستخراج الثوابت الحقيقية (a, b) الخاصة بالبيئة السورية. يمكنك لاحقاً استخدام هذه الثوابت كمرجع دقيق في المحرك الرئيسي.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              تحليل البيانات الميدانية
            </div>
            <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              تخمين الاحتياجات المحلية
            </div>
            <div className="flex items-center gap-2 text-xs font-bold bg-white/20 px-4 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              تحسين دقة التوقعات
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegressionEngineTool;
