import { SimulationParams } from '../types/simulation';
import { calculateSimulation } from './calculation';

export interface SensitivityCell {
  deltaRate: number;
  rate: number;
  deltaVacancy: number;
  vacancy: number;
  firstYearFcf: number;
  cumulativeFcf10: number;
  fcfDiffVsBase: number;
}

export interface SensitivityMatrixData {
  interestRateDeltas: number[]; // [0, 0.5, 1.0, 1.5, 2.0, 3.0]
  vacancyRateDeltas: number[]; // [0, 2, 5, 10]
  matrix: SensitivityCell[][]; // [rateIndex][vacancyIndex]
}

export function calculateSensitivityMatrix(baseParams: SimulationParams): SensitivityMatrixData {
  const interestRateDeltas = [0, 0.5, 1.0, 1.5, 2.0, 3.0];
  const vacancyRateDeltas = [0, 2, 5, 8, 10];

  const baseResult = calculateSimulation(baseParams);
  const baseFcf = baseResult.summary.firstYearFcf;

  const matrix: SensitivityCell[][] = [];

  for (const deltaRate of interestRateDeltas) {
    const row: SensitivityCell[] = [];
    const testRate = Math.max(0, baseParams.interestRate + deltaRate);

    for (const deltaVac of vacancyRateDeltas) {
      const testVacancy = Math.min(100, Math.max(0, baseParams.vacancyRate + deltaVac));
      const testParams: SimulationParams = {
        ...baseParams,
        interestRate: testRate,
        vacancyRate: testVacancy,
      };

      const res = calculateSimulation(testParams);
      row.push({
        deltaRate,
        rate: testRate,
        deltaVacancy: deltaVac,
        vacancy: testVacancy,
        firstYearFcf: res.summary.firstYearFcf,
        cumulativeFcf10: res.summary.cumulativeFcf10,
        fcfDiffVsBase: res.summary.firstYearFcf - baseFcf,
      });
    }
    matrix.push(row);
  }

  return {
    interestRateDeltas,
    vacancyRateDeltas,
    matrix,
  };
}
