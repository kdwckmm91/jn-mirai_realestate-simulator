export type RepaymentMethod = 'equal-principal' | 'equal-payment'; // 元金均等 / 元利均等

export interface SimulationParams {
  // 物件情報
  price: number; // 物件価格（万円）
  buildingRatio: number; // 建物価格割合（%）
  usefulLife: number; // 建物法定耐用年数（年）
  grossYield: number; // 想定表面利回り（%）

  // 融資条件
  downPaymentRatio: number; // 頭金割合（%）
  interestRate: number; // 借入金利（%）
  loanTermYears: number; // 借入期間（年）
  repaymentMethod: RepaymentMethod; // 返済方式

  // 運用条件
  vacancyRate: number; // 空室率（%）
  rentDropRate: number; // 家賃下落率（%/年）
  managementCostRatio: number; // 運営管理費率（%）
  otherCostRatio: number; // その他経費率（%）
  executiveSalary: number; // 役員報酬（万円/年）
  taxRate: number; // 法人税等実効税率（%）

  // 出口戦略（Phase 2）
  exitYear: number; // 保有・売却予定年数（年）
  exitCapRate: number; // 想定出口利回り（%）
  capitalGainTaxRate: number; // 譲渡所得税率（%）
  exitCostRatio: number; // 売却経費率（%）
}

export interface AnnualData {
  year: number; // 年次 (1〜35)
  beginningBalance: number; // 期首借入金残高（万円）
  grossRent: number; // 想定満室家賃（万円）
  effectiveRent: number; // 実効家賃収入（万円）
  managementCost: number; // 運営管理費（万円）
  otherCost: number; // その他経費（万円）
  executiveSalary: number; // 役員報酬（万円）
  depreciation: number; // 減価償却費（万円）
  interestPayment: number; // 支払利息（万円）
  preTaxProfit: number; // 税引前利益（万円）
  corporateTax: number; // 法人税等（万円）
  postTaxProfit: number; // 税引後利益（万円）
  principalRepayment: number; // 元本返済額（万円）
  totalRepayment: number; // 総返済額（万円）
  fcf: number; // フリーキャッシュフロー（万円）
  cumulativeFcf: number; // 累計FCF（万円）
  endingBalance: number; // 期末借入金残高（万円）
  isDeadCross: boolean; // デッドクロス該当年かどうか
}

export interface ExitAnalysisResult {
  exitYear: number;
  grossRentAtExit: number; // 売却年の想定家賃収入（万円）
  expectedSalePrice: number; // 想定売却価格（万円）
  buildingBookValue: number; // 売却時簿価・建物（万円）
  landValue: number; // 土地価格（万円）
  totalBookValue: number; // 売却時総簿価（万円）
  saleExpenses: number; // 売却経費（万円）
  capitalGain: number; // 譲渡益（万円）
  capitalGainTax: number; // 譲渡所得税（万円）
  loanBalanceAtExit: number; // 売却時ローン残高（万円）
  netCashAtExit: number; // 売却時手残り額（万円）
  cumulativeFcfUntilExit: number; // 保有期間中の累計FCF（万円）
  totalReturnCash: number; // 総手残り額（万円）
  initialEquity: number; // 初期自己資金（頭金）（万円）
  irr: number | null; // 内部収益率 (%)
}

export interface SimulationSummary {
  landPrice: number; // 土地価格（万円）
  buildingPrice: number; // 建物価格（万円）
  initialDownPayment: number; // 頭金（万円）
  initialLoanAmount: number; // 借入総額（万円）
  annualDepreciation: number; // 年間減価償却費（耐用年数期間）（万円）
  firstYearFcf: number; // 初年度年間FCF（万円）
  firstYearMonthlyRepayment: number; // 毎月のローン返済額（初年度月平均）（万円）
  cumulativeFcf10: number; // 10年累計CF（万円）
  cumulativeFcf20: number; // 20年累計CF（万円）
  cumulativeFcf35: number; // 35年累計CF（万円）
  deadCrossYear: number | null; // デッドクロス発生年（最初の年）
}

export interface SimulationResult {
  params: SimulationParams;
  summary: SimulationSummary;
  annualList: AnnualData[];
  exitResult: ExitAnalysisResult;
}

export interface ComparisonPattern {
  id: 'A' | 'B' | 'C';
  name: string;
  params: SimulationParams;
  color: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: string;
  params: SimulationParams;
}
