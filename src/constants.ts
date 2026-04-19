import { Ingredient, PhaseRequirement, Nutrition } from './types';

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
    nutrition.dLys = 74; price = 2.15;
  } else if (name.includes("الميثيونين")) {
    nutrition.dMet = 94; price = 3.40;
  } else if (name.includes("الثريونين")) {
    nutrition.dThr = 90; price = 2.25;
  } else if (name.includes("الفالين")) {
    nutrition.dVal = 96; price = 4.5;
  } else if (name.includes("إيزوليوسين")) {
    nutrition.dIso = 96; price = 5.0;
  } else if (name.includes("أرجنين")) {
    nutrition.dArg = 96; price = 6.0;
  } else if (name.includes("كلسي") || name.includes("نحاته")) {
    nutrition.Ca = 36; price = 0.06;
  } else if (name.includes("فوسفات")) {
    nutrition.Ca = 22; nutrition.avP = 16.5; price = 0.95;
  } else if (name.includes("سلفات الصوديوم")) {
    nutrition.Na = 32; price = 0.45;
  } else if (name.includes("بيكربونات الصوديوم")) {
    nutrition.Na = 27; price = 0.55;
  } else if (name.includes("الكولين")) {
    nutrition.choline = 550000; // 55% choline content for 60% chloride product
    price = 1.25;
  } else if (name.includes("أنزيم")) {
    // Sample matrix values for 1kg of Enzyme
    // If inclusion is 0.01% (0.0001 ratio), these values contribute significantly
    nutrition.ME = 250000; // 25 kcal contribution at 0.01%
    nutrition.avP = 1500;   // 0.15% avP contribution at 0.01%
    nutrition.Ca = 1200;    // 0.12% Ca contribution at 0.01%
    nutrition.dLys = 500;   // 0.05% Lys contribution at 0.01%
    price = 15.0; // Enzymes are expensive per kg
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
