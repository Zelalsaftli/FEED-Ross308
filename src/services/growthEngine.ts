/**
 * Growth & Feed Intake Engine
 * Provides mathematical models for poultry growth and feed intake.
 */

import { levenbergMarquardt as LM } from 'ml-levenberg-marquardt';

export interface ModelParams {
  W_inf: number;
  k: number;
  t0: number;
}

export type ModelType = 'Gompertz' | 'Logistic';
export type Sex = 'male' | 'female';

export class GrowthEngine {
  private growthParams: Record<Sex, Record<ModelType, ModelParams | null>> = {
    male: { Gompertz: null, Logistic: null },
    female: { Gompertz: null, Logistic: null }
  };

  private fiParams: Record<Sex, Record<ModelType, ModelParams | null>> = {
    male: { Gompertz: null, Logistic: null },
    female: { Gompertz: null, Logistic: null }
  };

  /**
   * Fits a model to provided data.
   */
  public fitGrowthModel(sex: Sex, modelType: ModelType, t: number[], bw: number[]) {
    const data = { x: t, y: bw };
    
    // Initial guesses based on user prompt
    const lastBW = bw[bw.length - 1];
    const initialValues = [
      lastBW * 1.05, // W_inf
      modelType === 'Gompertz' ? (sex === 'male' ? 0.1 : 0.09) : (sex === 'male' ? 0.18 : 0.17), // k
      31 // t0
    ];

    const modelFn = (params: number[]) => (x: number) => {
      const [W_inf, k, t0] = params;
      if (modelType === 'Gompertz') {
        return W_inf * Math.exp(-Math.exp(-k * (x - t0)));
      } else {
        return W_inf / (1 + Math.exp(-k * (x - t0)));
      }
    };

    const options = {
      damping: 0.1,
      initialValues,
      minValues: [lastBW, 0.01, 10],
      maxValues: [10000, 0.5, 60],
      gradientDifference: 10e-3,
      maxIterations: 100,
      errorTolerance: 10e-4
    };

    try {
      const result = LM(data, modelFn, options);
      const [W_inf, k, t0] = result.parameterValues;
      this.growthParams[sex][modelType] = { W_inf, k, t0 };
      return this.growthParams[sex][modelType];
    } catch (e) {
      console.error(`Error fitting growth model for ${sex} ${modelType}:`, e);
      return null;
    }
  }

  public fitFIModel(sex: Sex, modelType: ModelType, t: number[], fi_cum: number[]) {
    const data = { x: t, y: fi_cum };
    const lastFI = fi_cum[fi_cum.length - 1];
    const initialValues = [
      lastFI * 1.05, // FI_inf
      modelType === 'Gompertz' ? (sex === 'male' ? 0.1 : 0.09) : (sex === 'male' ? 0.18 : 0.17), // k
      31 // t0
    ];

    const modelFn = (params: number[]) => (x: number) => {
      const [FI_inf, k, t0] = params;
      if (modelType === 'Gompertz') {
        return FI_inf * Math.exp(-Math.exp(-k * (x - t0)));
      } else {
        return FI_inf / (1 + Math.exp(-k * (x - t0)));
      }
    };

    const options = {
      damping: 0.1,
      initialValues,
      minValues: [lastFI, 0.01, 10],
      maxValues: [20000, 0.5, 60],
      gradientDifference: 10e-3,
      maxIterations: 100,
      errorTolerance: 10e-4
    };

    try {
      const result = LM(data, modelFn, options);
      const [FI_inf, k, t0] = result.parameterValues;
      this.fiParams[sex][modelType] = { W_inf: FI_inf, k, t0 }; // Using W_inf key for generic storage
      return this.fiParams[sex][modelType];
    } catch (e) {
      console.error(`Error fitting FI model for ${sex} ${modelType}:`, e);
      return null;
    }
  }

  // Core Predictors
  public predictBW(sex: Sex, t: number, model: ModelType): number {
    const params = this.growthParams[sex][model];
    if (!params) return 0;
    const { W_inf, k, t0 } = params;
    if (model === 'Gompertz') {
      return W_inf * Math.exp(-Math.exp(-k * (t - t0)));
    } else {
      return W_inf / (1 + Math.exp(-k * (t - t0)));
    }
  }

  public predictGrowthRate(sex: Sex, t: number, model: ModelType): number {
    const params = this.growthParams[sex][model];
    if (!params) return 0;
    const { W_inf, k, t0 } = params;
    const bw = this.predictBW(sex, t, model);
    if (model === 'Gompertz') {
      return bw * k * Math.exp(-k * (t - t0));
    } else {
      return (W_inf * k * Math.exp(-k * (t - t0))) / Math.pow(1 + Math.exp(-k * (t - t0)), 2);
    }
  }

  public predictFICumulative(sex: Sex, t: number, model: ModelType): number {
    const params = this.fiParams[sex][model];
    if (!params) return 0;
    const { W_inf: FI_inf, k, t0 } = params;
    if (model === 'Gompertz') {
      return FI_inf * Math.exp(-Math.exp(-k * (t - t0)));
    } else {
      return FI_inf / (1 + Math.exp(-k * (t - t0)));
    }
  }

  public predictFIDaily(sex: Sex, t: number, model: ModelType): number {
    if (t <= 0) return 0;
    return this.predictFICumulative(sex, t, model) - this.predictFICumulative(sex, t - 1, model);
  }

  public getParams(sex: Sex, type: 'growth' | 'fi', model: ModelType) {
    return type === 'growth' ? this.growthParams[sex][model] : this.fiParams[sex][model];
  }
}

export const growthEngine = new GrowthEngine();
