export interface Nutrition {
  [key: string]: any;
  ME: any;
  CP: any;
  Ca: any;
  avP: any;
  Na: any;
  Cl: any;
  dLys: any;
  dMet: any;
  dThr: any;
  dVal: any;
  dIso: any;
  dArg: any;
  dGlySer: any;
  dPhe: any;
  dPheTyr: any;
  choline: any;
  K: any;
}

export interface Ingredient {
  id: string;
  name: string;
  nutrition: Nutrition;
  price: any;
}

export interface PhaseRequirement {
  name: string;
  days: string;
  nutrition: Nutrition;
}

export interface FeedEntry {
  ingredientId: string;
  percentage: any;
}

export interface Snapshot {
  id: string;
  name: string;
  mixture: FeedEntry[];
  actualNutrition: Nutrition;
  totalCost: number;
  timestamp: string;
}

export interface PerformanceStandard {
  day: number;
  weight: number;      // g
  dailyGain: number;   // g
  dailyIntake: number; // g
  cumIntake: number;   // g
  fcr: number;
}
