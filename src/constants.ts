import { Ingredient, PhaseRequirement, Nutrition, PerformanceStandard } from './types';

export const INITIAL_NUTRITION: Nutrition = {
  ME: 0, CP: 0, Ca: 0, avP: 0, Na: 0, Cl: 0,
  dLys: 0, dMet: 0, dThr: 0, dVal: 0, dIso: 0,
  dArg: 0, dGlySer: 0, dPhe: 0, dPheTyr: 0, choline: 0, K: 0,
  dTry: 0, dLeu: 0, dHis: 0
};

export const DEFAULT_INGREDIENTS_LIST: string[] = [
  "ذرة صفراء (7.5)",
  "كسبة فول الصويا (44)",
  "زيت نباتي",
  "الحجر الكلسي",
  "ديكالسيوم فوسفات",
  "ملح طعام",
  "سلفات الصوديوم",
  "بيكربونات الصوديوم",
  "اللايسين (78%)",
  "الميثيونين الصناعي",
  "الثريونين (L-Threonine)",
  "الفالين",
  "إيزوليوسين",
  "أرجنين",
  "الكولين (60%)",
  "مضاد فطري Mycofung",
  "مضاد سموم Champrix",
  "مضاد التهاب BMD",
  "مضاد التهاب GFlu",
  "مضاد كوكسيديا Robenidine",
  "مضاد كوكسيديا كلوبيدول",
  "البيتائين",
  "مستحلب LYSOFORTE",
  "بروبيوتك Ecobiol plus",
  "أنزيم بروتياز KEMZYME pro",
  "أنزيم الفيتاز Hiphos GT 20000",
  "أنزيم متعدد Natuzyme",
  "أنزيم ألياف Rovabio advance",
  "قشور رمان",
  "Aleta™",
  "بروبيونات صوديوم",
  "بروبيونات كالسيوم",
  "خميرة",
  "Creamino (GAA)",
  "Adimix (Butyrate)",
  "فيتامين/معادن (Premix)"
];

// Pre-fill some common values to make it easier to start
export const DEFAULT_INGREDIENTS: Ingredient[] = DEFAULT_INGREDIENTS_LIST.map((name, index) => {
  const nutrition = { ...INITIAL_NUTRITION };
  let price = 0.5; // Default price
  
  if (name.includes("ذرة")) {
    nutrition.ME = 3250; nutrition.CP = 7.5; nutrition.Ca = 0.01; nutrition.avP = 0.05;
    nutrition.Na = 0.003; nutrition.K = 0.3; nutrition.Cl = 0.09;
    nutrition.dLys = 0.20; nutrition.dMet = 0.25; nutrition.dThr = 0.28; 
    nutrition.dVal = 0.31; nutrition.dIso = 0.25; nutrition.dArg = 0.33;
    nutrition.dTry = 0.05; nutrition.dGlySer = 0.55; nutrition.dPhe = 0.30; nutrition.dPheTyr = 0.55;
    nutrition.choline = 600;
    price = 0.28;
  } else if (name.includes("صويا")) {
    nutrition.ME = 2250; nutrition.CP = 44; nutrition.Ca = 0.29; nutrition.avP = 0.3;
    nutrition.Na = 0.014; nutrition.K = 2.08; nutrition.Cl = 0.03;
    nutrition.dLys = 2.52; nutrition.dMet = 1.08; nutrition.dThr = 1.52; 
    nutrition.dVal = 1.87; nutrition.dIso = 1.79; nutrition.dArg = 3.0;
    nutrition.dTry = 0.55; nutrition.dGlySer = 3.72; nutrition.dPhe = 2.02; nutrition.dPheTyr = 3.47;
    nutrition.choline = 2600;
    price = 0.58;
  } else if (name.includes("زيت")) {
    nutrition.ME = 8800; price = 1.35;
  } else if (name.includes("اللايسين")) {
    nutrition.dLys = 74; price = 2.1;
  } else if (name.includes("الميثيونين")) {
    nutrition.dMet = 94; price = 3.6;
  } else if (name.includes("الثريونين")) {
    nutrition.dThr = 90; price = 2.7;
  } else if (name.includes("الفالين")) {
    nutrition.dVal = 96; price = 7;
  } else if (name.includes("إيزوليوسين")) {
    nutrition.dIso = 96; price = 7;
  } else if (name.includes("أرجنين")) {
    nutrition.dArg = 96; price = 9.25;
  } else if (name.includes("كلسي") || name.includes("نحاته")) {
    nutrition.Ca = 36; price = 0.04;
  } else if (name.includes("فوسفات")) {
    nutrition.Ca = 22; nutrition.avP = 16.5; price = 0.935;
  } else if (name.includes("ملح")) {
    nutrition.Na = 39.3; nutrition.Cl = 60.7; price = 0.1;
  } else if (name.includes("سلفات الصوديوم")) {
    nutrition.Na = 32; price = 0.9;
  } else if (name.includes("بيكربونات الصوديوم")) {
    nutrition.Na = 27; price = 0.75;
  } else if (name.includes("الكولين")) {
    nutrition.choline = 550000; // 55% choline content for 60% chloride product
    price = 1.2;
  } else if (name.includes("الفيتاز")) {
    nutrition.ME = 470000; nutrition.CP = 3000; nutrition.Ca = 1100;
    nutrition.avP = 900; nutrition.Na = 45; nutrition.dLys = 100;
    nutrition.dArg = 100; nutrition.dMet = 80; nutrition.dThr = 80;
    nutrition.dVal = 110; nutrition.dIso = 110;
    price = 25.0;
  } else if (name.includes("بروتياز")) {
    nutrition.ME = 100000; nutrition.CP = 3000; nutrition.Ca = 300;
    nutrition.avP = 400; nutrition.Na = 5; nutrition.dLys = 50;
    nutrition.dArg = 50; nutrition.dMet = 40; nutrition.dThr = 40;
    nutrition.dVal = 110; nutrition.dIso = 110;
    price = 7.0;
  } else if (name.includes("ألياف")) {
    nutrition.ME = 200000; nutrition.CP = 1000; nutrition.Ca = 200;
    nutrition.avP = 200; nutrition.Na = 5; nutrition.dLys = 30;
    nutrition.dArg = 30; nutrition.dMet = 20; nutrition.dThr = 20;
    nutrition.dVal = 110; nutrition.dIso = 110;
    price = 42.0;
  } else if (name.includes("مستحلب")) {
    nutrition.ME = 30000;
    price = 9.6;
  } else if (name.includes("Ecobiol")) {
    price = 9;
  } else if (name.includes("Natuzyme")) {
    nutrition.ME = 250000; nutrition.avP = 1500; nutrition.Ca = 1200;
    nutrition.dLys = 500;
    price = 9.2;
  } else if (name.includes("Mycofung")) {
    price = 2.25;
  } else if (name.includes("Champrix")) {
    price = 2;
  } else if (name.includes("BMD")) {
    price = 6.25;
  } else if (name.includes("GFlu")) {
    price = 11;
  } else if (name.includes("Robenidine")) {
    price = 40;
  } else if (name.includes("كلوبيدول")) {
    price = 15;
  } else if (name.includes("البيتائين")) {
    price = 3.5;
  } else if (name.includes("قشور رمان")) {
    price = 0.4;
  } else if (name.includes("بروبيونات صوديوم")) {
    price = 5;
  } else if (name.includes("بروبيونات كالسيوم")) {
    price = 5;
  } else if (name.includes("خميرة")) {
    price = 2.7;
  } else if (name.includes("Creamino") || name.includes("غواندينو")) {
    nutrition.ME = 80000; // Energy sparing effect
    price = 3.5;
  } else if (name.includes("Adimix") || name.includes("بوتيريك")) {
    nutrition.ME = 50000; // Matrix contribution
    price = 4.2;
  } else if (name.includes("أنزيم")) {
    // Sample matrix values for other enzymes
    nutrition.ME = 250000; nutrition.avP = 1500; nutrition.Ca = 1200;
    nutrition.dLys = 500;
    price = 15.0;
  }

  return {
    id: `ing-${index}`,
    name,
    nutrition,
    price
  };
});

export const ROSS_308_PHASES_3: PhaseRequirement[] = [
  {
    name: "Starter (مرحلة بادي)",
    days: "0–10 d",
    nutrition: {
      ME: 2975, CP: 23.0, Ca: 0.95, avP: 0.50, Na: 0.20, Cl: 0.20,
      dLys: 1.32, dMet: 1.00, dThr: 0.88, dVal: 1.00, dIso: 0.88, dArg: 1.40,
      dTry: 0.21, dLeu: 1.45, choline: 1700, K: 0.85, dGlySer: 0, dPhe: 0, dPheTyr: 0
    }
  },
  {
    name: "Grower (مرحلة نامي)",
    days: "11–24 d",
    nutrition: {
      ME: 3050, CP: 21.5, Ca: 0.75, avP: 0.42, Na: 0.20, Cl: 0.20,
      dLys: 1.18, dMet: 0.92, dThr: 0.79, dVal: 0.91, dIso: 0.80, dArg: 1.27,
      dTry: 0.19, dLeu: 1.30, choline: 1600, K: 0.80, dGlySer: 0, dPhe: 0, dPheTyr: 0
    }
  },
  {
    name: "Finisher (مرحلة ناهي)",
    days: "25–market",
    nutrition: {
      ME: 3100, CP: 19.5, Ca: 0.65, avP: 0.36, Na: 0.20, Cl: 0.20,
      dLys: 1.08, dMet: 0.86, dThr: 0.72, dVal: 0.84, dIso: 0.75, dArg: 1.17,
      dTry: 0.17, dLeu: 1.19, choline: 1500, K: 0.75, dGlySer: 0, dPhe: 0, dPheTyr: 0
    }
  }
];

export const ROSS_308_PHASES_4: PhaseRequirement[] = [
  {
    name: "Starter (مرحلة بادي)",
    days: "0–10 d",
    nutrition: {
      ME: 2975, CP: 23.0, Ca: 0.95, avP: 0.50, Na: 0.20, Cl: 0.20,
      dLys: 1.32, dMet: 1.00, dThr: 0.88, dVal: 1.00, dIso: 0.88, dArg: 1.40,
      dTry: 0.21, dLeu: 1.45, choline: 1700, K: 0.85, dGlySer: 0, dPhe: 0, dPheTyr: 0
    }
  },
  {
    name: "Grower (مرحلة نامي)",
    days: "11–24 d",
    nutrition: {
      ME: 3050, CP: 21.5, Ca: 0.75, avP: 0.42, Na: 0.20, Cl: 0.20,
      dLys: 1.18, dMet: 0.92, dThr: 0.79, dVal: 0.91, dIso: 0.80, dArg: 1.27,
      dTry: 0.19, dLeu: 1.30, choline: 1600, K: 0.80, dGlySer: 0, dPhe: 0, dPheTyr: 0
    }
  },
  {
    name: "Finisher 1 (مرحلة ناهي 1)",
    days: "25–39 d",
    nutrition: {
      ME: 3100, CP: 19.5, Ca: 0.65, avP: 0.36, Na: 0.20, Cl: 0.20,
      dLys: 1.08, dMet: 0.86, dThr: 0.72, dVal: 0.84, dIso: 0.75, dArg: 1.17,
      dTry: 0.17, dLeu: 1.19, choline: 1500, K: 0.75, dGlySer: 0, dPhe: 0, dPheTyr: 0
    }
  },
  {
    name: "Finisher 2 (مرحلة ناهي 2)",
    days: "40–market",
    nutrition: {
      ME: 3125, CP: 18.0, Ca: 0.60, avP: 0.34, Na: 0.20, Cl: 0.20,
      dLys: 1.02, dMet: 0.82, dThr: 0.68, dVal: 0.80, dIso: 0.70, dArg: 1.12,
      dTry: 0.16, dLeu: 1.12, choline: 1450, K: 0.70, dGlySer: 0, dPhe: 0, dPheTyr: 0
    }
  }
];

export const ROSS_308_PHASES_5: PhaseRequirement[] = [
  {
    name: "Starter (المرحلة 1)",
    days: "0–7 d",
    nutrition: {
      ME: 2930.24, CP: 23.38, Ca: 1.11, avP: 0.53, Na: 0.20, Cl: 0.19,
      dLys: 1.32, dMet: 0.96, dThr: 0.87, dTry: 0.24, dArg: 1.43,
      dGlySer: 1.94, dVal: 1.02, dIso: 0.88, dLeu: 1.41, dHis: 0.83,
      dPhe: 0.83, dPheTyr: 1.52, choline: 1700, K: 0.85
    }
  },
  {
    name: "Starter 2 (المرحلة 2)",
    days: "8–15 d",
    nutrition: {
      ME: 2970.13, CP: 23.04, Ca: 1.04, avP: 0.50, Na: 0.20, Cl: 0.19,
      dLys: 1.26, dMet: 0.92, dThr: 0.83, dTry: 0.23, dArg: 1.36,
      dGlySer: 1.85, dVal: 0.97, dIso: 0.84, dLeu: 1.35, dHis: 0.79,
      dPhe: 0.79, dPheTyr: 1.45, choline: 1600, K: 0.82
    }
  },
  {
    name: "Grower (المرحلة 3)",
    days: "16–27 d",
    nutrition: {
      ME: 3019.41, CP: 21.30, Ca: 0.81, avP: 0.39, Na: 0.19, Cl: 0.18,
      dLys: 1.19, dMet: 0.89, dThr: 0.79, dTry: 0.21, dArg: 1.27,
      dGlySer: 1.67, dVal: 0.92, dIso: 0.80, dLeu: 1.27, dHis: 0.75,
      dPhe: 0.75, dPheTyr: 1.37, choline: 1500, K: 0.78
    }
  },
  {
    name: "Finisher 1 (المرحلة 4)",
    days: "28–35 d",
    nutrition: {
      ME: 3076.09, CP: 20.62, Ca: 0.64, avP: 0.31, Na: 0.19, Cl: 0.17,
      dLys: 1.13, dMet: 0.87, dThr: 0.75, dTry: 0.22, dArg: 1.21,
      dGlySer: 1.58, dVal: 0.87, dIso: 0.76, dLeu: 1.21, dHis: 0.71,
      dPhe: 0.71, dPheTyr: 1.32, choline: 1450, K: 0.75
    }
  },
  {
    name: "Finisher 2 (المرحلة 5)",
    days: "36–42 d",
    nutrition: {
      ME: 3120.00, CP: 19.93, Ca: 0.60, avP: 0.28, Na: 0.19, Cl: 0.17,
      dLys: 1.10, dMet: 0.86, dThr: 0.73, dTry: 0.20, dArg: 1.16,
      dGlySer: 1.49, dVal: 0.85, dIso: 0.75, dLeu: 1.19, dHis: 0.69,
      dPhe: 0.69, dPheTyr: 1.27, choline: 1450, K: 0.75
    }
  }
];

export interface AdditiveInfo {
  name: string;
  brand?: string;
  product?: string;
  category: string;
  importance: string;
  benefits: string[];
  recommendation?: string;
}

export const TOP_ADDITIVES: AdditiveInfo[] = [
  // --- أولاً: الإنزيمات (Enzymes) ---
  {
    name: "مجموعة إنزيمات RONOZYME®",
    brand: "DSM",
    product: "RONOZYME®",
    category: "الإنزيمات (Enzymes)",
    importance: "من أقوى الإنزيمات عالمياً (Phytase – Xylanase – Protease). DSM مصنّفة ضمن الشركات الأولى عالمياً في إنزيمات الدواجن.",
    benefits: [
      "فعالية مثبتة علمياً في تحسين الهضم.",
      "رفع معامل التحويل الغذائي بشكل ملحوظ.",
      "تغطية واسعة لمختلف أنواع المواد العلفية."
    ]
  },
  {
    name: "فيتاز عالي الفعالية (Natuphos®)",
    brand: "BASF",
    product: "Natuphos®",
    category: "الإنزيمات (Enzymes)",
    importance: "فيتاز عالي الفعالية وثابت حرارياً، مناسب جداً للخلطات التي تتعرض للتحبب (Pelleting).",
    benefits: [
      "ثباتية حرارية ممتازة.",
      " BASF من الشركات الرائدة في الإنزيمات والفيتامينات.",
      "تحرير أقصى قدر من الفوسفور النباتي."
    ]
  },
  {
    name: "محفظة إنزيمات Novozymes",
    brand: "Novozymes",
    product: "Enzyme Portfolio",
    category: "الإنزيمات (Enzymes)",
    importance: "إنزيمات متخصصة لتحسين هضم الألياف والبروتين من أكبر شركة إنزيمات حيوية عالمياً.",
    benefits: [
      "تحسين هضم الألياف المعقدة.",
      "زيادة إتاحة البروتين للطائر.",
      "تقليل لزوجة الأمعاء الناتجة عن الحبوب."
    ]
  },

  // --- ثانياً: الفيتامينات (Vitamins) ---
  {
    name: "فيتامينات Hy-D® و Rovimix®",
    brand: "DSM",
    product: "Hy-D® / Rovimix®",
    category: "الفيتامينات (Vitamins)",
    importance: "أعلى ثباتية وجودة في السوق. DSM تُعدّ الشركة الأولى عالمياً في فيتامينات الدواجن.",
    benefits: [
      "ثباتية ممتازة أثناء التصنيع والتخزين.",
      "أقصى درجات النقاوة والفاعلية الحيوية.",
      "دعم كامل للجهاز المناعي والهيكلي."
    ]
  },
  {
    name: "مجموعة Lucantin® والفيتامينات",
    brand: "BASF",
    product: "Lucantin®",
    category: "الفيتامينات (Vitamins)",
    importance: "فيتامينات وكاروتينات عالية النقاوة وثباتية ممتازة من شركة رائدة عالمياً.",
    benefits: [
      "جودة تصنيع ألمانية صارمة.",
      "ثباتية عالية للفيتامينات الحساسة.",
      "نتائج إنتاجية متفوقة."
    ]
  },

  // --- ثالثاً: الأحماض الأمينية (Amino Acids) ---
  {
    name: "الميثيونين الذهبي (MetAMINO®)",
    brand: "Evonik",
    product: "MetAMINO®",
    category: "الأحماض الأمينية (Amino Acids)",
    importance: "المعيار الذهبي عالمياً للميثيونين (DL-Methionine). Evonik من الشركات الأولى عالمياً في هذا المجال.",
    benefits: [
      "نقاوة تصل إلى 99%.",
      "دقة عالية في تعويض نقص البروتين.",
      "فعالية تمثيل غذائي قصوى."
    ]
  },
  {
    name: "الأحماض الأمينية النقية (AjiPro®)",
    brand: "Ajinomoto",
    product: "AjiPro®",
    category: "الأحماض الأمينية (Amino Acids)",
    importance: "أعلى نقاوة وثباتية في أحماض اللايسين والثريونين من شركة يابانية رائدة.",
    benefits: [
      "تكنولوجيا تخمير متطورة.",
      "سهولة فائقة في الامتصاص المعوي.",
      "مثالي للتركيبات عالية الدقة."
    ]
  },
  {
    name: "مجموعة الأحماض الأمينية CJ Bio",
    brand: "CJ Bio",
    product: "L-Lysine / L-Threonine / L-Valine",
    category: "الأحماض الأمينية (Amino Acids)",
    importance: "منتجات عالية الجودة ومستخدمة على نطاق واسع عالمياً في كبرى مزارع الدواجن.",
    benefits: [
      "جودة ثابتة وموثوقة.",
      "تغطية كاملة للاحتياجات الأساسية.",
      "كفاءة عالية في بناء العضلات."
    ]
  },

  // --- رابعاً: البروبيوتيك (Probiotics) ---
  {
    name: "البروبيوتيك متعدد السلالات (GalliPro®)",
    brand: "Chr. Hansen",
    product: "GalliPro®",
    category: "البروبيوتيك (Probiotics)",
    importance: "من أقوى البروبيوتيك عالمياً من شركة رائدة في الميكروبيولوجيا الغذائية.",
    benefits: [
      "تعدد السلالات يضمن تغطية معوية شاملة.",
      "مقاومة طبيعية للمسببات المرضية.",
      "تحسين ملحوظ في الصحة العامة للقطيع."
    ]
  },
  {
    name: "البروبيوتيك المتخصص (Enviva®)",
    brand: "DuPont (IFF)",
    product: "Enviva®",
    category: "البروبيوتيك (Probiotics)",
    importance: "بروبيوتيك متخصص للدواجن من إحدى كبرى شركات إضافات الأعلاف عالمياً.",
    benefits: [
      "مصمم خصيصاً للتحديات المعوية في الدواجن.",
      "دعم قوي لنمو الزغابات المعوية.",
      "تقليل استهلاك المضادات الحيوية."
    ]
  },
  {
    name: "الخمائر والبروبيوتيك (Actigen® / Yea-Sacc®)",
    brand: "Alltech",
    product: "Actigen® / Yea-Sacc®",
    category: "البروبيوتيك (Probiotics)",
    importance: "خمائر وبروبيوتيك عالية الفعالية لتعزيز الهضم والمناعة.",
    benefits: [
      "تموز بآلية ربط الميكروبات الضارة.",
      "تنشيط البكتيريا النافعة الطبيعية.",
      "تحسين الاستفادة من العليقة في ظروف الإجهاد."
    ]
  },

  // --- خامساً: منشطات الكبد (Liver Stimulants) ---
  {
    name: "أفضل مصدر بيتائين (Betafin®)",
    brand: "Adisseo",
    product: "Betafin®",
    category: "منشطات الكبد",
    importance: "أفضل مصدر بيتائين عالمياً من شركة رائدة. ضروري جداً في ظروف الإجهاد الحراري.",
    benefits: [
      "دعم جبار للكبد في ظروف 'الصويا الرديئة'.",
      "تقليل تأثير الإجهاد الحراري على الطيور.",
      "تحسين استقلاب الطاقة والدهون."
    ],
    recommendation: "خياري الأول لمزارعنا في المناطق الحارة."
  },
  {
    name: "أفضل كولين محمي (CholiPEARL™)",
    brand: "Kemin",
    product: "CholiPEARL™",
    category: "منشطات الكبد",
    importance: "أفضل كولين محمي في العالم، يضمن وصول المادة الفعالة للكبد دون تأكسد.",
    benefits: [
      "حماية كاملة من التأكسد في العلف.",
      "يصل للأمعاء الدقيقة للامتصاص الفعلي.",
      "يمنع متلازمة الكبد الدهني بكفاءة."
    ]
  },
  {
    name: "منتج الكبد المتكامل (BetaPlus®)",
    brand: "Vetagro",
    product: "BetaPlus®",
    category: "منشطات الكبد",
    importance: "يجمع بين البيتائين والسوربيتول والأعشاب لتحسين وظائف الكبد والصفراء.",
    benefits: [
      "تنشيط مزدوج للهضم والحماية.",
      "تحسين هضم الزيوت والدهون.",
      "مدر للوظيفية الصفراوية بشكل طبيعي."
    ]
  },
  {
    name: "حماية الكبد العشبية (HepaPro®)",
    brand: "Phytobiotics",
    product: "HepaPro®",
    category: "منشطات الكبد",
    importance: "منتج عشبي قوي يحتوي على السيليمارين والخرشوف لحماية خلايا الكبد.",
    benefits: [
      "تجديد خلايا الكبد التالفة.",
      "تحييد أثر السموم الكيميائية والفطرية.",
      "مثالي في حالات العدوى الفيروسية التي تضرب الكبد."
    ]
  },

  // --- سادساً: مضادات الأكسدة (Antioxidants) ---
  {
    name: "مضادات الأكسدة القوية (Santoquin®)",
    brand: "Kemin",
    product: "Santoquin®",
    category: "مضادات الأكسدة",
    importance: "من أقوى مضادات الأكسدة والسيلينيوم عالمياً لحماية مكونات العلف.",
    benefits: [
      "منع تزنخ الزيوت والدهون.",
      "حماية الفيتامينات الحساسة من الأكسدة.",
      "إطالة عمر تخزين العلف."
    ]
  },
  {
    name: "السيلينيوم العضوي (Sel-Plex®)",
    brand: "Alltech",
    product: "Sel-Plex®",
    category: "مضادات الأكسدة",
    importance: "سيلينيوم عضوي عالي الامتصاص لدعم الجهاز المناعي وجودة اللحم.",
    benefits: [
      "امتصاص أسرع وأفضل من السيلينيوم غير العضوي.",
      "دعم خصوبة الأمهات في قطعان التسميد.",
      "تقليل الفاقد أثناء الذبح (Drip loss)."
    ]
  },

  // --- سابعاً: مضادات السموم الفطرية (Mycotoxin Binders) ---
  {
    name: "مضاد السموم المتكامل (Mycofix®)",
    brand: "Biomin (DSM)",
    product: "Mycofix®",
    category: "مضادات السموم الفطرية",
    importance: "الرائد عالمياً في مكافحة السموم الفطرية باستخدام تقنية تعطيل الإنزيمات.",
    benefits: [
      "تعطيل السموم الفطرية التي لا يمكن ربطها (مثل DON, ZON).",
      "حماية الكبد والجهاز الهضمي من الالتهابات.",
      "تعزيز الجهاز المناعي لمواجهة التحديات الميدانية."
    ],
    recommendation: "أقوى حل تقني متاح عالمياً لمواجهة السموم الفطرية."
  },

  // --- الحادي عشر: المستحلبات الغذائية (Emulsifiers) ---
  {
    name: "المستحلب الغذائي (Lysoforte®)",
    brand: "Kemin",
    product: "Lysoforte®",
    category: "المستحلبات الغذائية (Emulsifiers)",
    importance: "مستحلب طبيعي يعتمد على الليزولسيثين لتحسين هضم وامتصاص الدهون الزيتية.",
    benefits: [
      "زيادة الاستفادة من طاقة الزيوت والدهون المضافة.",
      "تحسين معامل التحويل الغذائي (FCR).",
      "دعم امتصاص الفيتامينات الذائبة في الدهون.",
      "توفير في تكلفة العليقة بتقليل مستويات الزيت المضافة."
    ],
    recommendation: "ضروري عند استخدام نسب زيت عالية في العليقة."
  },

  // --- الثاني عشر: ميغا إنزيمات (Multi-Enzymes) ---
  {
    name: "مجموعة إنزيمات Rovabio®",
    brand: "Adisseo",
    product: "Rovabio® Advance",
    category: "الإنزيمات (Enzymes)",
    importance: "إنزيم NSP متكامل يعمل على تحسين هضم المواد العلفية النباتية المعقدة (الصويا، الذرة، القمح).",
    benefits: [
      "تحسين إتاحة الطاقة والأحماض الأمينية.",
      "تقليل لزوجة الأمعاء الناتجة عن الحبوب.",
      "مرونة عالية في استخدام مكونات علفية متنوعة."
    ]
  },
  {
    name: "الإنزيم الشامل (Natuzyme®)",
    brand: "Bioproton",
    product: "Natuzyme®",
    category: "الإنزيمات (Enzymes)",
    importance: "مركب إنزيمي متعدد (Multi-enzyme) يحتوي على طيف واسع من الإنزيمات الهاضمة.",
    benefits: [
      "يحتوي على Phytase, Cellulase, Xylanase, Protease.",
      "فعالية مثبتة في الخلطات التي تعتمد على الذرة والصويا.",
      "زيادة معدلات النمو اليومية للطيور."
    ]
  },

  // --- الثالث عشر: التمثيل الغذائي والطاقة (Metabolism & Energy) ---
  {
    name: "غواندينو اسيتيك اسيد (Creamino®)",
    brand: "Evonik",
    product: "Creamino®",
    category: "التمثيل الغذائي والطاقة",
    importance: "المصدر الوحيد للكرياتين (Creatine) الذي يحسن بشكل مباشر من كفاءة تحميل الطاقة داخل العضلات.",
    benefits: [
      "تحسين نمو عضلات الصدر بشكل ملحوظ.",
      "توفير الطاقة اللازمة لعمليات التمثيل الغذائي السريع.",
      "دعم أداء الطائر في فترات النمو المتسارع.",
      "بديل تقني لتعويض نقص البروتينات الحيوانية."
    ],
    recommendation: "ثورة في تكنولوجيا كفاءة الطاقة العضلية."
  },

  // --- الرابع عشر: الصحة المعوية المتطورة (Advanced Gut Health) ---
  {
    name: "حمض البوتيريك المحمي (Adimix® / Novyrate®)",
    brand: "Adisseo / Innovad",
    product: "Adimix® / Novyrate®",
    category: "الامتصاص وسلامة الأمعاء",
    importance: "حمض بوتيريك (Z-Butyrate) يصل للأمعاء الخلفية لدعم الزغابات المعوية.",
    benefits: [
      "زيادة طول وقوة الزغابات المعوية (Villi).",
      "تسريع التئام جدار الأمعاء بعد الإصابة بالكوكسيديا.",
      "تحسين الامتصاص الغذائي العام."
    ]
  },
  {
    name: "رابط السموم العضوي (Mycosorb®)",
    brand: "Alltech",
    product: "Mycosorb®",
    category: "مضادات السموم الفطرية",
    importance: "يعتمد على تكنولوجيا الـ Glucan المستخلص من جدران الخميرة لربط نطاق واسع من السموم.",
    benefits: [
      "فعالية عالية بجرعات منخفضة جداً.",
      "لا يربط الفيتامينات أو المعادن الضرورية.",
      "ثقيل الوزن الجزيئي مما يمنع إعادة امتصاص السموم."
    ]
  },

  // --- ثامناً: المحمضات (Acidifiers) ---
  {
    name: "مجموعة ProPhorce™",
    brand: "Perstorp",
    product: "ProPhorce™",
    category: "المحمضات (Acidifiers)",
    importance: "أحماض عضوية (فورميك وبروبيونيك) مع تقنيات تقليل الرائحة والتآكل.",
    benefits: [
      "تقليل الحمل البكتيري (السالمونيلا) في العلف.",
      "خفض pH المعدة لتحسين هضم البروتين.",
      "منع نمو الفطريات في العلف المخزن."
    ]
  },
  {
    name: "محمض مياه الشرب (Selko-pH®)",
    brand: "Selko (Trouw Nutrition)",
    product: "Selko-pH®",
    category: "المحمضات (Acidifiers)",
    importance: "مزيج تآزري من الأحماض العضوية مخصص لمياه الشرب لتحسين صحة الأمعاء.",
    benefits: [
      "تعقيم خطوط المياه من البيوفيلم (Biofilm).",
      "دعم الهضم السريع في الكتاكيت الصغيرة.",
      "تحسين استهلاك المياه في الأجواء الحارة."
    ]
  },

  // --- تاسعاً: المستخلصات النباتية (Phytogenics) ---
  {
    name: "محفز النمو العشبي (Biostrong® 510)",
    brand: "Delacon",
    product: "Biostrong® 510",
    category: "المستخلصات النباتية",
    importance: "منتج نباتي بالكامل يعزز من إفراز الإنزيمات الهاضمة ويحسن معامل التحويل.",
    benefits: [
      "زيادة إفراز اللعاب والأنزيمات المعوية.",
      "تقليل انبعاثات الأمونيا في الحظيرة.",
      "بديل طبيعي قوي ومستدام للمضادات الحيوية."
    ]
  },

  // --- عاشراً: الملونات (Pigments) ---
  {
    name: "مجموعة Carophyll®",
    brand: "DSM",
    product: "Carophyll® Red/Yellow",
    category: "الملونات (Pigments)",
    importance: "المعيار العالمي لتلوين صفار البيض وجلد الدواجن باستخدام الكاروتينيدات.",
    benefits: [
      "لون ثابت ومتجانس يطلبه المستهلك.",
      "ثباتية ممتازة ضد الحرارة والأكسدة.",
      "مصدر إضافي لمضادات الأكسدة للطائر."
    ]
  }
];

export const TOP_COMPANIES = [
  "DSM", "BASF", "Evonik", "Adisseo", "Novozymes", "DuPont", 
  "Alltech", "Kemin", "Cargill", "ADM", "Nutreco", "Chr. Hansen"
];

export const ROSS_308_PERFORMANCE_DATA: PerformanceStandard[] = [
  { day: 0, weight: 44, dailyGain: 0, dailyIntake: 0, cumIntake: 0, fcr: 0 },
  { day: 1, weight: 62, dailyGain: 18, dailyIntake: 12, cumIntake: 12, fcr: 0.196 },
  { day: 2, weight: 81, dailyGain: 19, dailyIntake: 16, cumIntake: 28, fcr: 0.352 },
  { day: 3, weight: 102, dailyGain: 21, dailyIntake: 20, cumIntake: 48, fcr: 0.476 },
  { day: 4, weight: 125, dailyGain: 23, dailyIntake: 24, cumIntake: 72, fcr: 0.577 },
  { day: 5, weight: 151, dailyGain: 26, dailyIntake: 27, cumIntake: 100, fcr: 0.658 },
  { day: 6, weight: 181, dailyGain: 29, dailyIntake: 31, cumIntake: 131, fcr: 0.724 },
  { day: 7, weight: 213, dailyGain: 32, dailyIntake: 35, cumIntake: 166, fcr: 0.780 },
  { day: 8, weight: 249, dailyGain: 36, dailyIntake: 39, cumIntake: 206, fcr: 0.826 },
  { day: 9, weight: 288, dailyGain: 39, dailyIntake: 44, cumIntake: 249, fcr: 0.865 },
  { day: 10, weight: 330, dailyGain: 42, dailyIntake: 48, cumIntake: 297, fcr: 0.900 },
  { day: 11, weight: 376, dailyGain: 46, dailyIntake: 52, cumIntake: 349, fcr: 0.930 },
  { day: 12, weight: 425, dailyGain: 49, dailyIntake: 57, cumIntake: 406, fcr: 0.957 },
  { day: 13, weight: 477, dailyGain: 52, dailyIntake: 62, cumIntake: 468, fcr: 0.982 },
  { day: 14, weight: 533, dailyGain: 56, dailyIntake: 67, cumIntake: 535, fcr: 1.005 },
  { day: 15, weight: 592, dailyGain: 59, dailyIntake: 72, cumIntake: 608, fcr: 1.026 },
  { day: 16, weight: 655, dailyGain: 62, dailyIntake: 77, cumIntake: 685, fcr: 1.047 },
  { day: 17, weight: 720, dailyGain: 66, dailyIntake: 83, cumIntake: 768, fcr: 1.066 },
  { day: 18, weight: 789, dailyGain: 69, dailyIntake: 88, cumIntake: 856, fcr: 1.086 },
  { day: 19, weight: 860, dailyGain: 72, dailyIntake: 94, cumIntake: 950, fcr: 1.105 },
  { day: 20, weight: 935, dailyGain: 74, dailyIntake: 100, cumIntake: 1050, fcr: 1.123 },
  { day: 21, weight: 1012, dailyGain: 77, dailyIntake: 105, cumIntake: 1155, fcr: 1.142 },
  { day: 22, weight: 1092, dailyGain: 80, dailyIntake: 111, cumIntake: 1266, fcr: 1.160 },
  { day: 23, weight: 1174, dailyGain: 82, dailyIntake: 117, cumIntake: 1383, fcr: 1.178 },
  { day: 24, weight: 1258, dailyGain: 85, dailyIntake: 122, cumIntake: 1505, fcr: 1.196 },
  { day: 25, weight: 1345, dailyGain: 87, dailyIntake: 128, cumIntake: 1633, fcr: 1.214 },
  { day: 26, weight: 1434, dailyGain: 89, dailyIntake: 134, cumIntake: 1767, fcr: 1.233 },
  { day: 27, weight: 1524, dailyGain: 91, dailyIntake: 139, cumIntake: 1907, fcr: 1.251 },
  { day: 28, weight: 1616, dailyGain: 92, dailyIntake: 145, cumIntake: 2051, fcr: 1.269 },
  { day: 29, weight: 1710, dailyGain: 94, dailyIntake: 150, cumIntake: 2202, fcr: 1.288 },
  { day: 30, weight: 1805, dailyGain: 95, dailyIntake: 156, cumIntake: 2357, fcr: 1.306 },
  { day: 31, weight: 1901, dailyGain: 96, dailyIntake: 161, cumIntake: 2518, fcr: 1.325 },
  { day: 32, weight: 1999, dailyGain: 97, dailyIntake: 166, cumIntake: 2684, fcr: 1.343 },
  { day: 33, weight: 2097, dailyGain: 98, dailyIntake: 171, cumIntake: 2855, fcr: 1.362 },
  { day: 34, weight: 2196, dailyGain: 99, dailyIntake: 176, cumIntake: 3031, fcr: 1.381 },
  { day: 35, weight: 2296, dailyGain: 100, dailyIntake: 180, cumIntake: 3211, fcr: 1.399 },
  { day: 36, weight: 2396, dailyGain: 100, dailyIntake: 185, cumIntake: 3396, fcr: 1.418 },
  { day: 37, weight: 2496, dailyGain: 100, dailyIntake: 189, cumIntake: 3584, fcr: 1.437 },
  { day: 38, weight: 2597, dailyGain: 101, dailyIntake: 193, cumIntake: 3777, fcr: 1.456 },
  { day: 39, weight: 2697, dailyGain: 101, dailyIntake: 197, cumIntake: 3974, fcr: 1.474 },
  { day: 40, weight: 2798, dailyGain: 100, dailyIntake: 201, cumIntake: 4175, fcr: 1.493 },
  { day: 41, weight: 2898, dailyGain: 100, dailyIntake: 204, cumIntake: 4379, fcr: 1.512 },
  { day: 42, weight: 2998, dailyGain: 100, dailyIntake: 207, cumIntake: 4586, fcr: 1.531 },
  { day: 43, weight: 3097, dailyGain: 100, dailyIntake: 211, cumIntake: 4797, fcr: 1.550 },
  { day: 44, weight: 3197, dailyGain: 99, dailyIntake: 213, cumIntake: 5010, fcr: 1.569 },
  { day: 45, weight: 3295, dailyGain: 98, dailyIntake: 216, cumIntake: 5226, fcr: 1.587 }
];
