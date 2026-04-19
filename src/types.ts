export interface Nutrition {
  ME: number;
  CP: number;
  Ca: number;
  avP: number;
  Na: number;
  Cl: number;
  dLys: number;
  dMet: number; // Will be used for d(M+C) in results if needed
  dThr: number;
  dVal: number;
  dIso: number;
  dArg: number;
  dGlySer: number;
  dPhe: number;
  dPheTyr: number;
  choline: number;
  K: number;
  dTry?: number; // Optional as not in all requested tables but in requirements list
  dLeu?: number;
  dHis?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  nutrition: Nutrition;
  price: number; // USD per kg
}

export interface PhaseRequirement {
  name: string;
  days: string;
  nutrition: Nutrition;
}

export interface FeedEntry {
  ingredientId: string;
  percentage: number;
}
