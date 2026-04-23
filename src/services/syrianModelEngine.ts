/**
 * Syrian Broiler Model Engine - Functions Version
 * Strictly follows the functional architecture for poultry nutrition calculation.
 */

import { Nutrition, Sex } from '../types';

export interface ModelSettings {
  sex: Sex;
  performanceFactor: number; // 0.90 - 1.00
  temperature: number;      // 0 - 45
  humidity: number;         // 0 - 100
  heatCorrection: boolean;
  cornType: 'Syrian' | 'Ukrainian';
  soyType: 'Soy44' | 'Soy46';
}

export interface ModelOutput {
  phase: number;
  ageRange: string;
  temperature: number;
  performanceFactor: number;
  nutrition: Nutrition;
}

// Reference Data (Approximated from Rostagno 2017/2021)
// These represent DAILY averages for the bird during that specific phase.
const BRAZILIAN_REF = {
  male: [
    { start: 1, end: 7, dLys_g: 0.22, em_kcal: 50, ca_g: 0.18, p_g: 0.09, fi_tn: 22 }, // daily avg
    { start: 8, end: 15, dLys_g: 0.72, em_kcal: 185, ca_g: 0.58, p_g: 0.28, fi_tn: 68 },
    { start: 16, end: 27, dLys_g: 1.45, em_kcal: 420, ca_g: 1.25, p_g: 0.60, fi_tn: 135 },
    { start: 28, end: 35, dLys_g: 1.95, em_kcal: 620, ca_g: 1.75, p_g: 0.85, fi_tn: 195 },
    { start: 36, end: 45, dLys_g: 2.15, em_kcal: 750, ca_g: 2.10, p_g: 0.95, fi_tn: 245 }
  ],
  female: [
    { start: 1, end: 7, dLys_g: 0.21, em_kcal: 48, ca_g: 0.17, p_g: 0.085, fi_tn: 21 },
    { start: 8, end: 15, dLys_g: 0.68, em_kcal: 175, ca_g: 0.55, p_g: 0.26, fi_tn: 65 },
    { start: 16, end: 27, dLys_g: 1.35, em_kcal: 400, ca_g: 1.15, p_g: 0.55, fi_tn: 128 },
    { start: 28, end: 35, dLys_g: 1.82, em_kcal: 580, ca_g: 1.62, p_g: 0.78, fi_tn: 184 },
    { start: 36, end: 45, dLys_g: 2.05, em_kcal: 710, ca_g: 1.95, p_g: 0.88, fi_tn: 235 }
  ]
};

// AA:Lys Ratios (Tabela 2.20)
const AA_RATIOS = {
  dMet: 0.38,
  dMetCys: 0.72,
  dThr: 0.65,
  dVal: 0.77,
  dIso: 0.67,
  dArg: 1.05,
  dTrp: 0.16,
  dGlySer: 0.95,
  dPheTyr: 1.15,
  dPhe: 0.52
};

export class SyrianBroilerEngine {
  
  // 0. Function: Heat Index Calculation (Poultry specific comfort index)
  public static calculateHeatIndex(T: number, H: number): number {
    if (T < 15) return T; // No moisture impact at low temp
    return T + (H / 100) * (T - 14.5);
  }

  // 1. Function: Heat-Corrected Feed Intake
  private static get_FI_corr(FI_TN: number, Temperature_C: number, Heat_Correction_ON: boolean, Humidity: number = 50): number {
    if (Heat_Correction_ON === false) return FI_TN;
    const hi = this.calculateHeatIndex(Temperature_C, Humidity);
    if (hi < 29) return FI_TN;
    // Feed intake drops by ~1.5% for every degree of HI above 23
    return FI_TN * (1 - 0.015 * (hi - 23));
  }

  // 2. Function: Energy (EM%) Calculation
  private static get_EM_percent(EM_req: number, FI_corr: number): number {
    return (EM_req / FI_corr) * 1000; // Base Energy kcal/kg
  }

  // New: Function: Get EM Natural Phase Base Targets
  private static get_EM_PhaseBaseTarget(phase: number): number {
    switch (phase) {
      case 1: return 2925;
      case 2: return 3000;
      case 3: return 3050;
      case 4: return 3100;
      case 5: return 3150;
      case 6: return 3180; // Extended for late finisher
      default: return phase > 6 ? 3180 : 3050;
    }
  }

  // New: Function: Get EM Phase Target with Heat Adjustment
  private static get_EM_PhaseTarget(phase: number, temp: number, heatCorr: boolean, humidity: number = 50): number {
    const base = this.get_EM_PhaseBaseTarget(phase);
    const hi = this.calculateHeatIndex(temp, humidity);
    if (heatCorr === true || hi >= 30) {
      return base + 25;
    }
    return base;
  }

  // New: Function: Blend EM with FI Logic (Alpha = 0.4)
  private static blend_EM_with_FI(phase: number, temp: number, heatCorr: boolean, EM_raw: number, humidity: number = 50): number {
    const target = this.get_EM_PhaseTarget(phase, temp, heatCorr, humidity);
    const alpha = 0.4;
    
    // Blend logic: EM_blended = EM_target + alpha * (EM_raw - EM_target)
    let blended = target + alpha * (EM_raw - target);

    const min = target - 50;
    const max = target + 50;

    if (blended < min) return min;
    if (blended > max) return max;
    return blended;
  }

  // New: Function: Get AA Phase Base Targets (Brazilian style table)
  private static get_AA_PhaseBaseTargets(phase: number) {
    switch (phase) {
      case 1:
        return {
          dLys: 1.34, dMet: 0.54, dMC: 0.98, dThr: 0.88, dTrp: 0.24,
          dArg: 1.45, dGlySer: 1.97, dVal: 1.03, dIle: 0.90, dLeu: 1.43
        };
      case 2:
        return {
          dLys: 1.30, dMet: 0.52, dMC: 0.95, dThr: 0.86, dTrp: 0.23,
          dArg: 1.40, dGlySer: 1.91, dVal: 1.00, dIle: 0.87, dLeu: 1.39
        };
      case 3:
        return {
          dLys: 1.25, dMet: 0.53, dMC: 0.96, dThr: 0.83, dTrp: 0.23,
          dArg: 1.34, dGlySer: 1.75, dVal: 0.96, dIle: 0.84, dLeu: 1.34
        };
      case 4:
        return {
          dLys: 1.20, dMet: 0.50, dMC: 0.92, dThr: 0.79, dTrp: 0.22,
          dArg: 1.28, dGlySer: 1.68, dVal: 0.92, dIle: 0.80, dLeu: 1.28
        };
      case 5:
        return {
          dLys: 1.15, dMet: 0.49, dMC: 0.90, dThr: 0.76, dTrp: 0.21,
          dArg: 1.21, dGlySer: 1.55, dVal: 0.89, dIle: 0.78, dLeu: 1.23
        };
      case 6:
        return {
          dLys: 1.11, dMet: 0.47, dMC: 0.86, dThr: 0.73, dTrp: 0.20,
          dArg: 1.16, dGlySer: 1.49, dVal: 0.85, dIle: 0.75, dLeu: 1.18
        };
      default:
        return {
          dLys: 1.11, dMet: 0.47, dMC: 0.86, dThr: 0.73, dTrp: 0.20,
          dArg: 1.16, dGlySer: 1.49, dVal: 0.85, dIle: 0.75, dLeu: 1.18
        };
    }
  }

  // New: Function: Get AA Phase Targets with Heat Correction (+2%)
  private static get_AA_PhaseTargets(phase: number, temp: number, heatCorr: boolean, humidity: number = 50) {
    const base = this.get_AA_PhaseBaseTargets(phase);
    const hi = this.calculateHeatIndex(temp, humidity);
    const factor = (heatCorr === true || hi >= 30) ? 1.02 : 1.00;

    return {
      dLys: parseFloat((base.dLys * factor).toFixed(3)),
      dMet: parseFloat((base.dMet * factor).toFixed(3)),
      dMC: parseFloat((base.dMC * factor).toFixed(3)),
      dThr: parseFloat((base.dThr * factor).toFixed(3)),
      dTrp: parseFloat((base.dTrp * factor).toFixed(3)),
      dArg: parseFloat((base.dArg * factor).toFixed(3)),
      dGlySer: parseFloat((base.dGlySer * factor).toFixed(3)),
      dVal: parseFloat((base.dVal * factor).toFixed(3)),
      dIle: parseFloat((base.dIle * factor).toFixed(3)),
      dLeu: parseFloat((base.dLeu * factor).toFixed(3)),
      dPhe: parseFloat((base.dLys * factor * AA_RATIOS.dPhe).toFixed(3)),
      dPheTyr: parseFloat((base.dLys * factor * AA_RATIOS.dPheTyr).toFixed(3))
    };
  }

  // New: Function: Get Ca-P Phase Targets
  private static get_CaP_PhaseTargets(phase: number) {
    switch (phase) {
      case 1: return { Ca: 1.10, avP: 0.55 };
      case 2: return { Ca: 0.98, avP: 0.50 };
      case 3: return { Ca: 0.78, avP: 0.42 };
      case 4: return { Ca: 0.70, avP: 0.38 };
      case 5: return { Ca: 0.65, avP: 0.36 };
      default: return { Ca: 0.78, avP: 0.42 };
    }
  }

  // New: Function: Get Electrolyte Phase Targets with Heat Logic
  private static get_Electrolytes_PhaseTargets(phase: number, temp: number, heatCorr: boolean, humidity: number = 50) {
    // Base values (moderate conditions)
    const base: Record<number, { Na: number, K: number, Cl: number }> = {
      1: { Na: 0.20, K: 0.90, Cl: 0.20 },
      2: { Na: 0.20, K: 0.90, Cl: 0.20 },
      3: { Na: 0.19, K: 0.88, Cl: 0.19 },
      4: { Na: 0.19, K: 0.86, Cl: 0.19 },
      5: { Na: 0.18, K: 0.84, Cl: 0.18 }
    };

    const target = base[phase] || base[3];
    let Na = target.Na;
    let K = target.K;
    let Cl = target.Cl;

    // Heat logic
    const hi = this.calculateHeatIndex(temp, humidity);
    if (heatCorr === true || hi >= 30) {
      Na += 0.02; // raise sodium
      Cl -= 0.01; // reduce chloride slightly
    }

    // DEB calculation (mEq/kg)
    // DEB = (Na/0.023) + (K/0.039) - (Cl/0.0355)
    const DEB = (Na / 0.023) + (K / 0.039) - (Cl / 0.0355);

    return {
      Na: parseFloat(Na.toFixed(3)),
      K: parseFloat(K.toFixed(3)),
      Cl: parseFloat(Cl.toFixed(3)),
      DEB: Math.round(DEB)
    };
  }

  // New: Function: Heat Stress Severity Level
  private static get_HeatStressLevel(temp: number, humidity: number = 50): 'None' | 'Mild' | 'Moderate' | 'Severe' {
    const hi = this.calculateHeatIndex(temp, humidity);
    if (hi < 29) return 'None';
    if (hi < 32) return 'Mild';
    if (hi < 36) return 'Moderate';
    return 'Severe';
  }

  // New: Function: Apply Heat Stress Adjustments
  private static apply_HeatStressAdjustments(em: number, sidLys: number, level: string) {
    let adjEm = em;
    let adjLys = sidLys;

    if (level === 'Mild') {
      adjEm += 20;
      adjLys *= 1.01;
    } else if (level === 'Moderate') {
      adjEm += 40;
      adjLys *= 1.02;
    } else if (level === 'Severe') {
      adjEm += 80;
      adjLys *= 1.03;
    }

    return { em: adjEm, sidLys: adjLys };
  }

  // New: Function: Apply Corn Correction
  private static apply_CornCorrection(cornType: 'Syrian' | 'Ukrainian', EM: number, SID_Lys: number) {
    let adjEm = EM;
    let adjLys = SID_Lys;

    if (cornType === 'Syrian') {
      adjEm -= 40;
      adjLys *= 0.985;
    } else if (cornType === 'Ukrainian') {
      adjEm -= 10;
      adjLys *= 0.995;
    }

    return { em: adjEm, sidLys: adjLys };
  }


  // 3. Function: SID Lysine (%)
  private static get_SID_Lys_percent(dLys_req: number, FI_corr: number): number {
    return (dLys_req / FI_corr) * 100;
  }

  // 4. Function: Amino Acid Profile (%)
  private static get_AA_profile(SID_Lys_percent: number): Partial<Nutrition> {
    return {
      dMet: parseFloat((SID_Lys_percent * AA_RATIOS.dMet).toFixed(3)),
      dMetCys: parseFloat((SID_Lys_percent * AA_RATIOS.dMetCys).toFixed(3)),
      dThr: parseFloat((SID_Lys_percent * AA_RATIOS.dThr).toFixed(3)),
      dVal: parseFloat((SID_Lys_percent * AA_RATIOS.dVal).toFixed(3)),
      dIso: parseFloat((SID_Lys_percent * AA_RATIOS.dIso).toFixed(3)),
      dArg: parseFloat((SID_Lys_percent * AA_RATIOS.dArg).toFixed(3)),
      dGlySer: parseFloat((SID_Lys_percent * AA_RATIOS.dGlySer).toFixed(3)),
      dPhe: parseFloat((SID_Lys_percent * AA_RATIOS.dPhe).toFixed(3)),
      dPheTyr: parseFloat((SID_Lys_percent * AA_RATIOS.dPheTyr).toFixed(3))
    };
  }


  // 7. Function: Protein (%)
  private static get_Protein(SID_Lys_percent: number) {
    return {
      Crude_Protein_percent: parseFloat(((SID_Lys_percent * 100) / 5.5).toFixed(2)),
      Digestible_Protein_percent: parseFloat(((SID_Lys_percent * 100) / 6.0).toFixed(2))
    };
  }

  // 12. MASTER FUNCTION: Get Nutrient Targets
  public static calculateIntegratedRequirements(
    phase: number, 
    DG_heat: number, 
    FI_daily: number,
    coeffs: { em: { a: number, b: number }, lys: { a: number, b: number } },
    humidity: number = 50
  ) {
    // 1. Get Base Requirements (Daily Grams/Kcal) for this phase
    // Better mapping for Weekly (1-6) vs Brazilian Ref Phases (0-4)
    const refIndex = Math.min(phase - 1, 4);
    const ref = BRAZILIAN_REF.male[refIndex];
    
    // 2. Performance Factor split: Maintenance (BW) + Growth (DG)
    const ref_dg = ref.fi_tn / 1.75; 
    
    // Age impact factor for maintenance overhead in older birds
    const age_impact = phase >= 5 ? (1.0 + (phase - 4) * 0.02) : 1.0; 
    const growth_factor = DG_heat / (ref_dg || 1);
    
    const em_daily = ref.em_kcal * (0.35 + 0.65 * growth_factor) * age_impact;
    const lys_daily = ref.dLys_g * (0.25 + 0.75 * growth_factor) * age_impact;
    
    // 3. Convert to Dietary Density (kcal/kg and %)
    let em_raw = (FI_daily > 0) ? (em_daily / FI_daily) * 1000 : 3100;
    let lys_raw = (FI_daily > 0) ? (lys_daily / FI_daily) * 100 : 1.15;

    // 4. Apply Syrian Safety Bands and Blending (Alpha = 0.4)
    // Using current phase directly to allow trend in week 6
    const em_final = this.blend_EM_with_FI(phase, 20, false, em_raw, humidity);
    
    // 5. Final SID Lys - Safety bounds relative to week-specific base
    const lys_base = this.get_AA_PhaseBaseTargets(phase).dLys;
    let final_lys = lys_raw;
    
    // Dynamic safety band that reflects age
    const bandSize = phase >= 5 ? 0.06 : 0.08;
    const min_lys = lys_base - bandSize; 
    const max_lys = lys_base + bandSize;
    if (final_lys < min_lys) final_lys = min_lys;
    if (final_lys > max_lys) final_lys = max_lys;

    // Use a proper decreasing lookup mapping 6 weeks to the 5 Syrian phases
    let Ca_target = 0.78;
    let AvP_target = 0.42;

    switch (phase) {
      case 1: 
        Ca_target = 1.10; 
        AvP_target = 0.55; 
        break;
      case 2: 
        Ca_target = 0.98; 
        AvP_target = 0.50; 
        break;
      case 3: 
        Ca_target = 0.78; 
        AvP_target = 0.42; 
        break;
      case 4: 
        Ca_target = 0.74; // Adjusted for middle grower
        AvP_target = 0.40; 
        break;
      case 5: 
        Ca_target = 0.70; 
        AvP_target = 0.38; 
        break;
      case 6: 
        Ca_target = 0.65; 
        AvP_target = 0.36; 
        break;
      default: 
        Ca_target = 0.65; 
        AvP_target = 0.36;
    }

    const DEB_target = 250;

    return {
      EM_target: em_final,
      SID_Lys_target: final_lys,
      Ca_target,
      AvP_target,
      Phase: phase,
      DEB_target
    };
  }

  public static calculatePhase(phase: number, settings: ModelSettings): ModelOutput {
    // Create nutrient targets logic...
    const sex = settings.sex === 'mixed' ? 'male' : settings.sex;
    const ref = BRAZILIAN_REF[sex][phase - 1];

    // Apply performance factor to daily requirements
    const pf = settings.performanceFactor;
    const FI_TN = ref.fi_tn * pf;
    const EM_req = ref.em_kcal * pf;

    // Master Sequence
    const FI_corr = this.get_FI_corr(FI_TN, settings.temperature, settings.heatCorrection, settings.humidity);
    let EM_raw = this.get_EM_percent(EM_req, FI_corr);

    // Apply Heat Stress Severities (Energy only)
    const level = this.get_HeatStressLevel(settings.temperature, settings.humidity);
    let { em: emTarget } = this.apply_HeatStressAdjustments(EM_raw, 0, level);

    // Apply Corn Correction Attributes (Energy only)
    const cornAdj = this.apply_CornCorrection(settings.cornType, emTarget, 0);
    emTarget = cornAdj.em;

    // Apply Energy Adjustment Layer (Blending + Phase Band)
    emTarget = this.blend_EM_with_FI(phase, settings.temperature, settings.heatCorrection, emTarget, settings.humidity);

    // Amino Acid Target Layer
    const AA_targets = this.get_AA_PhaseTargets(phase, settings.temperature, settings.heatCorrection, settings.humidity);
    
    // Static Ca-P and Electrolyte Targets
    const CaP_targets = this.get_CaP_PhaseTargets(phase);
    const Electro_targets = this.get_Electrolytes_PhaseTargets(phase, settings.temperature, settings.heatCorrection, settings.humidity);

    // Apply Corn Correction to Lysine specifically
    let sidLysFinal = AA_targets.dLys;
    if (settings.cornType === 'Syrian') {
      sidLysFinal *= 0.985;
    } else if (settings.cornType === 'Ukrainian') {
      sidLysFinal *= 0.995;
    }

    const { Crude_Protein_percent, Digestible_Protein_percent } = this.get_Protein(sidLysFinal);

    const nutrition: Nutrition = {
      ME: Math.round(emTarget),
      dLys: parseFloat(sidLysFinal.toFixed(3)),
      dMet: AA_targets.dMet,
      dMetCys: AA_targets.dMC,
      dThr: AA_targets.dThr,
      dVal: AA_targets.dVal,
      dIso: AA_targets.dIle,
      dArg: AA_targets.dArg,
      dTry: AA_targets.dTrp,
      dGlySer: AA_targets.dGlySer,
      dLeu: AA_targets.dLeu,
      dPhe: AA_targets.dPhe,
      dPheTyr: AA_targets.dPheTyr,
      Ca: CaP_targets.Ca,
      avP: CaP_targets.avP,
      Na: Electro_targets.Na,
      K: Electro_targets.K,
      Cl: Electro_targets.Cl,
      DEB: Electro_targets.DEB,
      CP: Crude_Protein_percent,
      dCP: Digestible_Protein_percent,
      choline: phase < 3 ? 1500 : 1200,
      choline_g: phase < 3 ? 1.5 : 1.2,
      K_percent: Electro_targets.K,
      Cl_percent: Electro_targets.Cl
    };

    return {
      phase,
      ageRange: `${ref.start}–${ref.end}`,
      temperature: settings.temperature,
      performanceFactor: settings.performanceFactor,
      nutrition
    };
  }
}
