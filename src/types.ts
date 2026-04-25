export interface Nutrition {
  [key: string]: any;
  ME: any;
  CP: any;
  Ca: any;
  avP: any;
  Na: any;
  Cl: any;
  dLys: any;
  dMet?: any;
  dThr: any;
  dVal: any;
  dIso: any;
  dArg: any;
  dGlySer: any;
  dPhe: any;
  dPheTyr: any;
  choline: any;
  K: any;
  DM?: any;
  dTry?: any;
  dLeu?: any;
  dHis?: any;
  dMetCys?: any;
  EE?: any;
  Fiber?: any;
  Starch?: any;
  ADF?: any;
  NDF?: any;
  TotalP?: any;
  NetEnergy?: any;
  Linoleic?: any;
  Linolenic?: any;
  PhytateP?: any;
  dAla?: any;
  dCys?: any;
  dTyr?: any;
  dGly?: any;
  dSer?: any;
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

export type Sex = 'male' | 'female' | 'mixed';

export interface PerformanceStandard {
  day: number;
  weight: number;      // g
  dailyGain: number;   // g
  dailyIntake: number; // g
  cumIntake: number;   // g
  fcr: number;
}
