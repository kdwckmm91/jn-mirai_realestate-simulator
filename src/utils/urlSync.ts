import { DEFAULT_PARAMS } from './calculation';
import { SimulationParams } from '../types/simulation';

/**
 * URLクエリパラメータからシミュレーション設定を復元
 */
export function getParamsFromUrl(): SimulationParams {
  if (typeof window === 'undefined') return { ...DEFAULT_PARAMS };

  const searchParams = new URLSearchParams(window.location.search);
  const params: SimulationParams = { ...DEFAULT_PARAMS };

  const getNum = (key: string, defaultVal: number): number => {
    const val = searchParams.get(key);
    if (val !== null && !isNaN(Number(val))) {
      return Number(val);
    }
    return defaultVal;
  };

  if (searchParams.has('p')) params.price = getNum('p', params.price);
  if (searchParams.has('br')) params.buildingRatio = getNum('br', params.buildingRatio);
  if (searchParams.has('ul')) params.usefulLife = getNum('ul', params.usefulLife);
  if (searchParams.has('gy')) params.grossYield = getNum('gy', params.grossYield);
  if (searchParams.has('dp')) params.downPaymentRatio = getNum('dp', params.downPaymentRatio);
  if (searchParams.has('ir')) params.interestRate = getNum('ir', params.interestRate);
  if (searchParams.has('lt')) params.loanTermYears = getNum('lt', params.loanTermYears);
  if (searchParams.has('rm')) {
    const rm = searchParams.get('rm');
    if (rm === 'equal-principal' || rm === 'equal-payment') {
      params.repaymentMethod = rm;
    }
  }
  if (searchParams.has('vr')) params.vacancyRate = getNum('vr', params.vacancyRate);
  if (searchParams.has('rd')) params.rentDropRate = getNum('rd', params.rentDropRate);
  if (searchParams.has('mc')) params.managementCostRatio = getNum('mc', params.managementCostRatio);
  if (searchParams.has('oc')) params.otherCostRatio = getNum('oc', params.otherCostRatio);
  if (searchParams.has('es')) params.executiveSalary = getNum('es', params.executiveSalary);
  if (searchParams.has('tr')) params.taxRate = getNum('tr', params.taxRate);
  if (searchParams.has('ey')) params.exitYear = getNum('ey', params.exitYear);
  if (searchParams.has('ec')) params.exitCapRate = getNum('ec', params.exitCapRate);
  if (searchParams.has('tx')) params.capitalGainTaxRate = getNum('tx', params.capitalGainTaxRate);
  if (searchParams.has('ex')) params.exitCostRatio = getNum('ex', params.exitCostRatio);

  return params;
}

/**
 * パラメータをURLクエリ文字列に反映
 */
export function syncParamsToUrl(params: SimulationParams): void {
  if (typeof window === 'undefined') return;

  const sp = new URLSearchParams();
  sp.set('p', String(params.price));
  sp.set('br', String(params.buildingRatio));
  sp.set('ul', String(params.usefulLife));
  sp.set('gy', String(params.grossYield));
  sp.set('dp', String(params.downPaymentRatio));
  sp.set('ir', String(params.interestRate));
  sp.set('lt', String(params.loanTermYears));
  sp.set('rm', params.repaymentMethod);
  sp.set('vr', String(params.vacancyRate));
  sp.set('rd', String(params.rentDropRate));
  sp.set('mc', String(params.managementCostRatio));
  sp.set('oc', String(params.otherCostRatio));
  sp.set('es', String(params.executiveSalary));
  sp.set('tr', String(params.taxRate));
  sp.set('ey', String(params.exitYear));
  sp.set('ec', String(params.exitCapRate));
  sp.set('tx', String(params.capitalGainTaxRate));
  sp.set('ex', String(params.exitCostRatio));

  const newUrl = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * 共有用URLリンクをコピー
 */
export async function copyShareUrl(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
