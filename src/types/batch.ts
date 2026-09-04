import { SimulationParams, SimulationResult } from './simulation';

export interface BatchPropertyInput {
  rowNumber: number;
  propertyId: string; // 物件ID
  propertyName: string; // 物件名称
  price: number; // 物件価格（万円）
  buildingRatio: number; // 建物価格割合（%）
  usefulLife: number; // 法定耐用年数（年）
  grossYield: number; // 想定表面利回り（%）
  repaymentMethodText: string; // 返済方式テキスト
  downPaymentRatio: number; // 頭金割合（%）
  interestRate: number; // 借入金利（%）
  loanTermYears: number; // 借入期間（年）
  vacancyRate: number; // 空室率（%）
  rentDropRate: number; // 家賃下落率（%/年）
  managementCostRatio: number; // 運営管理費率（%）
  otherCostRatio: number; // その他経費率（%）
  exitYear: number; // 保有・売却予定年数（年）
  exitCapRate: number; // 売却時想定出口利回り（%）
  rawParams: SimulationParams;
}

export interface BatchValidationError {
  rowNumber: number;
  propertyId?: string;
  propertyName?: string;
  column: string;
  message: string;
}

export interface BatchParseResult {
  validProperties: BatchPropertyInput[];
  errors: BatchValidationError[];
  totalRows: number;
}

export interface BatchSimulationItem {
  input: BatchPropertyInput;
  result: SimulationResult;
}

export interface BatchProcessProgress {
  total: number;
  current: number;
  currentPropertyName: string;
  status: 'idle' | 'parsing' | 'simulating' | 'generating_files' | 'zipping' | 'completed' | 'error';
  errorMessage?: string;
}
