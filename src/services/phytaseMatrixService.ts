
export interface PhytaseInputs {
  product_concentration_fyt_per_g: number;
  inclusion_rate_g_per_ton: number;
  corrected_phytate_p: number;
  calcium_percent: number;
  available_phosphorus_percent: number;
  protease_present: 'yes' | 'no';
  carbohydrase_present: 'yes' | 'no';
  acidifier_present: 'yes' | 'no';
  accessibility_factor_percent: number;
}

export interface PhytaseMatrixResults {
  dose_FYT_per_kg: number;
  dose_factor: number;
  ca_p_ratio: number;
  ca_p_factor: number;
  enzyme_factor: number;
  matrix_raw: Record<string, number>;
  matrix_summer_mode: Record<string, number>;
}

export class PhytaseMatrixService {
  public static calculate(inputs: PhytaseInputs): PhytaseMatrixResults {
    const {
      product_concentration_fyt_per_g: conc,
      inclusion_rate_g_per_ton: rate,
      calcium_percent: Ca,
      available_phosphorus_percent: AvP,
      protease_present: prot,
      carbohydrase_present: carb,
      acidifier_present: acid,
    } = inputs;

    // STEP 1 — Dose in FYT/kg
    const dose_FYT_per_kg = (conc * rate) / 1000;
    const ref_dose = 1600;
    const dose_ratio = dose_FYT_per_kg / ref_dose;
    
    // dose_factor = 1 + 0.10 * ln(dose_ratio), clamped [0.90, 1.10]
    let dose_factor = 1 + 0.10 * Math.log(Math.max(dose_ratio, 0.001));
    dose_factor = Math.min(Math.max(dose_factor, 0.90), 1.10);

    // STEP 2 — Ca:P ratio factor
    const ca_p_ratio = AvP > 0 ? Ca / AvP : 2.0;
    const ratio_deviation = ca_p_ratio - 2.0;
    
    // ca_p_factor = 1 - 0.05 * ratio_deviation, clamped [0.90, 1.10]
    let ca_p_factor = 1 - 0.05 * ratio_deviation;
    ca_p_factor = Math.min(Math.max(ca_p_factor, 0.90), 1.10);

    // STEP 3 — Enzyme factors
    const protease_factor = prot === 'yes' ? 1.03 : 1.00;
    const carbohydrase_factor = carb === 'yes' ? 1.03 : 1.00;
    const acidifier_factor = acid === 'yes' ? 1.02 : 1.00;
    const enzyme_factor = protease_factor * carbohydrase_factor * acidifier_factor;

    // modifier
    const modifier = dose_factor * ca_p_factor * enzyme_factor;

    // STEP 4 — DSM base matrix
    const base: Record<string, number> = {
      AvP: 0.21,
      Ca: 0.175,
      Na: 0.0205,
      Protein: 0.85,
      Lys: 0.03725,
      MetCys: 0.0425,
      Thr: 0.0435,
      Arg: 0.0425,
      Val: 0.04325,
      Iso: 0.03825,
      Leu: 0.0565,
      GlySer: 0.0864,
      ME: 93 // kcal/kg
    };

    // STEP 5 — Apply modifiers
    const raw: Record<string, number> = {};
    const summer: Record<string, number> = {};

    Object.keys(base).forEach(key => {
      raw[key] = base[key] * modifier;
      summer[key] = raw[key] * 0.70;
    });

    return {
      dose_FYT_per_kg,
      dose_factor,
      ca_p_ratio,
      ca_p_factor,
      enzyme_factor,
      matrix_raw: raw,
      matrix_summer_mode: summer
    };
  }
}
